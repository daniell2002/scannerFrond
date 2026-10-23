/*
 * Escáner de documentos en el navegador (OpenCV.js):
 * detecta los bordes de la hoja, la endereza (corrige la perspectiva) y aplica
 * filtros para que se lea mejor.
 *
 * OpenCV pesa ~10 MB: se carga solo cuando se abre la cámara (loadCv) y queda
 * en memoria para las siguientes capturas.
 *
 * Las funciones *Mat trabajan sobre cv.Mat y no tocan el DOM (se pueden probar
 * en Node); las demás reciben y devuelven <canvas>.
 */

// Se sirve como archivo aparte (no entra al bundle de la app)
import cvUrl from '@techstark/opencv-js/dist/opencv.js?url'

let cvPromise = null

/**
 * Carga OpenCV una sola vez. Rechaza si no se pudo descargar o iniciar.
 * window.cv es "thenable" (ver readyCv): nunca se pasa directo a resolve(),
 * sino envuelto en un objeto.
 */
export function loadCv() {
  cvPromise ??= new Promise((resolve, reject) => {
    if (window.cv) return resolve({ mod: window.cv })
    const s = document.createElement('script')
    s.src = cvUrl
    s.async = true
    s.onload = () => resolve({ mod: window.cv })
    s.onerror = () => reject(new Error('No se pudo descargar OpenCV'))
    document.head.appendChild(s)
  })
    .then(({ mod }) => readyCv(mod))
    .catch(e => { cvPromise = null; throw e })
  return cvPromise
}

/**
 * Espera a que el runtime de OpenCV (WebAssembly) esté listo.
 * El módulo de Emscripten trae un método `then` propio: si se resuelve una
 * promesa con él, la promesa lo vuelve a "esperar" sin fin. Por eso se quita
 * antes de devolverlo.
 */
export function readyCv(mod, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    if (!mod) return reject(new Error('OpenCV no está disponible'))
    const started = Date.now()
    const tick = () => {
      if (mod.Mat) {
        delete mod.then
        if (typeof mod.then === 'function') mod.then = undefined // por si venía heredado
        return resolve(mod)
      }
      if (Date.now() - started > timeoutMs) return reject(new Error('OpenCV no terminó de iniciar'))
      setTimeout(tick, 50)
    }
    tick()
  })
}

/* ── Geometría ── */

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

/** Ordena 4 puntos: superior izquierda, superior derecha, inferior derecha, inferior izquierda. */
export function orderCorners(pts) {
  const bySum  = [...pts].sort((a, b) => (a.x + a.y) - (b.x + b.y))
  const byDiff = [...pts].sort((a, b) => (a.x - a.y) - (b.x - b.y))
  return [bySum[0], byDiff[3], bySum[3], byDiff[0]]
}

/** Esquinas por defecto cuando no se detecta la hoja: casi toda la imagen. */
export function defaultCorners(width, height, inset = 0.03) {
  const dx = width * inset, dy = height * inset
  return [
    { x: dx, y: dy }, { x: width - dx, y: dy },
    { x: width - dx, y: height - dy }, { x: dx, y: height - dy },
  ]
}

/* ── Detección de bordes ── */

const DETECT_SIDE = 900 // se detecta sobre una copia reducida: es más rápido y estable

/**
 * Cuadrilátero convexo más grande de una lista de contornos: { pts, area } o null.
 * Se descarta el que ocupa casi toda la foto: es el marco de la imagen, no una hoja.
 */
function largestQuad(cv, contours, minArea, maxArea) {
  let best = null
  for (let i = 0; i < contours.size(); i++) {
    const c = contours.get(i)
    const area = cv.contourArea(c)
    if (area > minArea && area < maxArea && area > (best?.area ?? 0)) {
      // La envolvente convexa ignora mellas del contorno (dedos, esquinas dobladas)
      const hull = new cv.Mat()
      cv.convexHull(c, hull, false, true)
      const approx = new cv.Mat()
      cv.approxPolyDP(hull, approx, 0.02 * cv.arcLength(hull, true), true)
      hull.delete()
      if (approx.rows === 4 && cv.isContourConvex(approx)) {
        const pts = []
        for (let j = 0; j < 4; j++) pts.push({ x: approx.data32S[j * 2], y: approx.data32S[j * 2 + 1] })
        best = { pts, area }
      }
      approx.delete()
    }
    c.delete()
  }
  return best
}

/** Contornos de una imagen binaria → cuadrilátero más grande. */
function quadFromBinary(cv, bin, mode, minArea, maxArea) {
  const contours = new cv.MatVector()
  const hierarchy = new cv.Mat()
  cv.findContours(bin, contours, hierarchy, mode, cv.CHAIN_APPROX_SIMPLE)
  const quad = largestQuad(cv, contours, minArea, maxArea)
  contours.delete()
  hierarchy.delete()
  return quad
}

/**
 * Busca la hoja en la imagen (cv.Mat RGBA o RGB). Devuelve sus 4 esquinas en
 * coordenadas de la imagen original, ordenadas, o null si no la encuentra.
 *
 * Se prueban varios métodos y gana la hoja más grande:
 *  - bordes (Canny), todos los contornos: sigue el contorno aunque el papel y
 *    el fondo se parezcan;
 *  - bordes, solo el contorno exterior: una sombra o un pliegue dentro de la
 *    hoja no la parte en dos;
 *  - umbral automático (Otsu): separa el papel claro del fondo.
 */
export function detectCornersMat(cv, src) {
  const scale = Math.min(1, DETECT_SIDE / Math.max(src.cols, src.rows))
  const small = new cv.Mat()
  cv.resize(src, small, new cv.Size(Math.round(src.cols * scale), Math.round(src.rows * scale)), 0, 0, cv.INTER_AREA)

  const gray = new cv.Mat()
  cv.cvtColor(small, gray, src.channels() === 4 ? cv.COLOR_RGBA2GRAY : cv.COLOR_RGB2GRAY)
  cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0)

  const total   = small.cols * small.rows
  const minArea = total * 0.15 // la hoja debe ocupar al menos el 15 % de la foto
  const maxArea = total * 0.98
  const kernel  = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5))
  const bin     = new cv.Mat()
  let byEdges, byOutline, byThreshold

  try {
    cv.Canny(gray, bin, 50, 150)
    cv.dilate(bin, bin, kernel)
    byEdges   = quadFromBinary(cv, bin, cv.RETR_LIST, minArea, maxArea)
    byOutline = quadFromBinary(cv, bin, cv.RETR_EXTERNAL, minArea, maxArea)

    cv.threshold(gray, bin, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU)
    cv.morphologyEx(bin, bin, cv.MORPH_CLOSE, kernel)
    byThreshold = quadFromBinary(cv, bin, cv.RETR_EXTERNAL, minArea, maxArea)
  } finally {
    ;[small, gray, kernel, bin].forEach(m => m.delete())
  }

  const quad = [byEdges, byOutline, byThreshold].filter(Boolean).sort((a, b) => b.area - a.area)[0]
  return quad ? orderCorners(quad.pts.map(p => ({ x: p.x / scale, y: p.y / scale }))) : null
}

/* ── Enderezar ── */

// Lado largo máximo de la hoja enderezada: el mismo al que se reducen las fotos
// antes de subirlas (utils/image.js), así los filtros no procesan píxeles de más
export const MAX_OUTPUT_SIDE = 2200

/** Recorta y endereza la hoja definida por 4 esquinas (ordenadas). */
export function warpMat(cv, src, corners, maxSide = MAX_OUTPUT_SIDE) {
  const [tl, tr, br, bl] = corners
  const w = Math.max(dist(tl, tr), dist(bl, br))
  const h = Math.max(dist(tl, bl), dist(tr, br))
  const k = Math.min(1, maxSide / Math.max(w, h))
  const width  = Math.round(w * k)
  const height = Math.round(h * k)
  // Se recorta un margen mínimo para que no quede una línea del fondo en el borde
  const m = Math.round(Math.min(width, height) * 0.01)
  const from = cv.matFromArray(4, 1, cv.CV_32FC2, [tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y])
  const to   = cv.matFromArray(4, 1, cv.CV_32FC2, [-m, -m, width + m, -m, width + m, height + m, -m, height + m])
  const M = cv.getPerspectiveTransform(from, to)
  const out = new cv.Mat()
  cv.warpPerspective(src, out, M, new cv.Size(width, height), cv.INTER_LINEAR, cv.BORDER_REPLICATE)
  ;[from, to, M].forEach(m => m.delete())
  return out
}

/* ── Filtros ── */

export const FILTERS = [
  { key: 'original', label: 'Original',        icon: 'fa-image' },
  { key: 'enhanced', label: 'Mejorada',        icon: 'fa-wand-magic-sparkles' },
  { key: 'gray',     label: 'Grises',          icon: 'fa-droplet-slash' },
  { key: 'bw',       label: 'Blanco y negro',  icon: 'fa-circle-half-stroke' },
]

/**
 * Quita sombras e iluminación desigual de un canal: estima el fondo (el papel)
 * borrando el texto con una dilatación + desenfoque, y divide por él.
 * El fondo varía suave, así que se estima sobre una copia a 1/4 (mucho más rápido).
 */
function flattenChannel(cv, ch) {
  const small = new cv.Mat()
  const bg = new cv.Mat()
  cv.resize(ch, small, new cv.Size(Math.max(1, ch.cols >> 2), Math.max(1, ch.rows >> 2)), 0, 0, cv.INTER_AREA)
  const k = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5))
  cv.dilate(small, small, k)
  cv.medianBlur(small, small, 7)
  cv.resize(small, bg, new cv.Size(ch.cols, ch.rows), 0, 0, cv.INTER_LINEAR)
  cv.divide(ch, bg, ch, 255)
  ;[small, bg, k].forEach(m => m.delete())
}

/* ── Nitidez ── */

export const SHARPNESS = [
  { key: 'none',   label: 'No' },
  { key: 'medium', label: 'Media' },
  { key: 'high',   label: 'Alta' },
]

// Realce de bordes con un kernel 3×3: cada píxel se separa de sus vecinos según
// la intensidad. Es el enfoque clásico para texto y, a diferencia de un
// desenfoque gaussiano, es rápido en el navegador (unas decenas de ms).
const SHARPEN = { medium: 0.6, high: 1.2 }

/** Devuelve un Mat nuevo con más nitidez (o una copia si level = 'none'). */
export function sharpenMat(cv, src, level = 'none') {
  const out = new cv.Mat()
  const a = SHARPEN[level]
  if (!a) { src.copyTo(out); return out }
  const k = cv.matFromArray(3, 3, cv.CV_32F, [0, -a, 0, -a, 1 + 4 * a, -a, 0, -a, 0])
  cv.filter2D(src, out, -1, k, new cv.Point(-1, -1), 0, cv.BORDER_REPLICATE)
  k.delete()
  return out
}

/**
 * Devuelve un Mat nuevo (RGBA) con el filtro aplicado. La nitidez se aplica
 * antes del filtro, así también mejora el umbral del blanco y negro.
 */
export function filterMat(cv, src, filter, sharpness = 'none') {
  if (sharpness !== 'none') {
    const sharp = sharpenMat(cv, src, sharpness)
    try { return applyFilter(cv, sharp, filter) } finally { sharp.delete() }
  }
  return applyFilter(cv, src, filter)
}

function applyFilter(cv, src, filter) {
  const out = new cv.Mat()
  const rgba = src.channels() === 4

  if (filter === 'enhanced') {
    // Color: se aplana cada canal (sin sombras, papel blanco) y se estira el contraste
    const rgb = new cv.Mat()
    if (rgba) cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB)
    else src.copyTo(rgb)
    const chans = new cv.MatVector()
    cv.split(rgb, chans)
    for (let i = 0; i < 3; i++) {
      const ch = chans.get(i)
      flattenChannel(cv, ch)
      cv.normalize(ch, ch, 0, 255, cv.NORM_MINMAX)
      chans.set(i, ch)
      ch.delete()
    }
    cv.merge(chans, rgb)
    cv.cvtColor(rgb, out, cv.COLOR_RGB2RGBA)
    ;[rgb, chans].forEach(m => m.delete())
    return out
  }

  if (filter === 'gray' || filter === 'bw') {
    const gray = new cv.Mat()
    cv.cvtColor(src, gray, rgba ? cv.COLOR_RGBA2GRAY : cv.COLOR_RGB2GRAY)
    flattenChannel(cv, gray)
    cv.normalize(gray, gray, 0, 255, cv.NORM_MINMAX)
    if (filter === 'bw') {
      // Tipo fotocopia: umbral adaptativo para que el texto quede negro sobre blanco
      cv.adaptiveThreshold(gray, gray, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 31, 12)
    }
    cv.cvtColor(gray, out, cv.COLOR_GRAY2RGBA)
    gray.delete()
    return out
  }

  // original
  if (rgba) src.copyTo(out)
  else cv.cvtColor(src, out, cv.COLOR_RGB2RGBA)
  return out
}

/* ── Envolturas para <canvas> ── */

/** Esquinas de la hoja en el canvas, o null si no se detecta. */
export function detectCorners(cv, canvas) {
  const src = cv.imread(canvas)
  try { return detectCornersMat(cv, src) } finally { src.delete() }
}

/** Canvas nuevo con la hoja recortada, enderezada y filtrada. */
export function processDocument(cv, canvas, corners, filter = 'original', sharpness = 'none') {
  const src = cv.imread(canvas)
  const warped = warpMat(cv, src, corners)
  const filtered = filterMat(cv, warped, filter, sharpness)
  const out = document.createElement('canvas')
  cv.imshow(out, filtered)
  ;[src, warped, filtered].forEach(m => m.delete())
  return out
}

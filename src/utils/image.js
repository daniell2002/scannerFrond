// Reduce las fotos antes de subirlas. Una página capturada a 8 MP pesa 2–4 MB;
// a 2200 px por el lado largo (≈ 200 ppp en hoja carta) sigue siendo legible
// y queda en unos 300–700 KB, así que la orden se guarda mucho más rápido.

const MAX_SIDE  = 2200
const QUALITY   = 0.82
const SKIP_BYTES = 600 * 1024 // las que ya son livianas se dejan tal cual

export async function compressImage(file, { maxSide = MAX_SIDE, quality = QUALITY } = {}) {
  if (!file?.type?.startsWith('image/') || file.type === 'image/gif') return file

  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file // formato que el navegador no puede leer (p. ej. HEIC): se sube el original
  }

  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  if (scale === 1 && file.size <= SKIP_BYTES) { bitmap.close?.(); return file }

  const canvas = document.createElement('canvas')
  canvas.width  = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()

  const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', quality))
  // Si por algún motivo no quedó más liviana, se conserva la original
  if (!blob || blob.size >= file.size) return file
  const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
  return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
}

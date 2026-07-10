<template>
  <section class="scanner-page">
    <div class="container-lg">
      <div class="scanner-layout">

        <!-- ══ PANEL IZQUIERDO ══ -->
        <div class="left-panel">

          <!-- Cabecera azul -->
          <div class="left-header">
            <div class="left-header-icon">
              <i class="fas fa-qrcode"></i>
            </div>
            <div>
              <h2 class="left-header-title">Registrar orden</h2>
              <p class="left-header-sub">
                {{ isOperario ? sedeNombre : 'Logiconnet · Órdenes de producción' }}
              </p>
            </div>
          </div>

          <!-- Cuerpo del formulario -->
          <div class="left-body">

            <div class="scan-alert">{{ lastScanMessage }}</div>

            <!-- Zona de foto -->
            <label class="photo-drop" :class="{
              'scanning': ocrState==='scanning',
              'done':     ocrState==='done',
              'manual':   ocrState==='manual',
              'has-photo': orderPhoto,
            }">
              <input type="file" accept="image/*"
                style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%"
                @change="onPhoto" :disabled="ocrState==='scanning'" />

              <div class="photo-drop-content">
                <div class="photo-drop-icon">
                  <span v-if="ocrState==='scanning'" class="spin-icon"></span>
                  <i v-else-if="ocrState==='done'"   class="fas fa-check-circle" style="color:var(--success)"></i>
                  <i v-else-if="orderPhoto"           class="fas fa-image"></i>
                  <i v-else                           class="fas fa-camera"></i>
                </div>
                <div class="photo-drop-text">
                  <span class="photo-drop-main">
                    {{ ocrState==='scanning' ? 'Leyendo código de la orden…'
                       : ocrState==='done'   ? 'Código detectado automáticamente'
                       : orderPhoto          ? 'Foto cargada — click para cambiar'
                       :                      'Subir foto de la orden' }}
                  </span>
                  <span class="photo-drop-sub">
                    {{ ocrState==='done'    ? `Código: ${orderCode}`
                       : ocrState==='manual' ? 'No detectado — ingresa el código a mano'
                       : ocrState==='scanning' ? ''
                       :                       'El sistema leerá el código automáticamente' }}
                  </span>
                </div>
              </div>
            </label>

            <!-- Campos -->
            <div class="fields-block">

              <div class="field">
                <label class="flabel">
                  Código de orden
                  <span v-if="ocrState==='done'" class="fauto">auto</span>
                </label>
                <div class="finput-wrap" :class="{ filled: orderCode }">
                  <i class="fas fa-barcode ficon"></i>
                  <input v-model="orderCode" type="text" class="finput" placeholder="OP-240501 ó 7465" />
                  <button v-if="orderCode" class="fclear" @click.prevent="orderCode=''">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>

              <div class="field">
                <label class="flabel">Nombre del producto <span class="freq">*</span></label>
                <div class="finput-wrap" :class="{ filled: orderName }">
                  <i class="fas fa-tag ficon"></i>
                  <input v-model="orderName" type="text" class="finput" placeholder="Canaleta galvanizada 4×2" />
                </div>
              </div>

              <div class="field">
                <label class="flabel">Sede de producción</label>
                <!-- Operario: sede fija -->
                <div v-if="isOperario" class="finput-wrap filled">
                  <i class="fas fa-map-marker-alt ficon"></i>
                  <span class="finput" style="display:flex;align-items:center;color:var(--ink-900)">{{ sedeNombre }}</span>
                  <span class="sede-lock"><i class="fas fa-lock"></i></span>
                </div>
                <!-- Admin: selector libre -->
                <div v-else class="finput-wrap" :class="{ filled: true }">
                  <i class="fas fa-building ficon"></i>
                  <select v-model="orderSede" class="finput fselect">
                    <option v-for="s in ordersStore.sedes" :key="s.code" :value="s.code">{{ s.name }}</option>
                  </select>
                </div>
              </div>

            </div>

            <!-- CTA -->
            <button class="btn-cta" :class="{ ready: canSubmit }" :disabled="!canSubmit" @click="submit">
              <span class="btn-cta-inner">
                <i class="fas fa-paper-plane"></i>
                <span>Registrar en órdenes del día</span>
              </span>
              <span v-if="!orderName.trim() && orderCode.trim()" class="btn-cta-hint">falta el nombre del producto</span>
            </button>

          </div>
        </div>

        <!-- ══ PANEL DERECHO ══ -->
        <div class="right-panel">

          <!-- Vacío -->
          <div v-if="!lastOrder && !orderPhoto" class="right-empty">
            <div class="empty-icon-wrap">
              <i class="fas fa-file-invoice"></i>
            </div>
            <p class="empty-title">Sin orden cargada</p>
            <p class="empty-body">Sube la foto de una orden de producción. El sistema leerá el código desde la esquina superior derecha. Si no lo detecta, ingrésalo manualmente.</p>
          </div>

          <!-- Foto sin registrar -->
          <div v-else-if="!lastOrder && orderPhoto" class="photo-viewer">
            <div class="photo-viewer-bar">
              <span><i class="fas fa-file-image me-2"></i>Vista previa</span>
              <span class="photo-viewer-badge">
                <i class="fas fa-crosshairs me-1"></i>Código en esquina superior derecha
              </span>
            </div>
            <img :src="orderPhoto" class="photo-viewer-img" alt="Orden" />
          </div>

          <!-- Orden registrada -->
          <div v-else-if="lastOrder" class="order-result">

            <!-- Banner -->
            <div class="result-banner">
              <div class="result-banner-inner">
                <div class="result-banner-left">
                  <span class="result-eyebrow"><i class="fas fa-check-circle me-1"></i>Orden registrada</span>
                  <h2 class="result-name">{{ lastOrder.product }}</h2>
                  <span class="result-code-tag">{{ lastOrder.code }}</span>
                </div>
                <div class="result-banner-right">
                  <div class="result-stat">
                    <span class="result-stat-label">Sede</span>
                    <span class="result-stat-val">{{ lastOrder.sedeInfo.name }}</span>
                  </div>
                  <div class="result-stat">
                    <span class="result-stat-label">Operador</span>
                    <span class="result-stat-val">{{ lastOrder.operator }}</span>
                  </div>
                  <div class="result-stat">
                    <span class="result-stat-label">Avance</span>
                    <span class="result-stat-val">{{ lastOrder.completionRate }}%</span>
                  </div>
                </div>
              </div>
              <div class="result-prog-wrap">
                <div class="result-prog-track">
                  <div class="result-prog-fill" :style="{ width:`${lastOrder.completionRate}%` }"></div>
                </div>
                <span class="result-prog-pct">{{ lastOrder.completionRate }}%</span>
              </div>
            </div>

            <!-- Animación de registro -->
            <div class="model-block">
              <div class="model-block-head">
                <span class="model-block-title"><i class="fas fa-check-circle me-2"></i>Orden registrada</span>
              </div>
              <div class="scene-box">
                <img src="/img/animacion.gif" class="result-gif" alt="Animación de orden registrada" />
                <p class="scene-label">
                  <i class="fas fa-play-circle me-1"></i>
                  Registro completado correctamente
                </p>
              </div>
            </div>

            <!-- Acciones -->
            <div class="result-actions">
              <RouterLink v-if="!isOperario" :to="`/orden/${lastOrder.code}`" class="act-btn act-primary">
                <i class="fas fa-file-alt me-2"></i>Ver detalle completo
              </RouterLink>
              <button v-if="isOperario" class="act-btn act-primary" @click="clearScan">
                <i class="fas fa-qrcode me-2"></i>Escanear otra orden
              </button>
              <RouterLink v-if="!isOperario" to="/ordenes" class="act-btn act-secondary">
                <i class="fas fa-table me-2"></i>Ir a tabla de órdenes
              </RouterLink>
            </div>

          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useOrdersStore } from '../stores/orders'
import { useAuthStore }   from '../stores/auth'

const ordersStore = useOrdersStore()
const auth        = useAuthStore()
const router      = useRouter()
const { lastScannedCode, lastScanMessage, orders, sedes } = storeToRefs(ordersStore)
const clearScan = () => { lastScannedCode.value = '' }

onMounted(async () => {
  await ordersStore.fetchSedes({ silent: true })
  await ordersStore.fetchOrders()
})

const isOperario  = computed(() => auth.user?.role === 'operario')
const sedeFija    = computed(() => auth.user?.sede || 'BOG')
const sedeNombre  = computed(() => sedes.value.find(s => s.code === sedeFija.value)?.name || sedeFija.value)

const orderCode  = ref('')
const orderName  = ref('')
const orderSede  = ref(sedeFija.value)
const orderPhoto = ref('')
const ocrState   = ref('idle')

const imagePreview = ref('')
const shapePath    = ref('')
const cvState      = ref('idle')
const cvError      = ref('')
let cvLib = null, tess = null

const lastOrder = computed(() =>
  lastScannedCode.value
    ? orders.value.find(o => o.code.toUpperCase() === lastScannedCode.value.toUpperCase())
    : null
)

const canSubmit = computed(() => orderCode.value.trim() && orderName.value.trim())

const submit = async () => {
  if (!canSubmit.value) return
  const result = await ordersStore.registerOrder(
    orderCode.value,
    orderName.value,
    orderSede.value,
    auth.user?.name
  )

  if (!result?.ok) return

  orderCode.value = ''; orderName.value = ''
  if (!isOperario.value) orderSede.value = 'BOG'
  orderPhoto.value = ''; ocrState.value = 'idle'
  imagePreview.value = ''; shapePath.value = ''; cvState.value = 'idle'
  if (!isOperario.value) router.push('/ordenes')
}

/* OCR */
const loadTess = async () => {
  if (tess) return tess
  const { createWorker } = await import('tesseract.js')
  tess = await createWorker('eng')
  return tess
}
const onPhoto = async (e) => {
  const file = e.target.files?.[0]; e.target.value = ''; if (!file) return
  orderPhoto.value = URL.createObjectURL(file); ocrState.value = 'scanning'
  try {
    const img = await new Promise((res, rej) => { const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=orderPhoto.value })
    const cx=Math.floor(img.width*.48), cw=img.width-cx, ch=Math.floor(img.height*.28), S=3
    const canvas=document.createElement('canvas'); canvas.width=Math.round(cw*S); canvas.height=Math.round(ch*S)
    const ctx=canvas.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height)
    ctx.drawImage(img,cx,0,cw,ch,0,0,canvas.width,canvas.height)
    const px=ctx.getImageData(0,0,canvas.width,canvas.height),d=px.data
    for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2];d[i]=d[i+1]=d[i+2]=(r>130&&g<110&&b<110&&r-g>40)||(0.299*r+0.587*g+0.114*b)<110?0:255}
    ctx.putImageData(px,0,0)
    const {data}=await(await loadTess()).recognize(canvas)
    const found=new Set()
    ;[/OP[-\s]?\d{3,8}/gi,/\b\d{3,6}\b/g].forEach(re=>{const m=data.text.match(re);if(m)m.forEach(c=>found.add(c.replace(/\s/g,'').toUpperCase()))})
    const codes=[...found].filter(c=>c.length>=3)
    if(codes.length){orderCode.value=codes[0];ocrState.value='done'}else ocrState.value='manual'
  } catch { ocrState.value='manual' }
}

/* OpenCV */
const loadCV = async () => {
  if(cvLib)return cvLib
  const{default:cv}=await import('@techstark/opencv-js')
  if(!cv.Mat)await new Promise((res,rej)=>{const t=setTimeout(()=>rej(),30000);cv.onRuntimeInitialized=()=>{clearTimeout(t);res()}})
  cvLib=cv;return cv
}
const onModelPhoto = async (e) => {
  const file=e.target.files?.[0]; e.target.value=''; if(!file)return
  shapePath.value='';cvError.value='';imagePreview.value=URL.createObjectURL(file);cvState.value='loading'
  try {
    const cv=await loadCV(); cvState.value='processing'
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=imagePreview.value})
    const MAX=900;let w=img.width,h=img.height
    if(Math.max(w,h)>MAX){const s=MAX/Math.max(w,h);w=Math.round(w*s);h=Math.round(h*s)}
    const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h)
    const src=cv.imread(c),gray=new cv.Mat(),blur=new cv.Mat(),bin=new cv.Mat()
    cv.cvtColor(src,gray,cv.COLOR_RGBA2GRAY);cv.GaussianBlur(gray,blur,new cv.Size(7,7),0)
    cv.adaptiveThreshold(blur,bin,255,cv.ADAPTIVE_THRESH_GAUSSIAN_C,cv.THRESH_BINARY_INV,17,5)
    const k3=cv.Mat.ones(3,3,cv.CV_8U),k2=cv.Mat.ones(2,2,cv.CV_8U)
    cv.dilate(bin,bin,k3);cv.erode(bin,bin,k2);k3.delete();k2.delete()
    const cont=new cv.MatVector(),hier=new cv.Mat()
    cv.findContours(bin,cont,hier,cv.RETR_EXTERNAL,cv.CHAIN_APPROX_SIMPLE)
    let mA=0,mI=-1;for(let i=0;i<cont.size();i++){const a=cv.contourArea(cont.get(i));if(a>mA){mA=a;mI=i}}
    if(mI===-1||mA<800)throw new Error('Sin forma.')
    const ct=cont.get(mI),ap=new cv.Mat()
    cv.approxPolyDP(ct,ap,cv.arcLength(ct,true)*0.012,true)
    const bb=cv.boundingRect(ap),pts=[]
    for(let i=0;i<ap.rows;i++)pts.push({x:ap.data32S[i*2],y:ap.data32S[i*2+1]})
    const P=12,SZ=200-P*2
    shapePath.value=pts.map((p,i)=>`${i?'L':'M'}${(((p.x-bb.x)/bb.width)*SZ+P).toFixed(1)} ${(((p.y-bb.y)/bb.height)*SZ+P).toFixed(1)}`).join(' ')+' Z'
    ;[src,gray,blur,bin,cont,hier,ap].forEach(m=>m.delete()); cvState.value='done'
  } catch(err){ cvError.value=err.message||'Error.'; cvState.value='error' }
}
const LAYERS = 10
</script>

<style scoped>
.scanner-page { padding: 2rem 0 3rem; }

.scanner-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 1.5rem;
  align-items: start;
}
@media (max-width: 991px) {
  .scanner-layout { grid-template-columns: 1fr; }
}

/* ══ PANEL IZQUIERDO ══ */
.left-panel {
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid var(--line);
  box-shadow: var(--shadow-lg);
}

.left-header {
  display: flex; align-items: center; gap: 1rem;
  padding: 1.4rem 1.5rem;
  background: linear-gradient(135deg, #14213d 0%, #1e3a62 100%);
}

.left-header-icon {
  width: 2.5rem; height: 2.5rem; min-width: 2.5rem;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 0.65rem;
  display: grid; place-items: center;
  color: #fff; font-size: 1rem;
}

.left-header-title { font-family:var(--font-display); font-size:1rem; font-weight:700; color:#fff; margin:0 0 0.1rem; }
.left-header-sub   { font-size:0.7rem; color:rgba(255,255,255,0.65); margin:0; }

.left-body {
  background: var(--paper); padding: 1.5rem;
  display: flex; flex-direction: column; gap: 1.25rem;
}

.scan-alert {
  font-size: 0.78rem; color: var(--ink-700);
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 0.65rem; padding: 0.6rem 0.875rem;
}

/* Zona de foto */
.photo-drop {
  display: block; position: relative;
  border-radius: 0.75rem; overflow: hidden;
  cursor: pointer; border: 2px dashed var(--line);
  background: var(--surface); transition: border-color 0.15s, background 0.15s;
}
.photo-drop:hover                               { border-color: var(--accent); background: rgba(66,130,194,0.04); }
.photo-drop.done                                { border-style: solid; border-color: var(--success); background: rgba(46,139,87,0.04); }
.photo-drop.manual                              { border-style: solid; border-color: var(--accent); }
.photo-drop.has-photo:not(.done):not(.manual)   { border-style: solid; border-color: var(--line); background: var(--paper); }

.photo-drop-content { display: flex; align-items: center; gap: 0.875rem; padding: 1rem 1.125rem; }

.photo-drop-icon {
  width: 2.5rem; height: 2.5rem; min-width: 2.5rem;
  border-radius: 0.6rem; background: var(--paper); border: 1px solid var(--line);
  display: grid; place-items: center; font-size: 1rem; color: var(--ink-500);
}

.photo-drop-main { display:block; font-size:0.875rem; font-weight:600; color:var(--ink-900); }
.photo-drop-sub  { display:block; font-size:0.72rem; color:var(--ink-500); margin-top:0.15rem; }

/* Campos */
.fields-block { display: flex; flex-direction: column; gap: 0.75rem; }
.field        { display: flex; flex-direction: column; gap: 0.3rem; }

.flabel {
  font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1rem; color: var(--ink-500);
  display: flex; align-items: center; gap: 0.4rem;
}
.fauto { font-size:0.6rem; font-weight:600; background:rgba(46,139,87,0.1); color:var(--success); padding:0.1rem 0.45rem; border-radius:0.35rem; text-transform:none; letter-spacing:0; }
.freq  { color: var(--danger); }

.finput-wrap {
  display: flex; align-items: center;
  border: 1.5px solid var(--line); border-radius: 0.65rem;
  background: var(--paper); overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.finput-wrap:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(66,130,194,0.12);
}
.ficon  { padding: 0 0.875rem; color: var(--ink-500); font-size: 0.85rem; flex-shrink: 0; }
.finput {
  flex: 1; border: none; outline: none;
  padding: 0.75rem 0.5rem 0.75rem 0;
  font-size: 0.875rem; color: var(--ink-900);
  background: transparent; font-family: var(--font-body);
}
.finput::placeholder { color: var(--ink-500); opacity: 0.55; }
.fselect { cursor: pointer; }
.fclear  { background: none; border: none; padding: 0 0.75rem; color: var(--ink-500); cursor: pointer; font-size: 0.75rem; flex-shrink: 0; }
.fclear:hover { color: var(--danger); }
.sede-lock { padding: 0 0.75rem; color: var(--ink-500); font-size: 0.72rem; flex-shrink: 0; }

/* CTA */
.btn-cta {
  border: none; border-radius: 0.75rem;
  padding: 0; overflow: hidden; cursor: pointer; width: 100%;
  background: var(--surface-2);
  transition: transform 0.12s, box-shadow 0.15s;
}
.btn-cta.ready {
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  box-shadow: 0 6px 20px rgba(66,130,194,0.35);
}
.btn-cta.ready:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(66,130,194,0.45); }
.btn-cta:disabled    { cursor: not-allowed; opacity: 0.65; }

.btn-cta-inner {
  display: flex; align-items: center; justify-content: center;
  gap: 0.625rem; padding: 0.95rem;
  font-size: 0.9rem; font-weight: 700; color: var(--ink-500);
}
.btn-cta.ready .btn-cta-inner { color: #fff; }

.btn-cta-hint {
  display: block; text-align: center; font-size: 0.68rem;
  color: var(--danger); padding: 0.25rem; background: rgba(196,69,54,0.06);
}

/* Spinners */
.spin-icon { display:inline-block; width:1rem; height:1rem; border:2px solid rgba(0,0,0,0.1); border-top-color:var(--accent); border-radius:50%; animation:sp 0.7s linear infinite; }
.spin-sm   { display:inline-block; width:0.8rem; height:0.8rem; border:2px solid var(--line); border-top-color:var(--accent); border-radius:50%; animation:sp 0.7s linear infinite; flex-shrink:0; }
@keyframes sp { to { transform:rotate(360deg); } }

/* ══ PANEL DERECHO ══ */
.right-panel { min-height: 520px; }

/* Vacío */
.right-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 520px; text-align: center;
  padding: 2.5rem; background: var(--paper);
  border: 1px solid var(--line); border-radius: 1rem;
}
.empty-icon-wrap {
  width: 5rem; height: 5rem; border-radius: 1.25rem;
  background: rgba(66,130,194,0.08); border: 1px solid rgba(66,130,194,0.18);
  display: grid; place-items: center;
  font-size: 1.75rem; color: var(--accent); margin: 0 auto 1.25rem;
}
.empty-title { font-family:var(--font-display); font-size:1rem; font-weight:700; margin:0 0 0.5rem; color:var(--ink-900); }
.empty-body  { font-size:0.82rem; color:var(--ink-500); max-width:280px; line-height:1.75; margin:0; }

/* Foto viewer */
.photo-viewer { border-radius:1rem; overflow:hidden; border:1px solid var(--line); box-shadow:var(--shadow-sm); }
.photo-viewer-bar {
  display:flex; justify-content:space-between; align-items:center;
  padding:0.875rem 1.25rem; background:var(--surface); border-bottom:1px solid var(--line);
  font-size:0.72rem; font-weight:700; color:var(--ink-700);
  text-transform:uppercase; letter-spacing:0.07rem; flex-wrap:wrap; gap:0.5rem;
}
.photo-viewer-badge {
  font-size:0.68rem; font-weight:600;
  background:rgba(66,130,194,0.1); color:var(--accent);
  border:1px solid rgba(66,130,194,0.2); padding:0.25rem 0.65rem; border-radius:0.45rem;
  text-transform:none; letter-spacing:0;
}
.photo-viewer-img { width:100%; max-height:520px; object-fit:contain; display:block; background:var(--surface); }

/* Orden registrada */
.order-result { border-radius:1rem; overflow:hidden; border:1px solid var(--line); box-shadow:var(--shadow-sm); }

/* Banner resultado */
.result-banner {
  padding: 1.5rem;
  background: var(--accent);
}
.result-banner-inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}
.result-banner-left  { display:flex; flex-direction:column; gap:0.4rem; }
.result-banner-right { display:flex; gap:1.5rem; flex-wrap:wrap; }

.result-eyebrow {
  font-size: 0.65rem; font-weight: 700; color: rgba(255,255,255,0.7);
  text-transform: uppercase; letter-spacing: 0.1rem;
}
.result-name { font-family:var(--font-display); font-size:1.3rem; font-weight:700; color:#fff; margin:0; }
.result-code-tag {
  display: inline-block; font-size: 0.72rem; font-weight: 700;
  background: rgba(255,255,255,0.2); color: #fff;
  padding: 0.2rem 0.6rem; border-radius: 3px; letter-spacing: 0.06rem;
}

.result-stat       { display:flex; flex-direction:column; gap:0.15rem; }
.result-stat-label { font-size:0.58rem; color:rgba(255,255,255,0.55); text-transform:uppercase; letter-spacing:0.08rem; }
.result-stat-val   { font-size:0.85rem; font-weight:600; color:#fff; }

.result-prog-wrap  { display:flex; align-items:center; gap:0.75rem; }
.result-prog-track { flex:1; height:5px; background:rgba(255,255,255,0.2); border-radius:2px; overflow:hidden; }
.result-prog-fill  { height:100%; background:#fff; border-radius:2px; transition:width 0.4s ease; }
.result-prog-pct   { font-size:0.78rem; font-weight:700; color:#fff; min-width:2.5rem; text-align:right; }

/* Modelo 3D */
.model-block { padding:1.25rem; background:var(--paper); border-bottom:1px solid var(--line); }
.model-block-head {
  display:flex; justify-content:space-between; align-items:center;
  margin-bottom:0.875rem; flex-wrap:wrap; gap:0.5rem;
}
.model-block-title { font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08rem; color:var(--ink-500); display:flex; align-items:center; }

.model-upload-pill {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.35rem 0.875rem;
  border: 1px solid var(--line); border-radius: 999px;
  font-size: 0.75rem; font-weight: 600;
  color: var(--ink-700); background: var(--surface);
  cursor: pointer; position: relative;
  transition: border-color 0.12s, background 0.12s, color 0.12s;
}
.model-upload-pill:hover { border-color: var(--accent); color: var(--accent); background: rgba(66,130,194,0.05); }

.cv-row      { display:flex; align-items:center; gap:0.5rem; font-size:0.78rem; color:var(--ink-700); margin-bottom:0.5rem; }
.cv-err      { color:var(--danger); }
.cv-ok       { color:var(--success); }

.scene-box   { background:var(--surface); border-radius:0.375rem; border:1px solid var(--line); padding:1rem; display:flex; flex-direction:column; align-items:center; }
.scene-stage { perspective:900px; width:200px; height:200px; display:flex; align-items:center; justify-content:center; }
.scene-label { font-size:0.68rem; color:var(--ink-500); margin:0.5rem 0 0; text-align:center; }
.result-gif {
  width: min(100%, 300px);
  border-radius: 0.375rem;
  border: 1px solid var(--line);
  background: var(--paper);
  object-fit: cover;
}

.rotator   { transform-style:preserve-3d; animation:rot3d 9s linear infinite; }
@keyframes rot3d { from{transform:rotateX(22deg) rotateY(0deg);}to{transform:rotateX(22deg) rotateY(360deg);} }
.ext-layer { display:block; width:200px; height:200px; position:absolute; top:0; left:0; transform-style:preserve-3d; }
.ext-first { position:relative; }

.plate { width:160px; height:160px; position:relative; transform-style:preserve-3d; }
.pf { position:absolute; }
.pf-front,.pf-back { width:160px; height:160px; left:0; top:0; }
.pf-front {
  transform:translateZ(7px);
  background:
    repeating-linear-gradient(0deg,transparent,transparent 19px,rgba(80,110,150,0.07) 19px,rgba(80,110,150,0.07) 20px),
    repeating-linear-gradient(90deg,transparent,transparent 19px,rgba(80,110,150,0.07) 19px,rgba(80,110,150,0.07) 20px),
    linear-gradient(145deg,#c8cfd8,#dde3ec 40%,#edf1f7 60%,#cdd4dd);
  border:1px solid rgba(100,120,160,0.2);
}
.pf-back  { transform:rotateY(180deg) translateZ(7px); background:linear-gradient(145deg,#8a9099,#a0a8b5); }
.pf-right,.pf-left { width:14px; height:160px; left:73px; top:0; }
.pf-right { transform:rotateY(90deg)  translateZ(80px); background:linear-gradient(180deg,#b0b8c4,#6b7280); }
.pf-left  { transform:rotateY(-90deg) translateZ(80px); background:linear-gradient(180deg,#c5cad4,#8a9099); }
.pf-top,.pf-bottom { width:160px; height:14px; left:0; top:73px; }
.pf-top    { transform:rotateX(90deg)  translateZ(80px); background:linear-gradient(90deg,#c0c8d4,#d4dbe6 50%,#c0c8d4); }
.pf-bottom { transform:rotateX(-90deg) translateZ(80px); background:linear-gradient(90deg,#6b7280,#8a9099 50%,#6b7280); }

/* Acciones */
.result-actions {
  display: flex; gap: 0.75rem; padding: 1.1rem 1.25rem;
  background: var(--surface); border-top: 1px solid var(--line); flex-wrap: wrap;
}
.act-btn {
  flex: 1; padding: 0.75rem 1rem; border-radius: 0.65rem;
  font-size: 0.85rem; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  transition: opacity 0.14s, background 0.14s, transform 0.14s;
}
.act-primary   { background: linear-gradient(135deg,var(--accent),var(--accent-strong)); color: #fff; border: none; box-shadow: 0 4px 14px rgba(66,130,194,0.28); }
.act-primary:hover  { opacity: 0.9; transform: translateY(-1px); }
.act-secondary { background: var(--paper); color: var(--ink-700); border: 1px solid var(--line); }
.act-secondary:hover { background: var(--surface-2); }
</style>

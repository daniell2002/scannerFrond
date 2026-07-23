<template>
  <section class="scanner-page">
    <div class="container-lg">
      <div class="scanner-layout" :class="{ 'result-only': lastOrder }">

        <!-- ══ PANEL IZQUIERDO ══ -->
        <div v-if="!lastOrder" class="left-panel">

          <!-- Cabecera azul -->
          <div class="left-header">
            <div class="left-header-icon">
              <i class="fas fa-qrcode"></i>
            </div>
            <div>
              <h2 class="left-header-title">Registrar orden</h2>
              <p class="left-header-sub">
                {{ isOperario ? sedeNombre : 'Conexa · Órdenes de producción' }}
              </p>
            </div>
          </div>

          <!-- Cuerpo del formulario -->
          <div class="left-body">

            <div class="scan-alert"><i class="fas fa-circle-info"></i><span>{{ lastScanMessage }}</span></div>

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

            <!-- Cabecera -->
            <div class="result-header">
              <div class="result-header-icon"><i class="fas fa-check"></i></div>
              <div>
                <h3 class="result-header-title">Orden registrada</h3>
                <p class="result-header-sub">Comprobante de registro</p>
              </div>
            </div>

            <!-- Recibo -->
            <div class="receipt">
              <h2 class="receipt-product">{{ lastOrder.product }}</h2>
              <p class="receipt-code">{{ lastOrder.code }}</p>

              <div class="receipt-divider"></div>

              <div class="receipt-row">
                <span class="receipt-row-label">Sede</span>
                <span class="receipt-row-dots"></span>
                <span class="receipt-row-val">{{ lastOrder.sedeInfo.name }}</span>
              </div>
              <div class="receipt-row">
                <span class="receipt-row-label">Operador</span>
                <span class="receipt-row-dots"></span>
                <span class="receipt-row-val">{{ lastOrder.operator }}</span>
              </div>

              <div class="receipt-divider"></div>
            </div>

            <!-- Acciones -->
            <div class="result-actions">
              <button v-if="!isOperario" class="act-btn act-secondary" @click="clearScan">
                <i class="fas fa-plus me-2"></i>Registrar nueva orden
              </button>
              <RouterLink v-if="!isOperario" :to="`/orden/${lastOrder.code}`" class="act-btn act-primary">
                <i class="fas fa-file-alt me-2"></i>Ir a la orden
              </RouterLink>
              <button v-if="isOperario" class="act-btn act-primary" @click="clearScan">
                <i class="fas fa-qrcode me-2"></i>Escanear otra orden
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useOrdersStore } from '../stores/orders'
import { useAuthStore }   from '../stores/auth'

const ordersStore = useOrdersStore()
const auth        = useAuthStore()
const { lastScannedCode, lastScanMessage, orders, sedes } = storeToRefs(ordersStore)
const clearScan = () => {
  lastScannedCode.value = ''
  lastScanMessage.value = 'Escanea una orden para cargarla en el tablero operativo.'
}

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
const orderPhotoFile = ref(null)
const ocrState   = ref('idle')

let tess = null

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
    auth.user?.name,
    orderPhotoFile.value
  )

  if (!result?.ok) return

  orderCode.value = ''; orderName.value = ''
  if (!isOperario.value) orderSede.value = 'BOG'
  orderPhoto.value = ''; orderPhotoFile.value = null; ocrState.value = 'idle'
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
  orderPhoto.value = URL.createObjectURL(file); orderPhotoFile.value = file; ocrState.value = 'scanning'
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

</script>

<style scoped>
.scanner-page { padding: 1.25rem 0; }

.scanner-layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 1.25rem;
  align-items: start;
}
@media (max-width: 991px) {
  .scanner-layout { grid-template-columns: 1fr; }
}

/* Sin formulario: el resultado ocupa todo el espacio disponible */
.scanner-layout.result-only {
  grid-template-columns: 1fr;
}
.scanner-layout.result-only .right-panel {
  width: 100%;
  min-height: calc(100vh - var(--topbar-h) - 2.5rem);
  display: flex;
  flex-direction: column;
}
.scanner-layout.result-only .order-result {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.scanner-layout.result-only .result-actions {
  margin-top: auto;
}

/* ══ PANEL IZQUIERDO ══ */
.left-panel {
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid var(--line);
  box-shadow: var(--shadow-lg);
}

.left-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.25rem;
  background: var(--accent);
}

.left-header-icon {
  width: 2.25rem;
  height: 2.25rem;
  min-width: 2.25rem;
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 0.5rem;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 0.95rem;
}

.left-header-title { font-family:var(--font-display); font-size:0.95rem; font-weight:700; color:#fff; margin:0 0 0.1rem; }
.left-header-sub   { font-size:0.68rem; color:rgba(255,255,255,0.65); margin:0; }

.left-body {
  background: var(--paper);
  padding: 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.scan-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--ink-700);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 0.5rem;
  padding: 0.5rem 0.7rem;
}
.scan-alert i { color: var(--accent); font-size: 0.78rem; flex-shrink: 0; }

/* Zona de foto */
.photo-drop {
  display: block;
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  cursor: pointer;
  border: 2px dashed var(--line);
  background: var(--surface);
  transition: border-color 0.15s, background 0.15s;
}
.photo-drop:hover                               { border-color: var(--accent); background: rgba(66,130,194,0.04); }
.photo-drop.done                                { border-style: solid; border-color: var(--success); background: rgba(46,139,87,0.04); }
.photo-drop.manual                              { border-style: solid; border-color: var(--accent); }
.photo-drop.has-photo:not(.done):not(.manual)   { border-style: solid; border-color: var(--line); background: var(--paper); }

.photo-drop-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
}

.photo-drop-icon {
  width: 2rem;
  height: 2rem;
  min-width: 2rem;
  border-radius: 0.5rem;
  background: var(--paper);
  border: 1px solid var(--line);
  display: grid;
  place-items: center;
  font-size: 0.9rem;
  color: var(--ink-500);
}
.photo-drop.done .photo-drop-icon   { background: rgba(46,139,87,0.1); border-color: transparent; }
.photo-drop.manual .photo-drop-icon { background: rgba(66,130,194,0.1); border-color: transparent; color: var(--accent); }

.photo-drop-main { display:block; font-size:0.82rem; font-weight:600; color:var(--ink-900); }
.photo-drop-sub  { display:block; font-size:0.68rem; color:var(--ink-500); margin-top:0.1rem; }

/* Campos */
.fields-block { display: flex; flex-direction: column; gap: 0.6rem; }
.field        { display: flex; flex-direction: column; gap: 0.25rem; }

.flabel {
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09rem;
  color: var(--ink-500);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.fauto { font-size:0.6rem; font-weight:600; background:rgba(46,139,87,0.1); color:var(--success); padding:0.1rem 0.4rem; border-radius:3px; text-transform:none; letter-spacing:0; }
.freq  { color: var(--danger); }

.finput-wrap {
  display: flex;
  align-items: center;
  border: 1.5px solid var(--line);
  border-radius: 0.5rem;
  background: var(--paper);
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.finput-wrap:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(66,130,194,0.12);
}

.ficon  { padding: 0 0.75rem; color: var(--ink-500); font-size: 0.82rem; flex-shrink: 0; }
.finput-wrap.filled .ficon,
.finput-wrap:focus-within .ficon {
  color: var(--accent);
}
.finput {
  flex: 1; border: none; outline: none;
  padding: 0.55rem 0.5rem 0.55rem 0;
  font-size: 0.85rem; color: var(--ink-900);
  background: transparent; font-family: var(--font-body);
}
.finput::placeholder { color: var(--ink-500); opacity: 0.55; }
.fselect { cursor: pointer; }
.fclear  { background: none; border: none; padding: 0 0.65rem; color: var(--ink-500); cursor: pointer; font-size: 0.72rem; flex-shrink: 0; }
.fclear:hover { color: var(--danger); }
.sede-lock { padding: 0 0.7rem; color: var(--ink-500); font-size: 0.68rem; flex-shrink: 0; }

/* CTA */
.btn-cta {
  border: none; border-radius: 0.5rem;
  padding: 0; overflow: hidden; cursor: pointer; width: 100%;
  background: var(--surface-2);
  transition: transform 0.12s, box-shadow 0.15s;
}
.btn-cta.ready {
  background: var(--accent);
  box-shadow: 0 4px 14px rgba(66,130,194,0.35);
}
.btn-cta.ready:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(66,130,194,0.45); }
.btn-cta:disabled    { cursor: not-allowed; opacity: 0.65; }

.btn-cta-inner {
  display: flex; align-items: center; justify-content: center;
  gap: 0.55rem; padding: 0.7rem;
  font-size: 0.85rem; font-weight: 700;
  color: var(--ink-500);
}
.btn-cta.ready .btn-cta-inner { color: #fff; }

.btn-cta-hint {
  display: block; text-align: center; font-size: 0.65rem;
  color: var(--danger); padding: 0.2rem;
  background: rgba(196,69,54,0.06);
}

/* Spinners */
.spin-icon { display:inline-block; width:1rem; height:1rem; border:2px solid rgba(0,0,0,0.1); border-top-color:var(--accent); border-radius:50%; animation:sp 0.7s linear infinite; }
.spin-sm   { display:inline-block; width:0.8rem; height:0.8rem; border:2px solid var(--line); border-top-color:var(--accent); border-radius:50%; animation:sp 0.7s linear infinite; flex-shrink:0; }
@keyframes sp { to { transform:rotate(360deg); } }

/* ══ PANEL DERECHO ══ */
.right-panel { min-height: 380px; }

/* Vacío */
.right-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 380px; text-align: center;
  padding: 2rem; background: var(--paper);
  border: 1px solid var(--line); border-radius: 0.5rem;
}
.empty-icon-wrap {
  width: 4.5rem; height: 4.5rem; border-radius: 50%;
  background: rgba(66,130,194,0.08);
  border: 1px solid rgba(66,130,194,0.2);
  display: grid; place-items: center;
  font-size: 1.6rem; color: var(--accent);
  margin: 0 auto 1.25rem;
}
.empty-title { font-family:var(--font-display); font-size:1rem; font-weight:700; margin:0 0 0.5rem; color:var(--ink-900); }
.empty-body  { font-size:0.82rem; color:var(--ink-500); max-width:280px; line-height:1.75; margin:0; }

/* Foto viewer */
.photo-viewer { border-radius:0.375rem; overflow:hidden; border:1px solid var(--line); box-shadow:var(--shadow-sm); }
.photo-viewer-bar {
  display:flex; justify-content:space-between; align-items:center;
  padding:0.75rem 1rem; background:var(--surface); border-bottom:1px solid var(--line);
  font-size:0.72rem; font-weight:700; color:var(--ink-700);
  text-transform:uppercase; letter-spacing:0.07rem; flex-wrap:wrap; gap:0.5rem;
}
.photo-viewer-badge {
  font-size:0.68rem; font-weight:600;
  background:rgba(66,130,194,0.1); color:var(--accent);
  border:1px solid rgba(66,130,194,0.2);
  padding:0.2rem 0.6rem; border-radius:3px;
  text-transform:none; letter-spacing:0;
}
.photo-viewer-img { width:100%; max-height:520px; object-fit:contain; display:block; background:var(--surface); }

/* Orden registrada — estilo recibo */
.order-result { border-radius:0.375rem; overflow:hidden; border:1px solid var(--line); box-shadow:var(--shadow-sm); background:var(--paper); }

.result-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.4rem 1.75rem;
  background: var(--accent);
}
.result-header-icon {
  width: 2.75rem;
  height: 2.75rem;
  min-width: 2.75rem;
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 0.5rem;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 1.15rem;
}
.result-header-title { font-family:var(--font-display); font-size:1.15rem; font-weight:700; color:#fff; margin:0 0 0.15rem; }
.result-header-sub   { font-size:0.8rem; color:rgba(255,255,255,0.65); margin:0; }

.receipt {
  padding: 2rem 2rem 0.5rem;
  font-family: 'Courier New', ui-monospace, monospace;
}

.receipt-product {
  font-family: var(--font-display);
  font-size: 1.4rem; font-weight: 700; color: var(--ink-900);
  margin: 0 0 0.4rem;
}
.receipt-code {
  font-size: 0.95rem; color: var(--ink-500);
  margin: 0;
  letter-spacing: 0.03rem;
}

.receipt-divider {
  border-top: 1px dashed var(--line);
  margin: 1.4rem 0;
}

.receipt-row { display: flex; align-items: baseline; gap: 0.5rem; padding: 0.4rem 0; }
.receipt-row-label { font-size: 0.88rem; color: var(--ink-500); white-space: nowrap; }
.receipt-row-dots  { flex: 1; border-bottom: 1px dotted var(--line); margin-bottom: 0.3rem; }
.receipt-row-val   { font-size: 0.88rem; font-weight: 700; color: var(--ink-900); white-space: nowrap; }

/* Acciones */
.result-actions {
  display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1.4rem 2rem;
  flex-wrap: wrap;
}
.act-btn {
  padding: 0.65rem 1.75rem; border-radius: 0.375rem;
  font-size: 0.9rem; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  transition: opacity 0.14s, background 0.14s;
}
.act-primary   { background: var(--accent); color: #fff; border: none; }
.act-primary:hover  { opacity: 0.88; }
.act-secondary { background: none; color: var(--ink-700); border: 1px solid var(--line); }
.act-secondary:hover { background: var(--surface); }
</style>

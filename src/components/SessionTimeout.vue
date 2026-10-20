<template>
  <div v-if="warning" class="st-overlay" role="alertdialog" aria-modal="true" aria-labelledby="st-title" aria-describedby="st-desc">
    <div class="st-card">
      <div class="st-icon"><i class="fas fa-hourglass-half"></i></div>
      <h2 id="st-title" class="st-title">¿Sigues ahí?</h2>
      <p id="st-desc" class="st-desc">
        Por seguridad, tu sesión se cerrará por inactividad en
      </p>
      <p class="st-count" aria-live="polite">{{ countdown }}</p>
      <button type="button" class="btn-save st-keep" :disabled="renewing" @click="keep" autofocus>
        <i class="fas" :class="renewing ? 'fa-spinner fa-spin' : 'fa-rotate-right'"></i>
        Seguir conectado
      </button>
      <button type="button" class="st-logout" @click="logout">Cerrar sesión</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { IDLE_MS, WARN_MS, REFRESH_MS, markActivity, idleFor, tokenIssuedAt } from '../utils/session'

const auth   = useAuthStore()
const router = useRouter()

const warning   = ref(false)
const remaining = ref(0)
const renewing  = ref(false)
let refreshing  = false
let lastMark    = 0
let timer       = null

const countdown = computed(() => {
  const s = Math.max(0, Math.ceil(remaining.value / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})

// Con el aviso abierto, mover el mouse no cuenta: debe confirmar con el botón
function onActivity() {
  if (warning.value) return
  const now = Date.now()
  if (now - lastMark < 10_000) return
  lastMark = now
  markActivity()
}

async function renewToken() {
  if (refreshing) return
  refreshing = true
  try { await auth.refresh() } catch { /* sin conexión: se reintenta en el siguiente ciclo */ }
  finally { refreshing = false }
}

function expire() {
  auth.logout({ notice: 'Tu sesión se cerró por inactividad. Ingresa de nuevo para continuar.' })
  router.push('/login')
}

function tick() {
  // Se cerró la sesión en otra pestaña
  if (!localStorage.getItem('auth_token')) {
    auth.user = null
    router.push('/login')
    return
  }

  const idle = idleFor()
  if (idle >= IDLE_MS) return expire()

  warning.value   = idle >= IDLE_MS - WARN_MS
  remaining.value = IDLE_MS - idle

  // Renueva el token solo si el usuario está trabajando de verdad
  if (!warning.value && idle < 5 * 60_000 && Date.now() - tokenIssuedAt() > REFRESH_MS) renewToken()
}

async function keep() {
  renewing.value = true
  markActivity()
  warning.value = false
  await renewToken()
  renewing.value = false
}

function logout() {
  auth.logout()
  router.push('/login')
}

const EVENTS = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'wheel']

onMounted(() => {
  // Sesiones abiertas antes de esta función no tienen registro de actividad
  if (!localStorage.getItem('last_activity')) markActivity()
  EVENTS.forEach(e => window.addEventListener(e, onActivity, { passive: true, capture: true }))
  document.addEventListener('visibilitychange', tick)
  timer = setInterval(tick, 1000)
  tick()
})

onBeforeUnmount(() => {
  EVENTS.forEach(e => window.removeEventListener(e, onActivity, { capture: true }))
  document.removeEventListener('visibilitychange', tick)
  clearInterval(timer)
})
</script>

<style scoped>
.st-overlay {
  position: fixed; inset: 0; z-index: 1200;
  display: grid; place-items: center; padding: 1rem;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
}
.st-card {
  width: 100%; max-width: 380px;
  padding: 2rem 1.75rem 1.5rem;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 1rem;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.3);
  display: flex; flex-direction: column; gap: 0.75rem;
  text-align: center;
}
.st-icon {
  width: 3.25rem; height: 3.25rem; margin: 0 auto;
  border-radius: 50%; display: grid; place-items: center;
  font-size: 1.25rem; color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}
.st-title { margin: 0; font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; color: var(--ink-900); }
.st-desc  { margin: 0; font-size: 0.85rem; line-height: 1.55; color: var(--ink-500); }
.st-count {
  margin: 0 0 0.25rem; font-family: var(--font-display); font-size: 2rem; font-weight: 700;
  font-variant-numeric: tabular-nums; color: var(--ink-900);
}
.st-keep { justify-content: center; width: 100%; }
.st-logout {
  align-self: center; border: none; background: none;
  font-size: 0.8rem; color: var(--ink-500); cursor: pointer; text-decoration: underline;
}
.st-logout:hover { color: var(--ink-900); }
</style>

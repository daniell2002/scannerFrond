<template>
  <div class="login-bg">
    <div class="login-split">

      <div class="login-info">
        <div class="login-info-content">
          <div class="login-brand">
            <div class="login-brand-icon">
              <i class="fas fa-barcode"></i>
            </div>
          </div>

          <h1 class="login-brand-title">CONEXA</h1>
          <p class="login-brand-sub">Sistema de gestión de órdenes</p>

          <ul class="login-info-list">
            <li>
              <span class="login-info-icon"><i class="fas fa-qrcode"></i></span>
              <div>
                <strong>Scanner</strong>
                <span>Registra el avance de cada orden al instante</span>
              </div>
            </li>
            <li>
              <span class="login-info-icon"><i class="fas fa-layer-group"></i></span>
              <div>
                <strong>Órdenes</strong>
                <span>Seguimiento en tiempo real por sede</span>
              </div>
            </li>
            <li>
              <span class="login-info-icon"><i class="fas fa-history"></i></span>
              <div>
                <strong>Historial</strong>
                <span>Trazabilidad completa de cada escaneo</span>
              </div>
            </li>
            <li>
              <span class="login-info-icon"><i class="fas fa-chart-bar"></i></span>
              <div>
                <strong>Estadísticas</strong>
                <span>Reportes de producción al instante</span>
              </div>
            </li>
          </ul>
        </div>

        <p class="login-info-footer">&copy; {{ year }} Conexa &middot; Todos los derechos reservados</p>

        <div class="login-info-decor login-info-decor--1"></div>
        <div class="login-info-decor login-info-decor--2"></div>
        <i class="fas fa-barcode login-info-watermark"></i>
      </div>

      <div class="login-form-side">
        <div class="login-card">
          <h2 class="login-heading">Bienvenido de vuelta</h2>
          <p class="login-sub">Ingresa tus credenciales para continuar</p>

          <form @submit.prevent="handleLogin" novalidate>
            <div class="login-field">
              <label class="login-label"><i class="fas fa-user"></i> Usuario</label>
              <input
                v-model="username"
                type="text"
                class="login-input"
                placeholder="Tu usuario"
                autocomplete="username"
                required
              />
            </div>

            <div class="login-field">
              <label class="login-label"><i class="fas fa-lock"></i> Contraseña</label>
              <div class="login-input-wrap">
                <input
                  v-model="password"
                  :type="showPass ? 'text' : 'password'"
                  class="login-input"
                  placeholder="Tu contraseña"
                  autocomplete="current-password"
                  required
                />
                <button type="button" class="login-eye" @click="showPass = !showPass" tabindex="-1">
                  <i class="fas" :class="showPass ? 'fa-eye-slash' : 'fa-eye'"></i>
                </button>
              </div>
            </div>

            <label class="login-remember">
              <input type="checkbox" v-model="remember" />
              Recordar mi usuario
            </label>

            <div v-if="error" class="login-error">
              <i class="fas fa-circle-exclamation me-2"></i>{{ error }}
            </div>

            <button type="submit" class="login-btn" :disabled="loading">
              <span v-if="loading"><i class="fas fa-spinner fa-spin me-2"></i>Verificando…</span>
              <span v-else><i class="fas fa-sign-in-alt me-2"></i>Ingresar</span>
            </button>
          </form>

          <p class="login-note">
            El registro de usuarios es interno y solo lo realiza un administrador autenticado.
          </p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router  = useRouter()
const auth    = useAuthStore()

const username = ref('')
const password = ref('')
const remember = ref(false)
const error    = ref('')
const loading  = ref(false)
const showPass = ref(false)
const year     = new Date().getFullYear()

onMounted(() => {
  const saved = localStorage.getItem('login_remember_user')
  if (saved) {
    username.value = saved
    remember.value = true
  }
})

async function handleLogin() {
  error.value   = ''
  loading.value = true
  await new Promise(r => setTimeout(r, 400))
  const ok = await auth.login(username.value.trim(), password.value)
  loading.value = false
  if (ok) {
    if (remember.value) {
      localStorage.setItem('login_remember_user', username.value.trim())
    } else {
      localStorage.removeItem('login_remember_user')
    }
    router.push('/')
  } else {
    error.value = 'Usuario o contraseña incorrectos.'
  }
}
</script>

<style scoped>
.login-bg {
  height: 100vh;
  overflow: hidden;
  background: var(--body-bg);
}

.login-split {
  width: 100%;
  height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
}

/* ---- left: info panel ---- */
.login-info {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background:
    radial-gradient(circle at 12% 8%, rgba(255,255,255,0.18), transparent 40%),
    radial-gradient(circle at 90% 85%, rgba(0,0,0,0.25), transparent 55%),
    linear-gradient(150deg,
      color-mix(in srgb, var(--accent-strong) 70%, black),
      var(--accent) 50%,
      color-mix(in srgb, var(--accent-strong) 70%, black));
  color: #fff;
  padding: 3.5rem 3rem;
  box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.08);
}

.login-info::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image:
    linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px),
    linear-gradient(135deg, transparent 48%, rgba(255,255,255,0.05) 50%, transparent 52%);
  background-size: 44px 44px, 44px 44px, 88px 88px;
  mask-image: radial-gradient(circle at 25% 25%, #000 0%, transparent 78%);
}

.login-info-decor {
  position: absolute;
  z-index: -1;
  border-radius: 50%;
  filter: blur(6px);
  background: rgba(255, 255, 255, 0.08);
}

.login-info-decor--1 {
  width: 24rem;
  height: 24rem;
  right: -8rem;
  bottom: -9rem;
}

.login-info-decor--2 {
  width: 13rem;
  height: 13rem;
  right: 4rem;
  top: -4rem;
  background: rgba(255, 255, 255, 0.06);
}

.login-info-watermark {
  position: absolute;
  z-index: -1;
  right: -1.5rem;
  bottom: -2rem;
  font-size: 15rem;
  color: rgba(255, 255, 255, 0.06);
  transform: rotate(-8deg);
  pointer-events: none;
}

.login-info-content {
  max-width: 420px;
  animation: login-fade-up 0.5s ease both;
}

.login-brand {
  margin-bottom: 1.5rem;
}

.login-brand-icon {
  width: 3rem;
  height: 3rem;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 0.7rem;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 1.3rem;
}

.login-brand-title {
  font-family: var(--font-display);
  font-size: 1.9rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0;
  line-height: 1.2;
}

.login-brand-sub {
  font-size: 0.92rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0.3rem 0 2.25rem;
}

.login-info-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
}

.login-info-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
}

.login-info-list li div {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.login-info-list li strong {
  font-size: 0.92rem;
  font-weight: 600;
  color: #fff;
  letter-spacing: -0.005em;
}

.login-info-list li span {
  font-size: 0.8rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.65);
}

.login-info-icon {
  width: 2.4rem;
  height: 2.4rem;
  min-width: 2.4rem;
  margin-top: 0.05rem;
  display: grid;
  place-items: center;
  border-radius: 0.6rem;
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.14);
  font-size: 0.95rem;
  color: #fff;
}

.login-info-footer {
  position: relative;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 2.5rem 0 0;
}

/* ---- right: form panel ---- */
.login-form-side {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 2.5rem;
  background:
    radial-gradient(circle at 85% 8%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 45%),
    radial-gradient(circle at 8% 92%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 40%),
    var(--body-bg);
}

.login-form-side::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image:
    linear-gradient(color-mix(in srgb, var(--ink-900) 4%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--ink-900) 4%, transparent) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(circle at 50% 40%, #000 0%, transparent 70%);
}

.login-card {
  position: relative;
  width: 100%;
  max-width: 400px;
  animation: login-fade-up 0.5s ease both;
  animation-delay: 0.05s;
}

@keyframes login-fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (max-width: 760px) {
  .login-bg {
    height: auto;
    overflow: visible;
  }
  .login-split {
    grid-template-columns: 1fr;
    height: auto;
  }
  .login-info,
  .login-form-side {
    overflow: visible;
  }
  .login-info {
    padding: 2.5rem 1.75rem;
  }
  .login-info-content {
    max-width: none;
  }
  .login-form-side {
    padding: 2.5rem 1.75rem;
  }
}

.login-heading {
  font-family: var(--font-display);
  font-size: 1.65rem;
  font-weight: 700;
  color: var(--ink-900);
  margin: 0 0 0.3rem;
  letter-spacing: -0.01em;
}

.login-sub {
  font-size: 0.9rem;
  color: var(--ink-500);
  margin: 0 0 2rem;
}

.login-field {
  margin-bottom: 1.15rem;
}

.login-label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06rem;
  text-transform: uppercase;
  color: var(--ink-700);
  margin-bottom: 0.5rem;
}

.login-label i {
  color: var(--ink-500);
  font-size: 0.85rem;
}

.login-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.login-input {
  width: 100%;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--line);
  border-radius: 0.6rem;
  background: var(--body-bg);
  color: var(--ink-900);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  font-family: var(--font-body);
}

.login-input-wrap .login-input {
  padding-right: 2.5rem;
}

.login-input:focus {
  border-color: var(--accent);
  background: var(--paper);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 28%, transparent);
}

.login-eye {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: var(--ink-500);
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.25rem;
  line-height: 1;
}
.login-eye:hover { color: var(--ink-900); }

.login-remember {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--ink-700);
  margin: 0.2rem 0 1.1rem;
  cursor: pointer;
  user-select: none;
}

.login-remember input {
  width: 1rem;
  height: 1rem;
  accent-color: var(--accent);
  cursor: pointer;
}

.login-error {
  display: flex;
  align-items: center;
  font-size: 0.83rem;
  color: var(--danger);
  background: rgba(196, 69, 54, 0.08);
  border: 1px solid rgba(196, 69, 54, 0.2);
  border-radius: 0.5rem;
  padding: 0.6rem 0.9rem;
  margin-bottom: 1rem;
}

.login-btn {
  width: 100%;
  padding: 0.8rem;
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent-strong) 70%, black));
  color: #fff;
  border: none;
  border-radius: 0.6rem;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.2rem;
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
  font-family: var(--font-body);
  box-shadow: 0 6px 18px -6px color-mix(in srgb, var(--accent-strong) 70%, transparent);
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px -6px color-mix(in srgb, var(--accent-strong) 75%, transparent);
}
.login-btn:active:not(:disabled) { transform: translateY(0); }
.login-btn:disabled { opacity: 0.65; cursor: not-allowed; box-shadow: none; }

.login-note {
  text-align: center;
  font-size: 0.78rem;
  line-height: 1.5;
  color: var(--ink-500);
  margin: 1.75rem 0 0;
}
</style>

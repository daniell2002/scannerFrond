<template>
  <div class="login-page">

    <!-- ── Panel izquierdo: marca ── -->
    <div class="login-left">
      <img src="/img/logo2-01.png" alt="Láminas & Dobleces" class="login-left-logo" />

      <h1 class="login-left-title">Gestión de órdenes de producción, todo en un solo lugar.</h1>
      <p class="login-left-desc">Escanea, registra y controla las órdenes de tus plantas de producción desde cualquier sede.</p>

      <div class="login-left-features">
        <div class="login-left-feature"><i class="fas fa-qrcode"></i>Escaneo rápido de órdenes</div>
        <div class="login-left-feature"><i class="fas fa-chart-bar"></i>Estadísticas en tiempo real</div>
        <div class="login-left-feature"><i class="fas fa-building"></i>Gestión multi-sede</div>
      </div>
    </div>

    <!-- ── Panel derecho: formulario ── -->
    <div class="login-right">
      <div class="lc-card">

        <div class="lc-header">
          <!-- En celular no se ve el panel azul: el logo (letras blancas) va sobre su propia placa -->
          <div class="lc-logo-mobile">
            <img src="/img/logo2-01.png" alt="Láminas & Dobleces" />
          </div>
          <h1 class="lc-title">{{ heading.title }}</h1>
          <p class="lc-desc">{{ heading.desc }}</p>
        </div>

        <!-- ── Olvidé mi contraseña: pedir el enlace ── -->
        <form v-if="mode === 'forgot'" @submit.prevent="handleForgot" novalidate class="lc-form">
          <template v-if="!sent">
            <div class="mf-field">
              <label class="mf-label">Correo electrónico</label>
              <div class="mf-wrap">
                <i class="fas fa-envelope mf-icon"></i>
                <input v-model="forgotEmail" type="email" inputmode="email" class="mf-inp"
                  placeholder="nombre@empresa.com" autocomplete="email" autocapitalize="off" spellcheck="false" required />
              </div>
            </div>
            <div v-if="error" class="alert alert-danger lc-error" role="alert">
              <i class="fas fa-circle-exclamation me-2"></i>{{ error }}
            </div>
            <button type="submit" class="lc-btn" :disabled="loading || !forgotEmail.trim()">
              <template v-if="!loading">Enviar enlace <i class="fas fa-paper-plane ms-2"></i></template>
              <template v-else><i class="fas fa-spinner fa-spin me-2"></i>Enviando…</template>
            </button>
          </template>
          <div v-else class="alert alert-success lc-error" role="status">
            <i class="fas fa-envelope-circle-check me-2"></i>{{ sent }}
          </div>
          <p class="lc-hint">¿No tienes acceso a tu correo? Pide a un administrador que restablezca tu contraseña.</p>
          <button type="button" class="lc-link" @click="goLogin"><i class="fas fa-arrow-left me-1"></i>Volver al ingreso</button>
        </form>

        <!-- ── Restablecer: llegó desde el enlace del correo ── -->
        <form v-else-if="mode === 'reset'" @submit.prevent="handleReset" novalidate class="lc-form">
          <template v-if="!done">
            <div class="mf-field">
              <label class="mf-label">Nueva contraseña</label>
              <div class="mf-wrap">
                <i class="fas fa-lock mf-icon"></i>
                <input v-model="newPassword" :type="showPass ? 'text' : 'password'" class="mf-inp"
                  placeholder="Mínimo 8 caracteres" autocomplete="new-password" required />
                <button type="button" class="mf-eye" @click="showPass = !showPass">
                  <i class="fas" :class="showPass ? 'fa-eye-slash' : 'fa-eye'"></i>
                </button>
              </div>
              <PasswordStrength :password="newPassword" />
            </div>
            <div class="mf-field">
              <label class="mf-label">Confirmar contraseña</label>
              <div class="mf-wrap">
                <i class="fas fa-check-double mf-icon"></i>
                <input v-model="confirmPassword" :type="showPass ? 'text' : 'password'" class="mf-inp"
                  placeholder="Repite la contraseña" autocomplete="new-password" required />
              </div>
              <span v-if="confirmPassword && confirmPassword !== newPassword" class="lc-mismatch">Las contraseñas no coinciden</span>
            </div>
            <div v-if="error" class="alert alert-danger lc-error" role="alert">
              <i class="fas fa-circle-exclamation me-2"></i>{{ error }}
            </div>
            <button type="submit" class="lc-btn" :disabled="loading || !canReset">
              <template v-if="!loading">Guardar contraseña <i class="fas fa-check ms-2"></i></template>
              <template v-else><i class="fas fa-spinner fa-spin me-2"></i>Guardando…</template>
            </button>
          </template>
          <template v-else>
            <div class="alert alert-success lc-error" role="status">
              <i class="fas fa-circle-check me-2"></i>{{ done }}
            </div>
            <button type="button" class="lc-btn" @click="goLogin">Ir al ingreso <i class="fas fa-arrow-right ms-2"></i></button>
          </template>
          <button v-if="!done" type="button" class="lc-link" @click="goLogin"><i class="fas fa-arrow-left me-1"></i>Volver al ingreso</button>
        </form>

        <form v-else @submit.prevent="handleLogin" novalidate class="lc-form">
          <div class="mf-field">
            <label class="mf-label">Correo electrónico</label>
            <div class="mf-wrap">
              <i class="fas fa-envelope mf-icon"></i>
              <input
                v-model="username"
                type="text"
                inputmode="email"
                class="mf-inp"
                placeholder="nombre@empresa.com"
                autocomplete="username"
                autocapitalize="off"
                spellcheck="false"
                required
              />
            </div>
          </div>

          <div class="mf-field">
            <label class="mf-label">Contraseña</label>
            <div class="mf-wrap">
              <i class="fas fa-lock mf-icon"></i>
              <input
                v-model="password"
                :type="showPass ? 'text' : 'password'"
                class="mf-inp"
                placeholder="Ingresa tu contraseña"
                autocomplete="current-password"
                required
              />
              <button type="button" class="mf-eye" @click="showPass = !showPass">
                <i class="fas" :class="showPass ? 'fa-eye-slash' : 'fa-eye'"></i>
              </button>
            </div>
          </div>

          <div class="lc-row">
            <div class="form-check lc-remember">
              <input id="lc-remember" v-model="remember" class="form-check-input" type="checkbox" />
              <label class="form-check-label" for="lc-remember">Recordar mi correo</label>
            </div>
            <button type="button" class="lc-link" @click="goForgot">¿Olvidaste tu contraseña?</button>
          </div>

          <div v-if="error" class="alert alert-danger lc-error" role="alert">
            <i class="fas fa-circle-exclamation me-2"></i>{{ error }}
          </div>

          <button type="submit" class="lc-btn" :disabled="loading">
            <template v-if="!loading">Ingresar <i class="fas fa-arrow-right ms-2"></i></template>
            <template v-else><i class="fas fa-spinner fa-spin me-2"></i>Verificando…</template>
          </button>
        </form>

        <p class="lc-footer">Solo para personal autorizado</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { api } from '../api'
import PasswordStrength from '../components/PasswordStrength.vue'

const router  = useRouter()
const route   = useRoute()
const auth    = useAuthStore()

const username = ref('')
const password = ref('')
const remember = ref(false)
const error    = ref('')
const loading  = ref(false)
const showPass = ref(false)

/* ── Modo: ingreso, pedir enlace o crear contraseña nueva (/restablecer?token=…) ── */
const forgot = ref(false)
const mode   = computed(() => route.name === 'reset-password' ? 'reset' : forgot.value ? 'forgot' : 'login')

const heading = computed(() => ({
  login:  { title: 'Bienvenido de vuelta', desc: 'Ingresa tus credenciales para acceder al sistema' },
  forgot: { title: 'Recuperar contraseña', desc: 'Te enviaremos un enlace a tu correo para crear una nueva' },
  reset:  { title: 'Crea tu contraseña',   desc: 'Escribe la nueva contraseña para tu cuenta' },
}[mode.value]))

const forgotEmail     = ref('')
const sent            = ref('')
const newPassword     = ref('')
const confirmPassword = ref('')
const done            = ref('')
const canReset = computed(() => newPassword.value.length >= 8 && newPassword.value === confirmPassword.value)

function goForgot() {
  error.value = ''
  sent.value = ''
  forgotEmail.value = username.value.includes('@') ? username.value.trim() : ''
  forgot.value = true
}

function goLogin() {
  error.value = ''
  forgot.value = false
  if (route.name === 'reset-password') router.replace('/login')
}

async function handleForgot() {
  error.value = ''
  loading.value = true
  try {
    const { message } = await api.post('/api/auth/forgot-password', { email: forgotEmail.value.trim() })
    sent.value = message
  } catch (e) {
    error.value = e.message || 'No fue posible enviar el enlace.'
  } finally {
    loading.value = false
  }
}

async function handleReset() {
  if (!canReset.value) return
  error.value = ''
  loading.value = true
  try {
    const { message } = await api.post('/api/auth/reset-password', {
      token: route.query.token, newPassword: newPassword.value,
    })
    done.value = message
  } catch (e) {
    error.value = e.message || 'No fue posible guardar la contraseña.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const saved = localStorage.getItem('login_remember_user')
  if (saved) {
    username.value = saved
    remember.value = true
  }
  // Motivo de un cierre de sesión forzado (p. ej. cuenta desactivada)
  const notice = sessionStorage.getItem('auth_notice')
  if (notice) {
    error.value = notice
    sessionStorage.removeItem('auth_notice')
  }
})

async function handleLogin() {
  error.value   = ''
  loading.value = true
  await new Promise(r => setTimeout(r, 400))
  const result = await auth.login(username.value.trim(), password.value)
  loading.value = false
  if (result.ok) {
    if (remember.value) {
      localStorage.setItem('login_remember_user', username.value.trim())
    } else {
      localStorage.removeItem('login_remember_user')
    }
    router.push('/')
  } else {
    error.value = result.message
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
}

/* ── Panel izquierdo ── */
.login-left {
  flex: 1 1 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 3rem 3.5rem;
  background: radial-gradient(120% 80% at 0% 0%, #1a3a66 0%, transparent 60%), linear-gradient(160deg, #13284a 0%, #0f1e33 100%);
  color: #fff;
  position: relative;
  overflow: hidden;
}

.login-left-logo {
  width: 100%;
  max-width: 210px;
  height: auto;
  margin-bottom: 2.5rem;
  display: block;
}

.login-left-title {
  font-family: var(--font-display);
  font-size: 1.9rem;
  font-weight: 800;
  line-height: 1.3;
  max-width: 26rem;
  margin: 0 0 1rem;
}

.login-left-desc {
  font-size: 0.95rem;
  color: rgba(255,255,255,0.82);
  max-width: 24rem;
  line-height: 1.6;
  margin: 0 0 2.5rem;
}

.login-left-features { display: flex; flex-direction: column; gap: 1rem; }
.login-left-feature {
  display: flex; align-items: center; gap: 0.75rem;
  font-size: 0.88rem; font-weight: 500; color: rgba(255,255,255,0.92);
}
.login-left-feature i {
  width: 2.1rem; height: 2.1rem; min-width: 2.1rem;
  display: grid; place-items: center;
  background: rgba(255,255,255,0.14);
  border-radius: 0.5rem; font-size: 0.85rem;
}

/* ── Panel derecho ── */
.login-right {
  flex: 1 1 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--body-bg);
  padding: 2rem;
}

.lc-card {
  width: 100%;
  max-width: 24rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header */
.lc-header { text-align: center; }

/* Logo en celular: placa azul para que se vean las letras blancas */
.lc-logo-mobile {
  display: none;
  margin: 0 auto 1.5rem;
  padding: 0.9rem 1.25rem;
  width: fit-content;
  border-radius: 0.9rem;
  background: radial-gradient(120% 80% at 0% 0%, #1a3a66 0%, transparent 60%), linear-gradient(160deg, #13284a 0%, #0f1e33 100%);
  box-shadow: 0 8px 24px rgba(15,30,51,0.25);
}
.lc-logo-mobile img { display: block; height: 44px; width: auto; }

.lc-title {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--ink-900);
  margin: 0 0 0.4rem;
  letter-spacing: -0.01em;
}

.lc-desc {
  font-size: 0.85rem;
  color: var(--ink-500);
  margin: 0;
  line-height: 1.5;
}

/* Form */
.lc-form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.lc-remember {
  margin: -0.3rem 0 0;
  padding-left: 1.6rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.lc-remember .form-check-input {
  margin-top: 0;
  accent-color: var(--accent);
  cursor: pointer;
}
.lc-remember .form-check-label {
  font-size: 0.85rem;
  color: var(--ink-700);
  cursor: pointer;
}

.lc-row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; margin-top: -0.3rem; }
.lc-row .lc-remember { margin: 0; }
.lc-link {
  border: none; background: none; padding: 0;
  font-size: 0.85rem; font-weight: 600; color: var(--accent); cursor: pointer;
  align-self: center;
}
.lc-link:hover { text-decoration: underline; }
.lc-hint { margin: 0; font-size: 0.78rem; line-height: 1.5; color: var(--ink-500); text-align: center; }
.lc-mismatch { font-size: 0.72rem; color: var(--danger); }

.lc-error {
  font-size: 0.86rem;
  padding: 0.65rem 0.9rem;
  margin: 0;
}

.lc-btn {
  margin-top: 0.4rem;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 0.65rem;
  padding: 0.85rem 1rem;
  background: var(--accent);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.01rem;
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(42, 120, 214, 0.32);
  transition: background 0.14s, opacity 0.14s;
}
.lc-btn:hover:not(:disabled) { background: var(--accent-strong); }
.lc-btn:disabled { opacity: 0.75; cursor: default; }

.lc-footer {
  font-size: 0.75rem;
  color: var(--ink-400);
  text-align: center;
  margin: 0;
  padding-top: 1rem;
  border-top: 1px solid var(--line);
}

@media (max-width: 991.98px) {
  .login-left { display: none; }
  .lc-logo-mobile { display: block; }
  .login-right { flex: 1 1 100%; min-width: 0; padding: 1.5rem 1.25rem; }
}

html.dark .lc-title { color: #f1f5f9; }
html.dark .login-right { background: var(--body-bg); }
</style>

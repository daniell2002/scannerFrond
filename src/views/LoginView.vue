<template>
  <div class="login-page">

    <!-- ── Panel izquierdo: marca ── -->
    <div class="login-left">
      <div class="login-left-brand">
        <div class="login-left-icon"><i class="fas fa-project-diagram"></i></div>
        <span>CONEXA</span>
      </div>

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
          <h1 class="lc-title">Bienvenido de vuelta</h1>
          <p class="lc-desc">Ingresa tus credenciales para acceder al sistema</p>
        </div>

        <form @submit.prevent="handleLogin" novalidate class="lc-form">
          <div class="mf-field">
            <label class="mf-label">Usuario</label>
            <div class="mf-wrap">
              <i class="fas fa-user mf-icon"></i>
              <input
                v-model="username"
                type="text"
                class="mf-inp"
                placeholder="Ingresa tu usuario"
                autocomplete="username"
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

          <div class="form-check lc-remember">
            <input id="lc-remember" v-model="remember" class="form-check-input" type="checkbox" />
            <label class="form-check-label" for="lc-remember">Recordar mi usuario</label>
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
  background: linear-gradient(160deg, var(--accent) 0%, var(--accent-strong) 100%);
  color: #fff;
  position: relative;
  overflow: hidden;
}

.login-left-brand {
  display: flex; align-items: center; gap: 0.75rem;
  margin-bottom: 3rem;
  font-family: var(--font-display); font-weight: 700;
  letter-spacing: 0.05rem; font-size: 1.05rem;
}
.login-left-icon {
  width: 2.5rem; height: 2.5rem;
  display: grid; place-items: center;
  border-radius: 0.6rem;
  background: rgba(255,255,255,0.16);
  border: 1px solid rgba(255,255,255,0.26);
  font-size: 1rem;
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
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 0.9rem;
  padding: 2.5rem 2.25rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: var(--shadow-lg);
}

/* Header */
.lc-header { text-align: center; }

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
  .login-right { flex: 1 1 100%; }
}

@media (max-width: 575.98px) {
  .lc-card { padding: 2rem 1.5rem 1.75rem; }
}

html.dark .lc-card { background: #182236; }
html.dark .lc-title { color: #f1f5f9; }
html.dark .login-right { background: var(--body-bg); }
</style>

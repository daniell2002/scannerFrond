<template>
  <div class="login-bg">
    <div class="login-shell">
      <section class="login-showcase">
        <div class="login-showcase-badge">
          <i class="fas fa-qrcode"></i>
          <span>Control de operaciones</span>
        </div>

        <div class="login-showcase-copy">
          <p class="login-brand-sub">LOGICONNET</p>
          <h1 class="login-showcase-title">Gestiona tus órdenes con una vista limpia, rápida y segura.</h1>
          <p class="login-showcase-text">
            Entra al sistema para revisar movimientos, consultar historiales y mantener el flujo de trabajo al día.
          </p>
        </div>

        <div class="login-showcase-stats">
          <article>
            <strong>24/7</strong>
            <span>Disponibilidad</span>
          </article>
          <article>
            <strong>1 clic</strong>
            <span>Acceso rápido</span>
          </article>
          <article>
            <strong>100%</strong>
            <span>Enfoque operativo</span>
          </article>
        </div>

        <div class="login-showcase-card">
          <div class="login-showcase-card-row">
            <span class="login-showcase-dot"></span>
            <span>Monitoreo de órdenes y sedes en tiempo real</span>
          </div>
          <div class="login-showcase-card-row">
            <span class="login-showcase-dot"></span>
            <span>Diseño pensado para escritorio y móvil</span>
          </div>
        </div>
      </section>

      <section class="login-card">
        <div class="login-card-inner">

          <div class="lc-logo">
            <div class="lc-logo-icon">
              <i class="fas fa-industry"></i>
            </div>
            <div class="lc-logo-text">
              <span class="lc-logo-name">LOGICONNET</span>
              <span class="lc-logo-sub">Órdenes</span>
            </div>
          </div>

          <div class="lc-header">
            <h2 class="lc-title">Bienvenido de vuelta</h2>
            <p class="lc-desc">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <form @submit.prevent="handleLogin" novalidate class="lc-form">
            <div class="lc-field">
              <label class="lc-label">Usuario</label>
              <div class="lc-input-wrap">
                <i class="fas fa-user lc-icon"></i>
                <input
                  v-model="username"
                  type="text"
                  class="lc-input"
                  placeholder="Ingresa tu usuario"
                  autocomplete="username"
                  required
                />
              </div>
            </div>

            <div class="lc-field">
              <label class="lc-label">Contraseña</label>
              <div class="lc-input-wrap">
                <i class="fas fa-lock lc-icon"></i>
                <input
                  v-model="password"
                  :type="showPass ? 'text' : 'password'"
                  class="lc-input"
                  placeholder="Ingresa tu contraseña"
                  autocomplete="current-password"
                  required
                />
                <button type="button" class="lc-eye" @click="showPass = !showPass" tabindex="-1">
                  <i class="fas" :class="showPass ? 'fa-eye-slash' : 'fa-eye'"></i>
                </button>
              </div>
            </div>

            <div v-if="error" class="lc-error">
              <i class="fas fa-circle-exclamation"></i>
              <span>{{ error }}</span>
            </div>

            <button type="submit" class="lc-btn" :disabled="loading">
              <span v-if="loading">
                <i class="fas fa-spinner fa-spin"></i> Verificando…
              </span>
              <span v-else>
                Ingresar <i class="fas fa-arrow-right"></i>
              </span>
            </button>
          </form>

          <p class="lc-footer">Solo para personal autorizado</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router  = useRouter()
const auth    = useAuthStore()

const username = ref('')
const password = ref('')
const error    = ref('')
const loading  = ref(false)
const showPass = ref(false)

async function handleLogin() {
  error.value   = ''
  loading.value = true
  await new Promise(r => setTimeout(r, 400))
  const ok = await auth.login(username.value.trim(), password.value)
  loading.value = false
  if (ok) {
    router.push('/')
  } else {
    error.value = 'Usuario o contraseña incorrectos.'
  }
}
</script>

<style scoped>
.login-bg {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(66, 130, 194, 0.22), transparent 34%),
    radial-gradient(circle at bottom right, rgba(239, 176, 54, 0.16), transparent 28%),
    linear-gradient(160deg, #f6f8fc 0%, var(--body-bg) 48%, #eef3f8 100%);
}

.login-shell {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow: hidden;
}

.login-showcase {
  position: relative;
  padding: 3rem 3.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2rem;
  overflow: hidden;
  color: #fff;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.22), transparent 24%),
    linear-gradient(145deg, rgba(20, 33, 61, 0.98), rgba(46, 106, 168, 0.92));
  isolation: isolate;
}

.login-showcase::before {
  content: '';
  position: absolute;
  inset: auto -8% -18% auto;
  width: 18rem;
  height: 18rem;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.18), transparent 72%);
  filter: blur(2px);
  z-index: -1;
}

.login-showcase::after {
  content: '';
  position: absolute;
  inset: 10% auto auto 8%;
  width: 10rem;
  height: 10rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.75rem;
  transform: rotate(14deg);
  z-index: -1;
}

.login-showcase-badge {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.9rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.88);
  font-size: 0.8rem;
  letter-spacing: 0.02rem;
}

.login-showcase-copy {
  max-width: 100%;
}

.login-showcase-title {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 2.4vw, 2.6rem);
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin: 0.4rem 0 1rem;
}

.login-showcase-text {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  line-height: 1.65;
}

.login-showcase-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}

.login-showcase-stats article {
  padding: 1rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
}

.login-showcase-stats strong {
  display: block;
  font-family: var(--font-display);
  font-size: 1.3rem;
  margin-bottom: 0.25rem;
}

.login-showcase-stats span {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.76);
}

.login-showcase-card {
  width: min(100%, 28rem);
  padding: 1.1rem 1.2rem;
  border-radius: 1.15rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.login-showcase-card-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 0.92rem;
  color: rgba(255, 255, 255, 0.86);
}

.login-showcase-card-row + .login-showcase-card-row {
  margin-top: 0.8rem;
}

.login-showcase-dot {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: #f7c948;
  box-shadow: 0 0 0 0.35rem rgba(247, 201, 72, 0.18);
  flex-shrink: 0;
}

.login-card {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 2rem;
  background: #fff;
}

.login-card-inner {
  width: 100%;
  max-width: 26rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

/* Logo */
.lc-logo {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.lc-logo-icon {
  width: 3rem;
  height: 3rem;
  min-width: 3rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 1.2rem;
  box-shadow: 0 6px 18px rgba(66, 130, 194, 0.3);
}

.lc-logo-name {
  display: block;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.2rem;
  color: var(--ink-400);
  text-transform: uppercase;
}

.lc-logo-sub {
  display: block;
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--ink-900);
  line-height: 1.2;
}

/* Header */
.lc-header {
  border-bottom: 1px solid var(--line);
  padding-bottom: 1.5rem;
}

.lc-title {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  color: var(--ink-900);
  margin: 0 0 0.35rem;
  letter-spacing: -0.02em;
}

.lc-desc {
  font-size: 0.92rem;
  color: var(--ink-500);
  margin: 0;
  line-height: 1.5;
}

/* Form */
.lc-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.lc-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.lc-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ink-700);
  letter-spacing: 0.01rem;
}

.lc-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.lc-icon {
  position: absolute;
  left: 1rem;
  color: var(--ink-400);
  font-size: 0.85rem;
  pointer-events: none;
}

.lc-input {
  width: 100%;
  height: 3rem;
  padding: 0 1rem 0 2.6rem;
  border: 1.5px solid var(--line);
  border-radius: 0.75rem;
  background: #f8fafc;
  color: var(--ink-900);
  font-size: 0.94rem;
  outline: none;
  transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
  font-family: var(--font-body);
}

.lc-input::placeholder { color: var(--ink-300); }

.lc-input:focus {
  background: #fff;
  border-color: var(--accent);
  box-shadow: 0 0 0 3.5px rgba(66, 130, 194, 0.15);
}

.lc-eye {
  position: absolute;
  right: 0.85rem;
  background: none;
  border: none;
  color: var(--ink-400);
  cursor: pointer;
  font-size: 0.88rem;
  padding: 0.3rem;
  line-height: 1;
  transition: color 0.15s;
}
.lc-eye:hover { color: var(--ink-700); }

.lc-error {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.86rem;
  color: var(--danger);
  background: rgba(196, 69, 54, 0.07);
  border: 1px solid rgba(196, 69, 54, 0.18);
  border-radius: 0.65rem;
  padding: 0.6rem 0.9rem;
}

.lc-btn {
  width: 100%;
  height: 3.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  color: #fff;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.25rem;
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
  font-family: var(--font-body);
  letter-spacing: 0.01rem;
  box-shadow: 0 8px 20px rgba(66, 130, 194, 0.28);
}

.lc-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(66, 130, 194, 0.34);
}
.lc-btn:active:not(:disabled) { transform: translateY(0); }
.lc-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.lc-footer {
  font-size: 0.78rem;
  color: var(--ink-400);
  text-align: center;
  margin: 0;
}

@media (max-width: 991.98px) {
  .login-bg {
    height: auto;
    min-height: 100vh;
    overflow-y: auto;
  }

  .login-shell {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 100vh;
  }

  .login-showcase {
    padding: 2.5rem 2rem;
    gap: 1.75rem;
    min-height: 50vh;
  }

  .login-showcase-stats {
    grid-template-columns: repeat(3, 1fr);
  }

  .login-card {
    padding: 2.5rem 2rem;
  }
}

@media (max-width: 575.98px) {
  .login-showcase {
    padding: 2rem 1.5rem;
    min-height: auto;
  }

  .login-showcase-title {
    font-size: clamp(1.55rem, 7vw, 2rem);
  }

  .login-showcase-stats {
    grid-template-columns: 1fr;
  }

  .login-card {
    padding: 2rem 1.5rem;
  }

  .login-heading {
    font-size: 1.55rem;
  }
}

html.dark .login-bg {
  background:
    radial-gradient(circle at top left, rgba(66, 130, 194, 0.2), transparent 34%),
    radial-gradient(circle at bottom right, rgba(247, 201, 72, 0.12), transparent 28%),
    linear-gradient(160deg, #0b1220 0%, #0f172a 50%, #111c31 100%);
}

html.dark .login-shell {
  background: rgba(15, 23, 42, 0.72);
}

html.dark .login-card {
  background: #0d1424;
}

html.dark .lc-title,
html.dark .lc-logo-sub {
  color: #f1f5f9;
}

html.dark .lc-header {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

html.dark .lc-input {
  background: #1e293b;
  border-color: rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
}

html.dark .lc-input:focus {
  background: #1e293b;
  border-color: var(--accent);
}
</style>

<template>
  <div class="login-bg">
    <div class="login-card">

      <div class="login-brand">
        <div class="login-brand-icon">
          <i class="fas fa-industry"></i>
        </div>
        <div>
          <p class="login-brand-sub">LOGICONNET</p>
          <span class="login-brand-title">Ordenes</span>
        </div>
      </div>

      <h2 class="login-heading">Iniciar sesión</h2>
      <p class="login-sub">Ingresa tus credenciales para continuar</p>

      <form @submit.prevent="handleLogin" novalidate>
        <div class="login-field">
          <label class="login-label">Usuario</label>
          <div class="login-input-wrap">
            <span class="login-input-icon"><i class="fas fa-user"></i></span>
            <input
              v-model="username"
              type="text"
              class="login-input"
              placeholder="Tu usuario"
              autocomplete="username"
              required
            />
          </div>
        </div>

        <div class="login-field">
          <label class="login-label">Contraseña</label>
          <div class="login-input-wrap">
            <span class="login-input-icon"><i class="fas fa-lock"></i></span>
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

        <div v-if="error" class="login-error">
          <i class="fas fa-circle-exclamation me-2"></i>{{ error }}
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="loading"><i class="fas fa-spinner fa-spin me-2"></i>Verificando…</span>
          <span v-else><i class="fas fa-sign-in-alt me-2"></i>Ingresar</span>
        </button>
      </form>

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
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--body-bg);
  padding: 1rem;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 1rem;
  padding: 2.25rem 2rem;
  box-shadow: var(--shadow-lg);
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 2rem;
}

.login-brand-icon {
  width: 2.75rem;
  height: 2.75rem;
  min-width: 2.75rem;
  background: var(--accent);
  border-radius: 0.6rem;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 1.15rem;
}

.login-brand-sub {
  font-size: 0.6rem;
  letter-spacing: 0.18rem;
  color: var(--ink-500);
  margin: 0;
  text-transform: uppercase;
}

.login-brand-title {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--ink-900);
  line-height: 1.2;
}

.login-heading {
  font-family: var(--font-display);
  font-size: 1.45rem;
  font-weight: 700;
  color: var(--ink-900);
  margin: 0 0 0.25rem;
}

.login-sub {
  font-size: 0.85rem;
  color: var(--ink-500);
  margin: 0 0 1.75rem;
}

.login-field {
  margin-bottom: 1.1rem;
}

.login-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--ink-700);
  margin-bottom: 0.4rem;
}

.login-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.login-input-icon {
  position: absolute;
  left: 0.85rem;
  color: var(--ink-500);
  font-size: 0.9rem;
  pointer-events: none;
}

.login-input {
  width: 100%;
  padding: 0.7rem 0.85rem 0.7rem 2.4rem;
  border: 1px solid var(--line);
  border-radius: 0.5rem;
  background: var(--paper);
  color: var(--ink-900);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  font-family: var(--font-body);
}

.login-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(66, 130, 194, 0.15);
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

.login-error {
  font-size: 0.83rem;
  color: var(--danger);
  background: rgba(196, 69, 54, 0.08);
  border: 1px solid rgba(196, 69, 54, 0.2);
  border-radius: 0.4rem;
  padding: 0.55rem 0.85rem;
  margin-bottom: 1rem;
}

.login-btn {
  width: 100%;
  padding: 0.75rem;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background 0.15s, opacity 0.15s;
  font-family: var(--font-body);
}

.login-btn:hover:not(:disabled) { background: var(--accent-strong); }
.login-btn:disabled { opacity: 0.65; cursor: not-allowed; }
</style>

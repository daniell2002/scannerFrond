<template>
  <div class="pcr-overlay" role="dialog" aria-modal="true" aria-labelledby="pcr-title">
    <form class="pcr-card" @submit.prevent="save" novalidate>
      <div class="pcr-icon"><i class="fas fa-shield-alt"></i></div>
      <h2 id="pcr-title" class="pcr-title">Crea tu contraseña</h2>
      <p class="pcr-desc">
        Hola, <strong>{{ auth.user?.name }}</strong>. Ingresaste con una contraseña temporal;
        por seguridad debes definir una propia para continuar.
      </p>

      <div class="mf-field">
        <label class="mf-label">Nueva contraseña</label>
        <div class="mf-wrap">
          <i class="fas fa-lock mf-icon"></i>
          <input
            v-model="password"
            :type="show ? 'text' : 'password'"
            class="mf-inp"
            placeholder="Mínimo 8 caracteres"
            autocomplete="new-password"
            autofocus
          />
          <button type="button" class="mf-eye" @click="show = !show" :title="show ? 'Ocultar' : 'Mostrar'">
            <i class="fas" :class="show ? 'fa-eye-slash' : 'fa-eye'"></i>
          </button>
        </div>
        <PasswordStrength :password="password" />
      </div>

      <div class="mf-field">
        <label class="mf-label">Confirmar contraseña</label>
        <div class="mf-wrap">
          <i class="fas fa-check-double mf-icon"></i>
          <input
            v-model="confirm"
            :type="show ? 'text' : 'password'"
            class="mf-inp"
            placeholder="Repite la contraseña"
            autocomplete="new-password"
          />
        </div>
        <span v-if="confirm && confirm !== password" class="pcr-mismatch">Las contraseñas no coinciden</span>
      </div>

      <div v-if="error" class="mf-error"><i class="fas fa-exclamation-circle"></i>{{ error }}</div>

      <button type="submit" class="btn-save pcr-submit" :disabled="!canSave || saving">
        <i class="fas" :class="saving ? 'fa-spinner fa-spin' : 'fa-check'"></i>
        {{ saving ? 'Guardando…' : 'Guardar y continuar' }}
      </button>
      <button type="button" class="pcr-logout" @click="logout">Cerrar sesión</button>
    </form>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import PasswordStrength from './PasswordStrength.vue'

const auth   = useAuthStore()
const notify = useNotificationsStore()
const router = useRouter()

const password = ref('')
const confirm  = ref('')
const show     = ref(false)
const saving   = ref(false)
const error    = ref('')

const canSave = computed(() => password.value.length >= 8 && password.value === confirm.value)

async function save() {
  if (!canSave.value || saving.value) return
  error.value = ''
  saving.value = true
  try {
    await auth.changePassword(password.value)
    notify.success('Tu contraseña quedó guardada.', { title: 'Contraseña actualizada' })
  } catch (e) {
    error.value = e.message || 'No fue posible guardar la contraseña.'
  } finally {
    saving.value = false
  }
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.pcr-overlay {
  position: fixed; inset: 0; z-index: 1100;
  display: grid; place-items: center; padding: 1rem;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
}
.pcr-card {
  width: 100%; max-width: 420px;
  padding: 2rem 1.75rem 1.5rem;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 1rem;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.3);
  display: flex; flex-direction: column; gap: 0.9rem;
}
.pcr-icon {
  width: 3.25rem; height: 3.25rem; margin: 0 auto;
  border-radius: 50%; display: grid; place-items: center;
  font-size: 1.25rem; color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}
.pcr-title { margin: 0; text-align: center; font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; color: var(--ink-900); }
.pcr-desc  { margin: 0 0 0.25rem; text-align: center; font-size: 0.85rem; line-height: 1.55; color: var(--ink-500); }
.pcr-desc strong { color: var(--ink-900); }
.pcr-mismatch { font-size: 0.72rem; color: var(--danger); }
.pcr-submit { justify-content: center; width: 100%; margin-top: 0.25rem; }
.pcr-logout {
  align-self: center; border: none; background: none;
  font-size: 0.8rem; color: var(--ink-500); cursor: pointer; text-decoration: underline;
}
.pcr-logout:hover { color: var(--ink-900); }
</style>

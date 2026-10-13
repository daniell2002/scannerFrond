<template>
  <div class="page-wrap">
    <div class="panel na">
      <span class="na-icon"><i class="fas fa-lock"></i></span>
      <h1 class="na-title">Aún no tienes módulos asignados</h1>
      <p class="na-sub">
        Tu cuenta está activa, pero un administrador debe habilitarte al menos un módulo
        para que puedas usar el sistema.
      </p>
      <button type="button" class="btn-cancel" @click="logout">
        <i class="fas fa-arrow-right-from-bracket"></i>Cerrar sesión
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.na { max-width: 460px; margin: 3rem auto; padding: 2.5rem 2rem; text-align: center; display: flex; flex-direction: column; align-items: center; }
.na-icon { width: 3.25rem; height: 3.25rem; display: grid; place-items: center; border-radius: 50%; background: var(--surface); color: var(--ink-500); font-size: 1.2rem; margin-bottom: 1rem; }
.na-title { margin: 0 0 0.5rem; font-size: 1.15rem; font-weight: 700; color: var(--ink-900); }
.na-sub { margin: 0 0 1.5rem; font-size: 0.875rem; line-height: 1.6; color: var(--ink-500); }
</style>

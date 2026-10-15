import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './style.css'
import App from './App.vue'
import { routes, setupGuard } from './router'

// El rol "operario" ya no existe (ahora es supervisor): esas sesiones guardadas
// se descartan para que vuelvan a ingresar y reciban su rol actual.
try {
	if (JSON.parse(localStorage.getItem('auth_user') || 'null')?.role === 'operario') {
		localStorage.removeItem('auth_user')
		localStorage.removeItem('auth_token')
	}
} catch { /* sesión guardada ilegible: el guard la trata como sin sesión */ }

const app = createApp(App)
const pinia = createPinia()
const router = createRouter({
	history: createWebHistory(),
	routes,
})

setupGuard(router)

app.use(pinia)
app.use(router)

app.mount('#app')

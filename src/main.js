import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './style.css'
import App from './App.vue'
import { routes, setupGuard } from './router'

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

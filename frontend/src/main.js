import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router' // Impor router yang baru dibuat

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router) // Gunakan router
app.mount('#app')
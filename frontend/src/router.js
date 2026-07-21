import { createRouter, createWebHistory } from 'vue-router'

// Impor semua komponen yang sudah kita buat
import DashboardKoperasi from './components/DashboardKoperasi.vue'
import KelolaBarang from './components/KelolaBarang.vue'
import KelolaPengguna from './components/KelolaPengguna.vue'
import KasirSwalayan from './components/KasirSwalayan.vue'
import KasirGrosir from './components/KasirGrosir.vue'

// Buat peta rutenya
const routes = [
    { path: '/', component: DashboardKoperasi }, // Halaman utama (Dashboard)
    { path: '/kelola-barang', component: KelolaBarang },
    { path: '/kelola-pengguna', component: KelolaPengguna },
    { path: '/kasir-swalayan', component: KasirSwalayan },
    { path: '/kasir-grosir', component: KasirGrosir },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
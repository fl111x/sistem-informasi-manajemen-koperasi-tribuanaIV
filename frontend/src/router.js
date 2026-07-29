import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth'

// Impor semua komponen yang sudah kita buat
import DashboardKoperasi from './components/DashboardKoperasi.vue'
import KelolaBarang from './components/KelolaBarang.vue'
import KelolaAnggota from './components/KelolaAnggota.vue'
import KelolaSupplier from './components/KelolaSupplier.vue'
import KelolaPengguna from './components/KelolaPengguna.vue'
import KasirSwalayan from './components/KasirSwalayan.vue'
import KasirGrosir from './components/KasirGrosir.vue'
import HalamanLogin from './components/HalamanLogin.vue'

// Buat peta rutenya
const routes = [
    { path: '/login', component: HalamanLogin },
    { path: '/', component: DashboardKoperasi, meta: { requiresAuth: true } },
    { path: '/kelola-barang', component: KelolaBarang, meta: { requiresAuth: true } },
    { path: '/kelola-anggota', component: KelolaAnggota, meta: { requiresAuth: true } },
    { path: '/kelola-supplier', component: KelolaSupplier, meta: { requiresAuth: true } },
    { path: '/kelola-pengguna', component: KelolaPengguna, meta: { requiresAuth: true } },
    { path: '/kasir-swalayan', component: KasirSwalayan, meta: { requiresAuth: true } },
    { path: '/kasir-grosir', component: KasirGrosir, meta: { requiresAuth: true } },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

// Navigation Guard
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    const isAuthenticated = authStore.isAuthenticated;
    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/login');
    } else if (to.path === '/login' && isAuthenticated) {
        next('/');
    } else {
        next();
    }
});

export default router
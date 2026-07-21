<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

const router = useRouter();

// State untuk menyimpan input pengguna
const namaPengguna = ref('');
const kataSandi = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

// LOGIKA JAM DINDING (ANALOG & DIGITAL)
const waktuSaatIni = ref(new Date());
let timer;

// Mulai penghitung waktu saat halaman dimuat
onMounted(() => {
  timer = setInterval(() => {
    waktuSaatIni.value = new Date();
  }, 1000);
});

// Bersihkan memori saat berpindah halaman (penting untuk PC lawas)
onUnmounted(() => {
  clearInterval(timer);
});

// Kalkulasi derajat rotasi untuk jarum jam analog
const derajatDetik = computed(() => waktuSaatIni.value.getSeconds() * 6);
const derajatMenit = computed(() => waktuSaatIni.value.getMinutes() * 6 + waktuSaatIni.value.getSeconds() * 0.1);
const derajatJam = computed(() => (waktuSaatIni.value.getHours() % 12) * 30 + waktuSaatIni.value.getMinutes() * 0.5);

// Format tampilan jam digital dan tanggal
const teksJam = computed(() => {
  return waktuSaatIni.value.toLocaleTimeString('id-ID', { 
    hour: '2-digit', minute: '2-digit', second: '2-digit' 
  }).replace(/\./g, ':');
});

const teksTanggal = computed(() => {
  return waktuSaatIni.value.toLocaleDateString('id-ID', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
});
// ==========================================

const prosesLogin = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    
    const response = await api.post('/auth/login', {
      username: namaPengguna.value,
      password: kataSandi.value
    });
    
    // Simpan informasi user (tanpa token karena token otomatis disimpan di HTTP-Only Cookie)
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    // Redirect ke halaman dashboard
    router.push('/');
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Terjadi kesalahan saat login.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row font-sans text-slate-800">
    
    <!-- Panel Kiri (Informasi Sistem & Jam) -->
    <div class="w-full md:w-1/2 bg-slate-50 p-12 lg:p-24 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200 min-h-screen">
      
      <!-- Logo & Nama Sistem -->
      <div class="flex items-center gap-3">
        <div class="bg-blue-600 text-white p-2.5 rounded-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-bold leading-tight">Koperasi Tribuana IV</h2>
          <p class="text-sm text-slate-500 m-0">SIM Swalayan & Grosir</p>
        </div>
      </div>

      <!-- Jam Dinding Aktif -->
      <div class="flex flex-col items-center justify-center flex-grow py-10">
        
        <!-- Jam Analog -->
        <div class="relative w-56 h-56 rounded-full border-8 border-slate-200 bg-white shadow-sm flex items-center justify-center mb-8">
          
          <!-- Titik Tengah -->
          <div class="absolute w-4 h-4 bg-blue-600 rounded-full z-20"></div>

          <!-- Jarum Jam -->
          <div class="absolute inset-0 flex justify-center z-10" :style="`transform: rotate(${derajatJam}deg)`">
            <div class="w-1.5 bg-slate-800 rounded-full origin-bottom" style="height: 25%; margin-top: 25%;"></div>
          </div>

          <!-- Jarum Menit -->
          <div class="absolute inset-0 flex justify-center z-10" :style="`transform: rotate(${derajatMenit}deg)`">
            <div class="w-1 bg-slate-500 rounded-full origin-bottom" style="height: 35%; margin-top: 15%;"></div>
          </div>

          <!-- Jarum Detik -->
          <div class="absolute inset-0 flex justify-center z-10" :style="`transform: rotate(${derajatDetik}deg)`">
            <div class="w-0.5 bg-red-500 rounded-full origin-bottom" style="height: 40%; margin-top: 10%;"></div>
          </div>
          
        </div>

        <!-- Jam Digital -->
        <div class="text-center">
          <h1 class="text-5xl font-bold text-slate-800 tracking-wider mb-2 font-mono">{{ teksJam }}</h1>
          <p class="text-slate-500 text-lg">{{ teksTanggal }}</p>
        </div>

      </div>

      <!-- Footer Panel Kiri -->
      <div class="text-xs text-slate-400">
        Prototipe antarmuka · Mode Terang
      </div>
    </div>

    <!-- Panel Kanan (Form Login) -->
    <div class="w-full md:w-1/2 p-12 lg:p-24 bg-white flex flex-col justify-center min-h-screen">
      
      <div class="w-full max-w-md mx-auto">
        <h2 class="text-3xl font-bold mb-2">Masuk ke Sistem</h2>
        <p class="text-base text-slate-500 mb-10">Masukkan kredensial Anda untuk memulai giliran (shift).</p>

        <!-- Pesan Error -->
        <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
          {{ errorMessage }}
        </div>

        <form @submit.prevent="prosesLogin">
          
          <!-- Input Nama Pengguna -->
          <div class="mb-6">
            <label class="block text-sm font-semibold mb-2">Nama Pengguna</label>
            <input 
              type="text" 
              v-model="namaPengguna"
              class="w-full border border-slate-300 p-3 rounded text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
              placeholder="Masukkan nama pengguna"
              required
            >
          </div>

          <!-- Input Kata Sandi -->
          <div class="mb-10">
            <label class="block text-sm font-semibold mb-2">Kata Sandi</label>
            <input 
              type="password" 
              v-model="kataSandi"
              class="w-full border border-slate-300 p-3 rounded text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
              placeholder="••••••••"
              required
            >
          </div>

          <!-- Tombol Masuk -->
          <button 
            type="submit" 
            :disabled="isLoading"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded transition-colors flex justify-center items-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            <span>{{ isLoading ? 'Memproses...' : 'Masuk' }}</span>

            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </button>

        </form>
      </div>
    </div>

  </div>
</template>
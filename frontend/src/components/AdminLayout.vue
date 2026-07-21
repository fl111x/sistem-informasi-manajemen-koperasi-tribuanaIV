<script setup>
// Layout ini bertugas sebagai kerangka/bingkai utama aplikasi
</script>

<template>
  <!-- Pembungkus Utama Layar Penuh -->
  <div class="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
    
    <!-- ========================================== -->
    <!-- SIDEBAR MASTER (Semua Hak Akses Terbuka) -->
    <!-- ========================================== -->
    <aside class="w-64 bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 z-20">
      <div>
        <!-- Logo Koperasi -->
        <div class="p-5 flex items-center gap-3 border-b border-slate-200">
          <div class="bg-blue-600 text-white p-2 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <h2 class="text-sm font-bold leading-tight text-slate-800">Koperasi Tribuana IV</h2>
            <p class="text-xs text-slate-500 m-0">Swalayan & Grosir</p>
          </div>
        </div>

        <!-- Daftar Menu -->
        <nav class="p-3 flex flex-col gap-1">
          <!-- Dashboard -->
          <a href="#" class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Dashboard
          </a>
          
          <!-- Kelola Barang (Mode Tidak Aktif) -->
          <a href="#" class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            Kelola Barang
          </a>

          <!-- Kelola Pengguna (Mode Aktif) -->
          <a href="#" class="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Kelola Pengguna
          </a>
          
          <!-- Kasir Swalayan -->
          <a href="#" class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Kasir Swalayan
          </a>
          
          <!-- Kasir Grosir -->
          <a href="#" class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            Kasir Grosir
          </a>
        </nav>
      </div>

      <!-- Profil Admin -->
      <div class="p-4 border-t border-slate-200">
        <div class="px-3 py-2.5 bg-slate-100 rounded-lg mb-2">
          <p class="text-sm font-bold text-slate-800 m-0">Administrator</p>
          <p class="text-xs text-slate-500 m-0">Akses Penuh</p>
        </div>
        <button class="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Keluar
        </button>
      </div>
    </aside>

    <!-- ========================================== -->
    <!-- RUANG KOSONG UNTUK KONTEN (SLOT) -->
    <!-- ========================================== -->
    <div class="flex-1 flex flex-col h-full overflow-hidden bg-white relative">
      <!-- Di sinilah komponen lain akan dimuat otomatis -->
      <slot></slot>
    </div>

  </div>
</template>
<script setup>
import { ref } from 'vue';

// Data simulasi untuk Dashboard
const ringkasan = ref({
  omzetSwalayan: 'Rp 35.200.000',
  omzetGrosir: 'Rp 70.100.000',
  totalOmzet: 'Rp 105.300.000',
  stokKritis: 2
});

// Data simulasi untuk grafik batang (persentase tinggi bar)
const dataGrafik = ref([
  { hari: 'Sen', swalayan: 40, grosir: 60 },
  { hari: 'Sel', swalayan: 30, grosir: 50 },
  { hari: 'Rab', swalayan: 50, grosir: 70 },
  { hari: 'Kam', swalayan: 35, grosir: 65 },
  { hari: 'Jum', swalayan: 60, grosir: 80 },
  { hari: 'Sab', swalayan: 75, grosir: 90 },
  { hari: 'Min', swalayan: 45, grosir: 55 },
]);

const peringatanStok = ref([
  { nama: 'Kopi Sachet 20 x 25 g', kode: 'BRG-0005', sisa: 34, min: 40 },
  { nama: 'Pasta Gigi 190 g', kode: 'BRG-0010', sisa: 22, min: 36 },
]);

const transaksiTerbaru = ref([
  { nota: 'SW-250716-0098', waktu: '14:32', sektor: 'Swalayan', kasir: 'Rina', total: 'Rp 84.500' },
  { nota: 'GR-250716-0031', waktu: '14:20', sektor: 'Grosir', kasir: 'Budi', total: 'Rp 1.284.000' },
  { nota: 'SW-250716-0097', waktu: '14:11', sektor: 'Swalayan', kasir: 'Rina', total: 'Rp 19.500' },
  { nota: 'SW-250716-0096', waktu: '13:58', sektor: 'Swalayan', kasir: 'Dewi', total: 'Rp 156.000' },
  { nota: 'GR-250716-0030', waktu: '13:40', sektor: 'Grosir', kasir: 'Budi', total: 'Rp 2.650.000' },
]);
</script>

<template>
  <div class="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
    
    <!-- ========================================== -->
    <!-- SIDEBAR (Sama, tapi Dashboard yang aktif) -->
    <!-- ========================================== -->
    <aside class="w-64 bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0">
      <div>
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

        <nav class="p-3 flex flex-col gap-1">
          <!-- Dashboard Aktif -->
          <a href="#" class="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Dashboard
          </a>
          <!-- Kasir Swalayan Tidak Aktif -->
          <a href="#" class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Kasir Swalayan
          </a>
        </nav>
      </div>

      <div class="p-4 border-t border-slate-200">
        <div class="px-3 py-2.5 bg-slate-100 rounded-lg mb-2">
          <p class="text-sm font-bold text-slate-800 m-0">Admin</p>
          <p class="text-xs text-slate-500 m-0">Semua Akses</p>
        </div>
        <button class="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Keluar
        </button>
      </div>
    </aside>

    <!-- ========================================== -->
    <!-- KONTEN UTAMA DASHBOARD -->
    <!-- ========================================== -->
    <main class="flex-1 flex flex-col h-full overflow-y-auto">
      
      <!-- Header -->
      <header class="px-8 py-6">
        <h1 class="text-2xl font-bold text-slate-800">Selamat datang, Admin</h1>
        <p class="text-sm text-slate-500 mt-1">Ringkasan penjualan dan operasional hari ini.</p>
      </header>

      <div class="px-8 pb-8 flex flex-col gap-6">
        
        <!-- Baris 1: Kartu Ringkasan (4 Kolom) -->
        <div class="grid grid-cols-4 gap-6">
          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div class="flex justify-between items-start mb-2">
              <span class="text-sm font-medium text-slate-500">Omzet Swalayan (7 hari)</span>
              <div class="bg-slate-100 p-1.5 rounded text-slate-500"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
            </div>
            <h3 class="text-2xl font-bold text-slate-800">{{ ringkasan.omzetSwalayan }}</h3>
            <p class="text-xs text-slate-400 mt-1">Penjualan eceran</p>
          </div>

          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div class="flex justify-between items-start mb-2">
              <span class="text-sm font-medium text-slate-500">Omzet Grosir (7 hari)</span>
              <div class="bg-slate-100 p-1.5 rounded text-slate-500"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>
            </div>
            <h3 class="text-2xl font-bold text-slate-800">{{ ringkasan.omzetGrosir }}</h3>
            <p class="text-xs text-slate-400 mt-1">Penjualan partai</p>
          </div>

          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div class="flex justify-between items-start mb-2">
              <span class="text-sm font-medium text-slate-500">Total Omzet</span>
              <div class="bg-slate-100 p-1.5 rounded text-slate-500"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            </div>
            <h3 class="text-2xl font-bold text-slate-800">{{ ringkasan.totalOmzet }}</h3>
            <p class="text-xs text-slate-400 mt-1">Gabungan dua sektor</p>
          </div>

          <div class="bg-red-50 p-5 rounded-xl border border-red-200 shadow-sm flex flex-col justify-between">
            <div class="flex justify-between items-start mb-2">
              <span class="text-sm font-medium text-red-700">Stok Kritis</span>
              <div class="bg-red-100 p-1.5 rounded text-red-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
            </div>
            <h3 class="text-2xl font-bold text-red-700">{{ ringkasan.stokKritis }} item</h3>
            <p class="text-xs text-red-500 mt-1">Di bawah stok minimal</p>
          </div>
        </div>

        <!-- Baris 2: Grafik & Peringatan Stok (3 Kolom) -->
        <div class="grid grid-cols-3 gap-6">
          
          <!-- Grafik Batang (2 Kolom) -->
          <div class="col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 class="text-base font-bold text-slate-800 mb-1">Omzet per Sektor (7 hari terakhir)</h3>
            <div class="flex gap-4 items-center mb-6 text-xs font-medium">
              <div class="flex items-center gap-1.5 text-slate-500"><div class="w-2.5 h-2.5 rounded-full bg-blue-500"></div>Swalayan</div>
              <div class="flex items-center gap-1.5 text-slate-500"><div class="w-2.5 h-2.5 rounded-full bg-slate-300"></div>Grosir</div>
            </div>
            
            <!-- Simulasi Bar Chart Murni CSS -->
            <div class="flex items-end justify-between h-48 pt-4 border-b border-slate-200">
              <div v-for="(item, index) in dataGrafik" :key="index" class="flex flex-col items-center gap-2 w-1/7">
                <div class="flex gap-1 items-end h-full w-full justify-center">
                  <!-- Bar Swalayan -->
                  <div class="w-4 bg-blue-500 rounded-t-sm" :style="`height: ${item.swalayan}%`"></div>
                  <!-- Bar Grosir -->
                  <div class="w-4 bg-slate-300 rounded-t-sm" :style="`height: ${item.grosir}%`"></div>
                </div>
                <span class="text-xs text-slate-500">{{ item.hari }}</span>
              </div>
            </div>
          </div>

          <!-- Peringatan Stok (1 Kolom) -->
          <div class="col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div class="flex items-center gap-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 class="text-base font-bold text-slate-800">Peringatan Stok</h3>
            </div>
            <div class="flex flex-col gap-4">
              <div v-for="(stok, index) in peringatanStok" :key="index" class="border-b border-slate-100 pb-3 last:border-0">
                <div class="flex justify-between items-start mb-1">
                  <p class="text-sm font-semibold text-slate-800">{{ stok.nama }}</p>
                  <span class="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">{{ stok.sisa }} / {{ stok.min }}</span>
                </div>
                <p class="text-xs text-slate-500">{{ stok.kode }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Baris 3: Tabel Transaksi Terbaru (Lebar Penuh karena Produk Terlaris dihapus) -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-6 border-b border-slate-200">
            <h3 class="text-base font-bold text-slate-800">Transaksi Terbaru</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
                <tr>
                  <th class="px-6 py-4">No. Nota</th>
                  <th class="px-6 py-4">Waktu</th>
                  <th class="px-6 py-4">Sektor</th>
                  <th class="px-6 py-4">Kasir</th>
                  <th class="px-6 py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(trx, index) in transaksiTerbaru" :key="index" class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td class="px-6 py-4 font-medium text-slate-800">{{ trx.nota }}</td>
                  <td class="px-6 py-4">{{ trx.waktu }}</td>
                  <td class="px-6 py-4">
                    <span class="px-2.5 py-1 rounded text-xs font-semibold" :class="trx.sektor === 'Swalayan' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'">
                      {{ trx.sektor }}
                    </span>
                  </td>
                  <td class="px-6 py-4">{{ trx.kasir }}</td>
                  <td class="px-6 py-4 text-right font-bold text-slate-800">{{ trx.total }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>
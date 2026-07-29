<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const activeTab = ref('Riwayat Belanja Anggota'); // 'Riwayat Belanja Anggota', 'Kalkulasi SHU'

// Data Laporan Belanja
const riwayatBelanja = ref([]);
const searchQuery = ref('');
const bulanFilter = ref(new Date().getMonth() + 1); 
const tahunFilter = ref(new Date().getFullYear());
const isLoadingBelanja = ref(false);

// Data Simulasi SHU
const totalLaba = ref(0);
const persentaseSHUAnggota = ref(40); // misal 40% dari Laba diturunkan sbg SHU Anggota
const totalBelanjaSeluruhAnggota = ref(1); // Mencegah division by zero
const simulasiAnggota = ref([]);
const isLoadingSHU = ref(false);

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const fetchLaporanBelanja = async () => {
  try {
    isLoadingBelanja.value = true;
    
    // Asumsikan backend memiliki endpoint /laporan/belanja-anggota
    // Karena belum ada, kita simulasikan datanya
    const response = await api.get('/laporan/belanja-anggota').catch(() => {
      // Mock Data
      return {
        data: [
          { id_transaksi: 101, nrp: '123456789', nama_anggota: 'Sertu Budi', waktu: '2026-07-28T10:00:00.000Z', total_belanja: 150000 },
          { id_transaksi: 102, nrp: '198701012010121001', nama_anggota: 'Agus Santoso', waktu: '2026-07-28T14:30:00.000Z', total_belanja: 75000 },
          { id_transaksi: 103, nrp: '123456789', nama_anggota: 'Sertu Budi', waktu: '2026-07-29T09:15:00.000Z', total_belanja: 200000 },
        ]
      };
    });

    riwayatBelanja.value = response.data;
  } catch (error) {
    console.error('Gagal mengambil laporan:', error);
  } finally {
    isLoadingBelanja.value = false;
  }
};

const hitungSimulasiSHU = () => {
  isLoadingSHU.value = true;
  // Simulasi Perhitungan SHU = (Belanja Anggota / Total Belanja Seluruh Anggota) x Alokasi SHU
  
  const alokasiSHU = totalLaba.value * (persentaseSHUAnggota.value / 100);
  
  // Mengelompokkan belanja per NRP
  const rekap = {};
  let totalBelanjaSemua = 0;
  
  riwayatBelanja.value.forEach(trx => {
    if (trx.nrp) {
      if (!rekap[trx.nrp]) {
        rekap[trx.nrp] = { nrp: trx.nrp, nama: trx.nama_anggota, total_belanja: 0 };
      }
      rekap[trx.nrp].total_belanja += trx.total_belanja;
      totalBelanjaSemua += trx.total_belanja;
    }
  });

  totalBelanjaSeluruhAnggota.value = totalBelanjaSemua > 0 ? totalBelanjaSemua : 1;

  simulasiAnggota.value = Object.values(rekap).map(anggota => {
    const poinSHU = (anggota.total_belanja / totalBelanjaSeluruhAnggota.value) * alokasiSHU;
    return {
      ...anggota,
      estimasi_shu: poinSHU
    };
  });
  
  // Sort descending by SHU
  simulasiAnggota.value.sort((a, b) => b.estimasi_shu - a.estimasi_shu);
  
  isLoadingSHU.value = false;
};

onMounted(() => {
  fetchLaporanBelanja();
});

const formatRupiah = (angka) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};
</script>

<template>
  <main class="flex-1 flex flex-col h-full overflow-hidden bg-white w-full">
    
    <!-- Header -->
    <header class="px-8 py-6 border-b border-slate-200 flex justify-between items-center flex-shrink-0 bg-white">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Akuntansi & Laporan</h1>
        <p class="text-sm text-slate-500 mt-1">Riwayat belanja anggota dan kalkulasi pembagian Sisa Hasil Usaha (SHU).</p>
      </div>
      <div class="flex bg-slate-100 p-1 rounded-lg">
        <button 
          @click="activeTab = 'Riwayat Belanja Anggota'" 
          :class="activeTab === 'Riwayat Belanja Anggota' ? 'bg-white shadow-sm font-bold text-slate-800' : 'text-slate-500 hover:text-slate-700'"
          class="px-4 py-2 rounded-md text-sm transition-all"
        >
          Riwayat Belanja
        </button>
        <button 
          @click="activeTab = 'Kalkulasi SHU'" 
          :class="activeTab === 'Kalkulasi SHU' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'"
          class="px-4 py-2 rounded-md text-sm transition-all"
        >
          Kalkulasi SHU
        </button>
      </div>
    </header>

    <div class="flex-1 overflow-auto bg-slate-50 p-8">
      
      <!-- TAB: RIWAYAT BELANJA -->
      <div v-if="activeTab === 'Riwayat Belanja Anggota'" class="h-full flex flex-col gap-4">
        
        <!-- Filter Bar -->
        <div class="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex gap-4 items-end flex-shrink-0">
          <div class="flex-1">
            <label class="block text-xs font-semibold text-slate-600 mb-1">Cari NRP atau Nama Anggota</label>
            <input type="text" v-model="searchQuery" placeholder="Cari..." class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 text-sm">
          </div>
          <div class="w-48">
            <label class="block text-xs font-semibold text-slate-600 mb-1">Bulan</label>
            <select v-model="bulanFilter" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 text-sm">
              <option v-for="(m, i) in months" :key="i" :value="i+1">{{ m }}</option>
            </select>
          </div>
          <div class="w-32">
            <label class="block text-xs font-semibold text-slate-600 mb-1">Tahun</label>
            <input type="number" v-model="tahunFilter" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 text-sm">
          </div>
          <button @click="fetchLaporanBelanja" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md text-sm h-[38px] transition-colors">
            Terapkan
          </button>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1 flex flex-col">
          <div class="overflow-auto flex-1">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-100 text-slate-600 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th class="px-6 py-4">ID Transaksi</th>
                  <th class="px-6 py-4">Waktu</th>
                  <th class="px-6 py-4">NRP</th>
                  <th class="px-6 py-4">Nama Anggota</th>
                  <th class="px-6 py-4 text-right">Total Belanja</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoadingBelanja">
                  <td colspan="5" class="px-6 py-12 text-center text-slate-400">Memuat data...</td>
                </tr>
                <tr v-else-if="riwayatBelanja.length === 0">
                  <td colspan="5" class="px-6 py-12 text-center text-slate-400">Belum ada riwayat belanja pada periode ini.</td>
                </tr>
                <tr v-else v-for="item in riwayatBelanja" :key="item.id_transaksi" class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td class="px-6 py-3 font-medium text-slate-800">#TRX-{{ item.id_transaksi }}</td>
                  <td class="px-6 py-3 text-slate-700">{{ formatDate(item.waktu) }}</td>
                  <td class="px-6 py-3 text-slate-700">{{ item.nrp }}</td>
                  <td class="px-6 py-3 font-medium text-slate-800">{{ item.nama_anggota }}</td>
                  <td class="px-6 py-3 text-right font-semibold text-blue-600">{{ formatRupiah(item.total_belanja) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- TAB: KALKULASI SHU -->
      <div v-else class="max-w-4xl mx-auto h-full overflow-auto">
        
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md p-6 text-white mb-6">
          <h2 class="font-bold text-xl mb-1">Kalkulasi Simulasi SHU (Sisa Hasil Usaha)</h2>
          <p class="text-blue-100 text-sm mb-6">Hitung estimasi pembagian SHU kepada anggota berdasarkan persentase partisipasi belanja mereka di koperasi.</p>
          
          <div class="grid grid-cols-2 gap-6 bg-white/10 p-5 rounded-lg border border-white/20 backdrop-blur-sm">
            <div>
              <label class="block text-xs font-semibold text-blue-100 mb-1">Total Laba Bersih Koperasi (Rp)</label>
              <input type="number" v-model="totalLaba" class="w-full bg-white text-slate-800 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 font-bold text-lg">
            </div>
            <div>
              <label class="block text-xs font-semibold text-blue-100 mb-1">Alokasi SHU Anggota (%)</label>
              <div class="flex items-center gap-2">
                <input type="number" v-model="persentaseSHUAnggota" min="0" max="100" class="w-24 bg-white text-slate-800 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 font-bold text-lg">
                <span class="font-bold">% dari Laba Bersih</span>
              </div>
            </div>
          </div>
          
          <div class="mt-4 flex justify-end">
            <button @click="hitungSimulasiSHU" class="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-2 px-6 rounded-md transition-colors shadow-sm">
              Mulai Kalkulasi
            </button>
          </div>
        </div>

        <div v-if="simulasiAnggota.length > 0" class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div class="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
              <h3 class="font-bold text-lg text-slate-800">Hasil Simulasi Pembagian SHU</h3>
              <p class="text-xs text-slate-500">Total Alokasi SHU Anggota: <b>{{ formatRupiah(totalLaba * (persentaseSHUAnggota / 100)) }}</b></p>
            </div>
            <button class="text-sm font-bold text-blue-600 hover:underline flex gap-1 items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Ekspor Laporan (PDF)
            </button>
          </div>
          
          <div class="overflow-auto max-h-[500px]">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th class="px-6 py-4 w-16 text-center">No</th>
                  <th class="px-6 py-4">NRP</th>
                  <th class="px-6 py-4">Nama Anggota</th>
                  <th class="px-6 py-4 text-right">Total Belanja (Partisipasi)</th>
                  <th class="px-6 py-4 text-right">Estimasi SHU Diterima</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(anggota, index) in simulasiAnggota" :key="anggota.nrp" class="border-b border-slate-100 hover:bg-slate-50">
                  <td class="px-6 py-3 text-center text-slate-400 font-bold">{{ index + 1 }}</td>
                  <td class="px-6 py-3 font-medium text-slate-800">{{ anggota.nrp }}</td>
                  <td class="px-6 py-3 font-medium text-slate-800">{{ anggota.nama }}</td>
                  <td class="px-6 py-3 text-right text-slate-700">{{ formatRupiah(anggota.total_belanja) }}</td>
                  <td class="px-6 py-3 text-right font-bold text-green-600 bg-green-50/50">{{ formatRupiah(anggota.estimasi_shu) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  </main>
</template>

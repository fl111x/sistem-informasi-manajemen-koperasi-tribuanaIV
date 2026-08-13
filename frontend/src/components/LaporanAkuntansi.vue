<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../services/api';

const activeTab = ref('Laporan Penjualan'); // 'Laporan Penjualan', 'Laporan Pembelian', 'Laporan SHU Anggota'

// Data Laporan Penjualan
const riwayatBelanja = ref([]);
const searchQuery = ref('');
const bulanFilter = ref(new Date().getMonth() + 1); 
const tahunFilter = ref(new Date().getFullYear());
const isLoadingBelanja = ref(false);

// Data Laporan Pembelian
const laporanPembelian = ref([]);
const isLoadingPembelian = ref(false);

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

// Void Transaksi
const isVoidModalOpen = ref(false);
const transaksiToVoid = ref(null);
const isSubmittingVoid = ref(false);

const bukaModalVoid = (trx) => {
  transaksiToVoid.value = trx;
  isVoidModalOpen.value = true;
};

const tutupModalVoid = () => {
  isVoidModalOpen.value = false;
  transaksiToVoid.value = null;
};

const submitVoid = async () => {
  try {
    isSubmittingVoid.value = true;
    await api.post(`/transaksi/${transaksiToVoid.value.id_transaksi}/void`);
    alert('Transaksi berhasil dibatalkan (Void).');
    tutupModalVoid();
    await fetchLaporanBelanja();
  } catch (error) {
    console.error('Error void transaksi:', error);
    alert(error.response?.data?.message || 'Gagal melakukan void transaksi.');
  } finally {
    isSubmittingVoid.value = false;
  }
};

const fetchLaporanBelanja = async () => {
  try {
    isLoadingBelanja.value = true;
    
    const response = await api.get('/transaksi');
    
    // Map data
    const mappedData = response.data.map(trx => ({
      id_transaksi: trx.id_transaksi,
      nrp: trx.nrp,
      nama_anggota: trx.nama_anggota || 'Bukan Anggota',
      waktu: trx.waktu_transaksi,
      jenis_transaksi: trx.jenis_transaksi,
      total_belanja: parseFloat(trx.total_bayar),
      total_keuntungan: parseFloat(trx.total_keuntungan || 0)
    }));
    
    // Filter berdasarkan bulan dan tahun
    const filteredData = mappedData.filter(trx => {
      const d = new Date(trx.waktu);
      return d.getMonth() + 1 === parseInt(bulanFilter.value) && d.getFullYear() === parseInt(tahunFilter.value);
    });

    riwayatBelanja.value = filteredData;
  } catch (error) {
    console.error('Gagal mengambil laporan transaksi:', error);
  } finally {
    isLoadingBelanja.value = false;
  }
};

const fetchLaporanPembelian = async () => {
  try {
    isLoadingPembelian.value = true;
    const response = await api.get('/pembelian');
    
    // Filter berdasarkan bulan dan tahun
    const filteredData = response.data.filter(po => {
      const d = new Date(po.waktu_pembelian);
      return d.getMonth() + 1 === parseInt(bulanFilter.value) && d.getFullYear() === parseInt(tahunFilter.value);
    });

    laporanPembelian.value = filteredData;
  } catch (error) {
    console.error('Gagal mengambil laporan pembelian:', error);
  } finally {
    isLoadingPembelian.value = false;
  }
};

// Computed Properties for Laporan Penjualan Summary
const totalOmzetSwalayan = computed(() => {
  return riwayatBelanja.value
    .filter(t => t.jenis_transaksi === 'Swalayan')
    .reduce((sum, t) => sum + t.total_belanja, 0);
});

const totalKeuntunganSwalayan = computed(() => {
  return riwayatBelanja.value
    .filter(t => t.jenis_transaksi === 'Swalayan')
    .reduce((sum, t) => sum + t.total_keuntungan, 0);
});

const totalOmzetGrosir = computed(() => {
  return riwayatBelanja.value
    .filter(t => t.jenis_transaksi === 'Grosir')
    .reduce((sum, t) => sum + t.total_belanja, 0);
});

const totalKeuntunganGrosir = computed(() => {
  return riwayatBelanja.value
    .filter(t => t.jenis_transaksi === 'Grosir')
    .reduce((sum, t) => sum + t.total_keuntungan, 0);
});

// Computed Properties for Laporan Pembelian Summary
const totalPembelianSwalayan = computed(() => {
  return laporanPembelian.value
    .filter(t => t.kategori === 'Swalayan')
    .reduce((sum, t) => sum + parseFloat(t.total_biaya || 0), 0);
});

const totalPembelianGrosir = computed(() => {
  return laporanPembelian.value
    .filter(t => t.kategori === 'Grosir')
    .reduce((sum, t) => sum + parseFloat(t.total_biaya || 0), 0);
});

const hitungSimulasiSHU = () => {
  isLoadingSHU.value = true;
  // Simulasi Perhitungan SHU = (Belanja Anggota / Total Belanja Seluruh Anggota) x Alokasi SHU
  
  const alokasiSHU = totalLaba.value * (persentaseSHUAnggota.value / 100);
  
  // Mengelompokkan belanja per NRP
  const rekap = {};
  let totalBelanjaSemua = 0;
  
  riwayatBelanja.value.forEach(trx => {
    if (trx.nrp && trx.total_belanja > 0) {
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

const applyFilter = () => {
  fetchLaporanBelanja();
  fetchLaporanPembelian();
};

onMounted(() => {
  applyFilter();
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
        <p class="text-sm text-slate-500 mt-1">Laporan Penjualan, Pembelian, dan Kalkulasi SHU Anggota.</p>
      </div>
      <div class="flex bg-slate-100 p-1 rounded-lg">
        <button 
          @click="activeTab = 'Laporan Penjualan'" 
          :class="activeTab === 'Laporan Penjualan' ? 'bg-white shadow-sm font-bold text-slate-800' : 'text-slate-500 hover:text-slate-700'"
          class="px-4 py-2 rounded-md text-sm transition-all"
        >
          Laporan Penjualan
        </button>
        <button 
          @click="activeTab = 'Laporan Pembelian'" 
          :class="activeTab === 'Laporan Pembelian' ? 'bg-white shadow-sm font-bold text-slate-800' : 'text-slate-500 hover:text-slate-700'"
          class="px-4 py-2 rounded-md text-sm transition-all"
        >
          Laporan Pembelian
        </button>
        <button 
          @click="activeTab = 'Laporan SHU Anggota'" 
          :class="activeTab === 'Laporan SHU Anggota' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'"
          class="px-4 py-2 rounded-md text-sm transition-all"
        >
          Laporan SHU Anggota
        </button>
      </div>
    </header>

    <div class="flex-1 overflow-auto bg-slate-50 p-8 flex flex-col gap-6">
      
      <!-- Filter Bar Universal -->
      <div class="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex gap-4 items-end flex-shrink-0">
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
        <button @click="applyFilter" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md text-sm h-[38px] transition-colors">
          Terapkan Filter Periode
        </button>
      </div>

      <!-- TAB: LAPORAN PENJUALAN -->
      <div v-if="activeTab === 'Laporan Penjualan'" class="flex-1 flex flex-col gap-6">
        
        <!-- Summary Penjualan -->
        <div class="grid grid-cols-2 gap-6">
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-sm">
            <h3 class="text-blue-100 text-sm font-bold mb-3 uppercase tracking-wider">Sektor Swalayan</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-blue-100 text-xs">Total Omzet</p>
                <p class="text-2xl font-bold">{{ formatRupiah(totalOmzetSwalayan) }}</p>
              </div>
              <div>
                <p class="text-blue-100 text-xs">Total Keuntungan</p>
                <p class="text-2xl font-bold">{{ formatRupiah(totalKeuntunganSwalayan) }}</p>
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-5 text-white shadow-sm">
            <h3 class="text-slate-300 text-sm font-bold mb-3 uppercase tracking-wider">Sektor Grosir</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-slate-300 text-xs">Total Omzet</p>
                <p class="text-2xl font-bold">{{ formatRupiah(totalOmzetGrosir) }}</p>
              </div>
              <div>
                <p class="text-slate-300 text-xs">Total Keuntungan</p>
                <p class="text-2xl font-bold">{{ formatRupiah(totalKeuntunganGrosir) }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
          <div class="overflow-auto flex-1">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-100 text-slate-600 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th class="px-6 py-4">Waktu</th>
                  <th class="px-6 py-4">Sektor</th>
                  <th class="px-6 py-4">Pembeli</th>
                  <th class="px-6 py-4 text-right">Omzet</th>
                  <th class="px-6 py-4 text-right">Keuntungan</th>
                  <th class="px-6 py-4 text-center">Status</th>
                  <th class="px-6 py-4 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoadingBelanja">
                  <td colspan="7" class="px-6 py-12 text-center text-slate-400">Memuat data...</td>
                </tr>
                <tr v-else-if="riwayatBelanja.length === 0">
                  <td colspan="7" class="px-6 py-12 text-center text-slate-400">Belum ada riwayat penjualan pada periode ini.</td>
                </tr>
                <tr v-else v-for="item in riwayatBelanja" :key="item.id_transaksi" class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td class="px-6 py-3 text-slate-700">
                    <div class="font-medium text-slate-800">#TRX-{{ item.id_transaksi }}</div>
                    <div class="text-[11px]">{{ formatDate(item.waktu) }}</div>
                  </td>
                  <td class="px-6 py-3">
                    <span class="px-2 py-1 rounded text-xs font-semibold" :class="item.jenis_transaksi === 'Swalayan' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'">
                      {{ item.jenis_transaksi }}
                    </span>
                  </td>
                  <td class="px-6 py-3">
                    <div class="font-medium text-slate-800">{{ item.nama_anggota }}</div>
                    <div class="text-[11px] text-slate-400" v-if="item.nrp">{{ item.nrp }}</div>
                  </td>
                  <td class="px-6 py-3 text-right font-semibold text-slate-700">
                    <span :class="{'line-through text-slate-400': item.total_belanja === 0}">{{ formatRupiah(item.total_belanja) }}</span>
                  </td>
                  <td class="px-6 py-3 text-right font-bold text-green-600">
                    <span v-if="item.total_belanja > 0">+{{ formatRupiah(item.total_keuntungan) }}</span>
                    <span v-else class="text-slate-400">Rp 0</span>
                  </td>
                  <td class="px-6 py-3 text-center">
                    <span v-if="item.total_belanja === 0" class="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded">Batal</span>
                    <span v-else class="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded">Berhasil</span>
                  </td>
                  <td class="px-6 py-3 text-center">
                    <button v-if="item.total_belanja > 0" @click="bukaModalVoid(item)" class="bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-3 rounded text-xs transition-colors shadow-sm w-full">
                      Void
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- TAB: LAPORAN PEMBELIAN -->
      <div v-if="activeTab === 'Laporan Pembelian'" class="flex-1 flex flex-col gap-6">
        
        <!-- Summary Pembelian -->
        <div class="grid grid-cols-2 gap-6">
          <div class="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white shadow-sm">
            <h3 class="text-emerald-100 text-sm font-bold mb-3 uppercase tracking-wider">Kulakan Swalayan</h3>
            <p class="text-emerald-100 text-xs">Total Pembelian (PO)</p>
            <p class="text-2xl font-bold">{{ formatRupiah(totalPembelianSwalayan) }}</p>
          </div>
          
          <div class="bg-gradient-to-br from-teal-700 to-teal-800 rounded-xl p-5 text-white shadow-sm">
            <h3 class="text-teal-300 text-sm font-bold mb-3 uppercase tracking-wider">Kulakan Grosir</h3>
            <p class="text-teal-300 text-xs">Total Pembelian (PO)</p>
            <p class="text-2xl font-bold">{{ formatRupiah(totalPembelianGrosir) }}</p>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
          <div class="overflow-auto flex-1">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-100 text-slate-600 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th class="px-6 py-4">Waktu</th>
                  <th class="px-6 py-4">No. PO</th>
                  <th class="px-6 py-4">Sektor Kategori</th>
                  <th class="px-6 py-4">Supplier</th>
                  <th class="px-6 py-4">Total Biaya</th>
                  <th class="px-6 py-4">Status & Mutasi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoadingPembelian">
                  <td colspan="6" class="px-6 py-12 text-center text-slate-400">Memuat data...</td>
                </tr>
                <tr v-else-if="laporanPembelian.length === 0">
                  <td colspan="6" class="px-6 py-12 text-center text-slate-400">Belum ada riwayat pembelian pada periode ini.</td>
                </tr>
                <tr v-else v-for="item in laporanPembelian" :key="item.id_pembelian" class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td class="px-6 py-3 text-slate-700">{{ formatDate(item.waktu_pembelian) }}</td>
                  <td class="px-6 py-3 font-bold text-slate-800">PO-{{ item.id_pembelian }}</td>
                  <td class="px-6 py-3 font-medium text-slate-700">{{ item.kategori }}</td>
                  <td class="px-6 py-3">{{ item.nama_supplier }}</td>
                  <td class="px-6 py-3 font-bold text-slate-800">{{ formatRupiah(item.total_biaya) }}</td>
                  <td class="px-6 py-3">
                    <span class="px-2 py-1 rounded text-[10px] font-bold" 
                      :class="{
                        'bg-yellow-100 text-yellow-800': item.status === 'Belum di Order',
                        'bg-blue-100 text-blue-800': item.status === 'Dipesan',
                        'bg-green-100 text-green-800': item.status === 'Diterima',
                        'bg-emerald-100 text-emerald-800': item.status === 'Dimutasi',
                        'bg-red-100 text-red-800': item.status === 'Batal' || item.status === 'Ditunda'
                      }">
                      {{ item.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- TAB: KALKULASI SHU ANGGOTA -->
      <div v-if="activeTab === 'Laporan SHU Anggota'" class="max-w-4xl mx-auto h-full overflow-auto w-full">
        
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md p-6 text-white mb-6">
          <h2 class="font-bold text-xl mb-1">Laporan Alokasi SHU Anggota</h2>
          <p class="text-blue-100 text-sm mb-6">Lacak dan hitung pembagian Sisa Hasil Usaha (SHU) tiap anggota berdasarkan persentase partisipasi belanja mereka di koperasi pada periode ini.</p>
          
          <div class="grid grid-cols-2 gap-6 bg-white/10 p-5 rounded-lg border border-white/20 backdrop-blur-sm">
            <div>
              <label class="block text-xs font-semibold text-blue-100 mb-1">Total Laba Koperasi (Rp)</label>
              <input type="number" v-model="totalLaba" class="w-full bg-white text-slate-800 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 font-bold text-lg">
              <p class="text-[10px] text-blue-200 mt-1">*Masukkan laba bersih dari total keuntungan penjualan</p>
            </div>
            <div>
              <label class="block text-xs font-semibold text-blue-100 mb-1">Persentase SHU Untuk Anggota (%)</label>
              <div class="flex items-center gap-2">
                <input type="number" v-model="persentaseSHUAnggota" min="0" max="100" class="w-24 bg-white text-slate-800 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 font-bold text-lg">
                <span class="font-bold">% dari Laba Bersih</span>
              </div>
            </div>
          </div>
          
          <div class="mt-4 flex justify-end">
            <button @click="hitungSimulasiSHU" class="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-2 px-6 rounded-md transition-colors shadow-sm">
              Hitung / Perbarui Alokasi SHU
            </button>
          </div>
        </div>

        <div v-if="simulasiAnggota.length > 0" class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div class="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
              <h3 class="font-bold text-lg text-slate-800">Daftar Penerima SHU Anggota</h3>
              <p class="text-xs text-slate-500">Total Alokasi SHU Anggota: <b>{{ formatRupiah(totalLaba * (persentaseSHUAnggota / 100)) }}</b></p>
            </div>
            <button class="text-sm font-bold text-blue-600 hover:underline flex gap-1 items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Cetak / Ekspor PDF
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
                  <th class="px-6 py-4 text-right">SHU Diterima</th>
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

    <!-- MODAL VOID TRANSAKSI -->
    <div v-if="isVoidModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white w-full max-w-md rounded-xl shadow-xl flex flex-col overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 bg-red-50 flex justify-between items-center">
          <h3 class="font-bold text-lg text-red-700">Otorisasi Void Transaksi</h3>
          <button @click="tutupModalVoid" class="text-red-400 hover:text-red-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        
        <div class="p-6 flex flex-col gap-4">
          <div class="bg-slate-50 p-3 rounded text-sm text-slate-700 border border-slate-200 mb-2">
            Anda akan membatalkan Transaksi <b>#TRX-{{ transaksiToVoid?.id_transaksi }}</b> senilai <b>{{ formatRupiah(transaksiToVoid?.total_belanja) }}</b>. Stok barang akan dikembalikan dan jurnal akuntansi pembalik akan dicatat. Tindakan ini memerlukan otorisasi Supervisor/Admin.
          </div>
        </div>

        <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 flex-shrink-0">
          <button @click="tutupModalVoid" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-md">Batal</button>
          <button @click="submitVoid" :disabled="isSubmittingVoid" class="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm disabled:opacity-50 flex gap-2 items-center">
            <span v-if="isSubmittingVoid">Memproses...</span>
            <span v-else>Konfirmasi Void</span>
          </button>
        </div>
      </div>
    </div>

  </main>
</template>

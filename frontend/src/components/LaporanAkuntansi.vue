<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../services/api';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'vue-chartjs';
import * as XLSX from 'xlsx';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement
);

const activeTab = ref('Laporan Harian'); // 'Laporan Harian', 'Laporan Bulanan', 'Laporan Tahunan', 'Laporan SHU Anggota'

// Format helper
const formatRupiah = (angka) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// ------------------------------------
// STATE LAPORAN HARIAN
// ------------------------------------
const tanggalFilter = ref(new Date().toISOString().split('T')[0]);
const isLoadingHarian = ref(false);
const harianData = ref({
  ringkasan: { penjualan: {}, pembelian: {} },
  rincian_transaksi: []
});

const fetchLaporanHarian = async () => {
  isLoadingHarian.value = true;
  try {
    const res = await api.get(`/laporan/harian?tanggal=${tanggalFilter.value}`);
    harianData.value = res.data;
  } catch (err) {
    console.error('Error fetching harian:', err);
  } finally {
    isLoadingHarian.value = false;
  }
};

// Void Transaksi (Di Laporan Harian)
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
    await fetchLaporanHarian();
  } catch (error) {
    console.error('Error void transaksi:', error);
    alert(error.response?.data?.message || 'Gagal melakukan void transaksi.');
  } finally {
    isSubmittingVoid.value = false;
  }
};

// Computed Charts - Harian
const doughnutOptions = { responsive: true, maintainAspectRatio: false };
const harianJenisChartData = computed(() => {
  return {
    labels: ['Swalayan', 'Grosir'],
    datasets: [{
      data: [
        parseFloat(harianData.value.ringkasan.penjualan?.total_swalayan || 0),
        parseFloat(harianData.value.ringkasan.penjualan?.total_grosir || 0)
      ],
      backgroundColor: ['#3b82f6', '#10b981'],
    }]
  }
});
const harianMetodeChartData = computed(() => {
  return {
    labels: ['Cash', 'Kredit/Debit'],
    datasets: [{
      data: [
        parseFloat(harianData.value.ringkasan.penjualan?.total_cash || 0),
        parseFloat(harianData.value.ringkasan.penjualan?.total_kredit || 0)
      ],
      backgroundColor: ['#f59e0b', '#8b5cf6'],
    }]
  }
});

// ------------------------------------
// STATE LAPORAN BULANAN
// ------------------------------------
const now = new Date();
const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const startDateBulanan = ref(firstDayOfMonth.toISOString().split('T')[0]);
const endDateBulanan = ref(now.toISOString().split('T')[0]);
const isLoadingBulanan = ref(false);
const bulananData = ref({ penjualan: [], pembelian: [] });

const fetchLaporanBulanan = async () => {
  isLoadingBulanan.value = true;
  try {
    const res = await api.get(`/laporan/bulanan?startDate=${startDateBulanan.value}&endDate=${endDateBulanan.value}`);
    bulananData.value = res.data;
  } catch (err) {
    console.error('Error fetching bulanan:', err);
  } finally {
    isLoadingBulanan.value = false;
  }
};

const setPresetBulanan = (preset) => {
  const end = new Date();
  let start = new Date();
  
  if (preset === 'Bulan Ini') {
    start = new Date(end.getFullYear(), end.getMonth(), 1);
  } else if (preset === '30 Hari') {
    start.setDate(end.getDate() - 30);
  }
  
  startDateBulanan.value = start.toISOString().split('T')[0];
  endDateBulanan.value = end.toISOString().split('T')[0];
  fetchLaporanBulanan();
};

// Combine data for daily rows
const rekapHarianBulanan = computed(() => {
  const rekap = [];
  let current = new Date(startDateBulanan.value);
  const end = new Date(endDateBulanan.value);
  
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const jual = bulananData.value.penjualan.find(p => p.tanggal === dateStr) || {};
    const beli = bulananData.value.pembelian.find(p => p.tanggal === dateStr) || {};
    
    rekap.push({
      tanggal: dateStr,
      omzet: parseFloat(jual.total_omzet || 0),
      cash_in: parseFloat(jual.total_cash || 0),
      kredit_in: parseFloat(jual.total_kredit || 0),
      pengeluaran: parseFloat(beli.total_pengeluaran || 0),
      cash_out: parseFloat(beli.total_beli_cash || 0),
      kredit_out: parseFloat(beli.total_beli_kredit || 0)
    });
    
    current.setDate(current.getDate() + 1);
  }
  return rekap;
});

// Computed Charts - Bulanan
const lineOptions = { responsive: true, maintainAspectRatio: false };
const bulananChartData = computed(() => {
  const labels = rekapHarianBulanan.value.map(item => item.tanggal.split('-')[2]);
  const omzetData = rekapHarianBulanan.value.map(item => item.omzet);
  const pengeluaranData = rekapHarianBulanan.value.map(item => item.pengeluaran);

  return {
    labels,
    datasets: [
      {
        label: 'Omzet Penjualan',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: '#3b82f6',
        tension: 0.3,
        fill: true,
        data: omzetData
      },
      {
        label: 'Pengeluaran Pembelian',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: '#ef4444',
        tension: 0.3,
        fill: true,
        data: pengeluaranData
      }
    ]
  }
});

// ------------------------------------
// STATE LAPORAN TAHUNAN
// ------------------------------------
const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
const startDateTahunan = ref(firstDayOfYear.toISOString().split('T')[0]);
const endDateTahunan = ref(now.toISOString().split('T')[0]);
const isLoadingTahunan = ref(false);
const tahunanData = ref({ penjualan: [], pembelian: [] });

const fetchLaporanTahunan = async () => {
  isLoadingTahunan.value = true;
  try {
    const res = await api.get(`/laporan/tahunan?startDate=${startDateTahunan.value}&endDate=${endDateTahunan.value}`);
    tahunanData.value = res.data;
  } catch (err) {
    console.error('Error fetching tahunan:', err);
  } finally {
    isLoadingTahunan.value = false;
  }
};

const setPresetTahunan = (preset) => {
  const end = new Date();
  let start = new Date();
  
  if (preset === 'Tahun Ini') {
    start = new Date(end.getFullYear(), 0, 1);
  } else if (preset === '365 Hari') {
    start.setDate(end.getDate() - 365);
  }
  
  startDateTahunan.value = start.toISOString().split('T')[0];
  endDateTahunan.value = end.toISOString().split('T')[0];
  fetchLaporanTahunan();
};

const rekapBulananTahunan = computed(() => {
  const rekap = [];
  let current = new Date(startDateTahunan.value);
  const end = new Date(endDateTahunan.value);
  
  current.setDate(1);
  end.setDate(1); 
  
  while (current <= end) {
    const monthStr = current.toISOString().split('T')[0].substring(0, 7);
    const jual = tahunanData.value.penjualan.find(p => p.bulan === monthStr) || {};
    const beli = tahunanData.value.pembelian.find(p => p.bulan === monthStr) || {};
    
    rekap.push({
      bulan_nama: months[current.getMonth()] + ' ' + current.getFullYear(),
      bulan_key: monthStr,
      omzet: parseFloat(jual.total_omzet || 0),
      keuntungan: parseFloat(jual.total_keuntungan || 0),
      pengeluaran: parseFloat(beli.total_pengeluaran || 0)
    });
    
    current.setMonth(current.getMonth() + 1);
  }
  return rekap;
});

// Computed Charts - Tahunan
const barOptions = { responsive: true, maintainAspectRatio: false };
const tahunanChartData = computed(() => {
  const labels = rekapBulananTahunan.value.map(item => item.bulan_nama.substring(0,3));
  const omzetData = rekapBulananTahunan.value.map(item => item.omzet);
  const pengeluaranData = rekapBulananTahunan.value.map(item => item.pengeluaran);

  return {
    labels,
    datasets: [
      {
        label: 'Omzet Penjualan',
        backgroundColor: '#3b82f6',
        data: omzetData
      },
      {
        label: 'Pengeluaran Gudang',
        backgroundColor: '#ef4444',
        data: pengeluaranData
      }
    ]
  }
});

// ------------------------------------
// STATE LAPORAN SHU ANGGOTA
// ------------------------------------
// Parameter SHU (Sesuai Foto Requirement)
const totalSHU = ref(494582400); // Rp. 494.582.400 sesuai gambar
const porsiSimpanan = ref(50); // Persentase
const porsiBelanja = ref(25); // Persentase
const porsiBagiRata = ref(25); // Persentase

const simulasiAnggota = ref([]);
const isLoadingSHU = ref(false);
const dataAnggotaAll = ref([]);
const riwayatBelanjaAll = ref([]);

const totalPembelianSeluruhAnggota = computed(() => {
  return simulasiAnggota.value.reduce((sum, item) => sum + parseFloat(item.belanja || 0), 0);
});

const totalJasaBelanjaSeluruhAnggota = computed(() => {
  return simulasiAnggota.value.reduce((sum, item) => sum + parseFloat(item.shu_belanja || 0), 0);
});

const fetchDataSHU = () => {
  // Langsung panggil hitung dari backend
  hitungSimulasiSHU();
};

const hitungSimulasiSHU = async () => {
  isLoadingSHU.value = true;
  try {
    const res = await api.post('/laporan/shu', {
      total_shu: totalSHU.value,
      porsi_simpanan: porsiSimpanan.value,
      porsi_belanja: porsiBelanja.value,
      porsi_bagi_rata: porsiBagiRata.value
    });
    simulasiAnggota.value = res.data;
  } catch (error) {
    console.error('Error calculating SHU:', error);
    alert('Gagal menghitung SHU dari server.');
  } finally {
    isLoadingSHU.value = false;
  }
};


// ------------------------------------
// EXPORT TO EXCEL
// ------------------------------------
const exportToExcel = (jenis) => {
  if (jenis === 'Bulanan') {
    const ws = XLSX.utils.aoa_to_sheet([
      ['PRIMKOP KARTIKA TRIBUANA IV'],
      ['UNIT SWALAYAN'],
      [],
      ['', '', 'Laporan Harian Unit Swalayan'],
      ['', '', `Periode : ${startDateBulanan.value} s.d ${endDateBulanan.value}`],
      [],
      ['No', 'Tanggal', 'Jual Cash', 'Jual Kredit', 'Beli Cash', 'Beli Kredit', 'Retur Beli']
    ]);

    let rowIndex = 8;
    let totalJualCash = 0;
    let totalJualKredit = 0;
    let totalBeliCash = 0;
    let totalBeliKredit = 0;
    let totalRetur = 0;

    rekapHarianBulanan.value.forEach((item, index) => {
      // Format tanggal ke DD-MM-YYYY
      const parts = item.tanggal.split('-');
      const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;

      XLSX.utils.sheet_add_aoa(ws, [[
        index + 1,
        formattedDate,
        item.cash_in,
        item.kredit_in,
        item.cash_out,
        item.kredit_out,
        0
      ]], { origin: `A${rowIndex}` });
      
      totalJualCash += item.cash_in;
      totalJualKredit += item.kredit_in;
      totalBeliCash += item.cash_out;
      totalBeliKredit += item.kredit_out;
      
      rowIndex++;
    });

    // Jumlah
    XLSX.utils.sheet_add_aoa(ws, [[
      '', 'Jumlah', totalJualCash, totalJualKredit, totalBeliCash, totalBeliKredit, totalRetur
    ]], { origin: `A${rowIndex}` });
    
    rowIndex += 3;
    
    // TTD
    const today = new Date();
    const tglTTD = `Batujajar, ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
    
    XLSX.utils.sheet_add_aoa(ws, [[
      '', 'Mengetahui', '', '', '', tglTTD
    ]], { origin: `A${rowIndex}` });
    
    rowIndex++;
    XLSX.utils.sheet_add_aoa(ws, [[
      '', 'Primer Koperasi Kartika Tribuana IV', '', '', '', 'Urusan Usaha'
    ]], { origin: `A${rowIndex}` });
    
    rowIndex++;
    XLSX.utils.sheet_add_aoa(ws, [[
      '', 'Ketua'
    ]], { origin: `A${rowIndex}` });
    
    rowIndex += 4;
    XLSX.utils.sheet_add_aoa(ws, [[
      '', '___________________________', '', '', '', '___________________________'
    ]], { origin: `A${rowIndex}` });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan_Harian');
    XLSX.writeFile(wb, `Laporan_Harian_Swalayan_${startDateBulanan.value}_sd_${endDateBulanan.value}.xlsx`);
  } else {
    alert(`Fungsi "Export to Excel" untuk Laporan ${jenis} sedang dalam tahap pengembangan.`);
  }
};


// INIT
onMounted(() => {
  fetchLaporanHarian();
  fetchLaporanBulanan();
  fetchLaporanTahunan();
  fetchDataSHU();
});

</script>

<template>
  <main class="flex-1 flex flex-col h-full overflow-hidden bg-white w-full">
    
    <!-- Header -->
    <header class="px-8 py-6 border-b border-slate-200 flex justify-between items-center flex-shrink-0 bg-white">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Akuntansi & Laporan</h1>
        <p class="text-sm text-slate-500 mt-1">Laporan Lengkap Penjualan, Pembelian, Rekapitulasi dan Kalkulasi SHU Anggota.</p>
      </div>
      <div class="flex bg-slate-100 p-1 rounded-lg">
        <button 
          @click="activeTab = 'Laporan Harian'" 
          :class="activeTab === 'Laporan Harian' ? 'bg-white shadow-sm font-bold text-slate-800' : 'text-slate-500 hover:text-slate-700'"
          class="px-4 py-2 rounded-md text-sm transition-all"
        >
          Harian
        </button>
        <button 
          @click="activeTab = 'Laporan Bulanan'" 
          :class="activeTab === 'Laporan Bulanan' ? 'bg-white shadow-sm font-bold text-slate-800' : 'text-slate-500 hover:text-slate-700'"
          class="px-4 py-2 rounded-md text-sm transition-all"
        >
          Bulanan
        </button>
        <button 
          @click="activeTab = 'Laporan Tahunan'" 
          :class="activeTab === 'Laporan Tahunan' ? 'bg-white shadow-sm font-bold text-slate-800' : 'text-slate-500 hover:text-slate-700'"
          class="px-4 py-2 rounded-md text-sm transition-all"
        >
          Tahunan
        </button>
        <button 
          @click="activeTab = 'Laporan SHU Anggota'" 
          :class="activeTab === 'Laporan SHU Anggota' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'"
          class="px-4 py-2 rounded-md text-sm transition-all ml-1"
        >
          Kalkulasi SHU
        </button>
      </div>
    </header>

    <div class="flex-1 overflow-auto bg-slate-50 p-8 flex flex-col gap-6">
      
      <!-- ==============================================
           TAB: LAPORAN HARIAN
           ============================================== -->
      <div v-if="activeTab === 'Laporan Harian'" class="flex-1 flex flex-col gap-6">
        <!-- Filter Bar -->
        <div class="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-end flex-shrink-0">
          <div class="flex gap-4 items-end">
            <div class="w-48">
              <label class="block text-xs font-semibold text-slate-600 mb-1">Pilih Tanggal</label>
              <input type="date" v-model="tanggalFilter" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 text-sm">
            </div>
            <button @click="fetchLaporanHarian" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md text-sm h-[38px] transition-colors">
              Lihat Laporan Harian
            </button>
          </div>
          <button @click="exportToExcel('Harian')" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md text-sm h-[38px] transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export to Excel
          </button>
        </div>
        
        <!-- Summary Penjualan Harian -->
        <div class="grid grid-cols-2 gap-6">
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-sm flex flex-col gap-3">
            <h3 class="text-blue-100 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              Penjualan (Pemasukan)
            </h3>
            <div class="flex justify-between items-end border-b border-blue-400/50 pb-3">
              <span class="text-blue-100 text-sm">Total Omzet Hari Ini</span>
              <span class="text-3xl font-bold">{{ formatRupiah(harianData.ringkasan.penjualan?.total_omzet) }}</span>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-blue-200 text-[11px] uppercase">Tunai (Fisik Laci Kasir)</p>
                <p class="text-lg font-bold">{{ formatRupiah(harianData.ringkasan.penjualan?.total_cash) }}</p>
              </div>
              <div>
                <p class="text-blue-200 text-[11px] uppercase">Debit / Kredit / Qris</p>
                <p class="text-lg font-bold">{{ formatRupiah(harianData.ringkasan.penjualan?.total_kredit) }}</p>
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-5 text-white shadow-sm flex flex-col gap-3">
            <h3 class="text-slate-300 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Pembelian (Pengeluaran)
            </h3>
            <div class="flex justify-between items-end border-b border-slate-600/50 pb-3">
              <span class="text-slate-300 text-sm">Total Pengeluaran Hari Ini</span>
              <span class="text-3xl font-bold">{{ formatRupiah(harianData.ringkasan.pembelian?.total_pengeluaran) }}</span>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-slate-400 text-[11px] uppercase">Pembelian Tunai</p>
                <p class="text-lg font-bold">{{ formatRupiah(harianData.ringkasan.pembelian?.total_beli_cash) }}</p>
              </div>
              <div>
                <p class="text-slate-400 text-[11px] uppercase">Hutang / Tempo</p>
                <p class="text-lg font-bold">{{ formatRupiah(harianData.ringkasan.pembelian?.total_beli_kredit) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Grafik Penjualan Harian -->
        <div class="grid grid-cols-2 gap-6">
          <div class="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex flex-col items-center justify-center">
            <h3 class="font-bold text-slate-700 mb-4 text-center">Proporsi Sektor Penjualan</h3>
            <div class="w-56 h-56 relative flex items-center justify-center">
              <Doughnut v-if="harianData.rincian_transaksi?.length > 0" :data="harianJenisChartData" :options="doughnutOptions" />
              <div v-else class="text-slate-400 text-sm italic">Belum ada data</div>
            </div>
          </div>
          <div class="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex flex-col items-center justify-center">
            <h3 class="font-bold text-slate-700 mb-4 text-center">Proporsi Metode Pembayaran</h3>
            <div class="w-56 h-56 relative flex items-center justify-center">
              <Doughnut v-if="harianData.rincian_transaksi?.length > 0" :data="harianMetodeChartData" :options="doughnutOptions" />
              <div v-else class="text-slate-400 text-sm italic">Belum ada data</div>
            </div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
          <div class="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 class="font-bold text-slate-700">Rincian Transaksi Penjualan</h3>
            <span class="text-xs text-slate-500">{{ harianData.rincian_transaksi?.length }} transaksi tercatat</span>
          </div>
          <div class="overflow-auto flex-1">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-100 text-slate-600 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th class="px-6 py-4">Waktu</th>
                  <th class="px-6 py-4">Sektor & Metode</th>
                  <th class="px-6 py-4">Pembeli & Kasir</th>
                  <th class="px-6 py-4 text-right">Nilai Transaksi</th>
                  <th class="px-6 py-4 text-center">Status</th>
                  <th class="px-6 py-4 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoadingHarian">
                  <td colspan="6" class="px-6 py-12 text-center text-slate-400">Memuat data...</td>
                </tr>
                <tr v-else-if="harianData.rincian_transaksi.length === 0">
                  <td colspan="6" class="px-6 py-12 text-center text-slate-400">Belum ada transaksi hari ini.</td>
                </tr>
                <tr v-else v-for="item in harianData.rincian_transaksi" :key="item.id_transaksi" class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td class="px-6 py-3 text-slate-700">
                    <div class="font-bold text-slate-800">#TRX-{{ item.id_transaksi }}</div>
                    <div class="text-[11px]">{{ formatDate(item.waktu_transaksi) }}</div>
                  </td>
                  <td class="px-6 py-3">
                    <div class="font-semibold text-slate-700">{{ item.jenis_transaksi }}</div>
                    <div class="text-[11px] text-slate-500">Metode: <b class="text-blue-600">{{ item.metode_pembayaran || 'Cash' }}</b></div>
                  </td>
                  <td class="px-6 py-3">
                    <div class="font-medium text-slate-800">{{ item.nama_anggota || 'Non-Anggota' }}</div>
                    <div class="text-[11px] text-slate-400">Kasir: {{ item.nama_kasir }}</div>
                  </td>
                  <td class="px-6 py-3 text-right font-bold text-slate-700">
                    <span :class="{'line-through text-slate-400': parseFloat(item.total_bayar) === 0}">{{ formatRupiah(item.total_bayar) }}</span>
                  </td>
                  <td class="px-6 py-3 text-center">
                    <span v-if="parseFloat(item.total_bayar) === 0" class="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded">Void</span>
                    <span v-else class="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded">Berhasil</span>
                  </td>
                  <td class="px-6 py-3 text-center">
                    <button v-if="parseFloat(item.total_bayar) > 0" @click="bukaModalVoid(item)" class="bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-3 rounded text-xs transition-colors shadow-sm w-full">
                      Void
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ==============================================
           TAB: LAPORAN BULANAN
           ============================================== -->
      <div v-if="activeTab === 'Laporan Bulanan'" class="flex-1 flex flex-col gap-6">
        <div class="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-end flex-shrink-0">
          <div class="flex gap-4 items-end flex-wrap">
            <div class="w-40">
              <label class="block text-xs font-semibold text-slate-600 mb-1">Dari Tanggal</label>
              <input type="date" v-model="startDateBulanan" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 text-sm">
            </div>
            <div class="w-40">
              <label class="block text-xs font-semibold text-slate-600 mb-1">Sampai Tanggal</label>
              <input type="date" v-model="endDateBulanan" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 text-sm">
            </div>
            <button @click="fetchLaporanBulanan" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md text-sm h-[38px] transition-colors">
              Terapkan
            </button>
            <div class="flex gap-2 ml-2 h-[38px] items-center">
              <button @click="setPresetBulanan('Bulan Ini')" class="border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold py-1.5 px-3 rounded-md text-xs transition-colors bg-white">
                Bulan Ini
              </button>
              <button @click="setPresetBulanan('30 Hari')" class="border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold py-1.5 px-3 rounded-md text-xs transition-colors bg-white">
                30 Hari Terakhir
              </button>
            </div>
          </div>
          <button @click="exportToExcel('Bulanan')" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md text-sm h-[38px] transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export to Excel
          </button>
        </div>

        <!-- Grafik Tren Bulanan -->
        <div class="bg-white border border-slate-200 rounded-lg shadow-sm p-4 h-72 flex flex-col">
          <h3 class="font-bold text-slate-700 mb-2">Tren Omzet dan Pengeluaran Harian</h3>
          <div class="flex-1 min-h-0 relative">
            <Line v-if="rekapHarianBulanan?.length > 0" :data="bulananChartData" :options="lineOptions" />
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
          <div class="p-4 border-b border-slate-200 bg-slate-50">
            <h3 class="font-bold text-slate-700">Rekapitulasi Harian</h3>
          </div>
          <div class="overflow-auto flex-1">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-100 text-slate-600 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th class="px-6 py-4 border-r border-slate-200" rowspan="2">Tanggal</th>
                  <th class="px-6 py-2 border-b border-r border-slate-200 text-center" colspan="3">Pemasukan (Penjualan)</th>
                  <th class="px-6 py-2 border-b border-slate-200 text-center" colspan="3">Pengeluaran (Pembelian Gudang)</th>
                </tr>
                <tr>
                  <th class="px-4 py-2 border-r border-slate-200 text-right">Omzet Total</th>
                  <th class="px-4 py-2 border-r border-slate-200 text-right">Cash</th>
                  <th class="px-4 py-2 border-r border-slate-200 text-right">Kredit</th>
                  
                  <th class="px-4 py-2 border-r border-slate-200 text-right">Total Keluar</th>
                  <th class="px-4 py-2 border-r border-slate-200 text-right">Tunai</th>
                  <th class="px-4 py-2 text-right">Hutang / Tempo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoadingBulanan">
                  <td colspan="7" class="px-6 py-12 text-center text-slate-400">Memuat data...</td>
                </tr>
                <tr v-else v-for="item in rekapHarianBulanan" :key="item.tanggal" class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td class="px-6 py-3 font-semibold text-slate-800 border-r border-slate-100">{{ item.tanggal }}</td>
                  <td class="px-4 py-3 text-right font-bold text-blue-600 border-r border-slate-100">{{ formatRupiah(item.omzet) }}</td>
                  <td class="px-4 py-3 text-right text-slate-600 border-r border-slate-100">{{ formatRupiah(item.cash_in) }}</td>
                  <td class="px-4 py-3 text-right text-slate-600 border-r border-slate-100">{{ formatRupiah(item.kredit_in) }}</td>
                  <td class="px-4 py-3 text-right font-bold text-red-600 border-r border-slate-100">{{ formatRupiah(item.pengeluaran) }}</td>
                  <td class="px-4 py-3 text-right text-slate-600 border-r border-slate-100">{{ formatRupiah(item.cash_out) }}</td>
                  <td class="px-4 py-3 text-right text-slate-600">{{ formatRupiah(item.kredit_out) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>


      <!-- ==============================================
           TAB: LAPORAN TAHUNAN
           ============================================== -->
      <div v-if="activeTab === 'Laporan Tahunan'" class="flex-1 flex flex-col gap-6">
        <div class="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-end flex-shrink-0">
          <div class="flex gap-4 items-end flex-wrap">
            <div class="w-40">
              <label class="block text-xs font-semibold text-slate-600 mb-1">Dari Tanggal</label>
              <input type="date" v-model="startDateTahunan" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 text-sm">
            </div>
            <div class="w-40">
              <label class="block text-xs font-semibold text-slate-600 mb-1">Sampai Tanggal</label>
              <input type="date" v-model="endDateTahunan" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 text-sm">
            </div>
            <button @click="fetchLaporanTahunan" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md text-sm h-[38px] transition-colors">
              Terapkan
            </button>
            <div class="flex gap-2 ml-2 h-[38px] items-center">
              <button @click="setPresetTahunan('Tahun Ini')" class="border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold py-1.5 px-3 rounded-md text-xs transition-colors bg-white">
                Tahun Ini
              </button>
              <button @click="setPresetTahunan('365 Hari')" class="border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold py-1.5 px-3 rounded-md text-xs transition-colors bg-white">
                365 Hari Terakhir
              </button>
            </div>
          </div>
          <button @click="exportToExcel('Tahunan')" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md text-sm h-[38px] transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export to Excel
          </button>
        </div>

        <!-- Grafik Tren Tahunan -->
        <div class="bg-white border border-slate-200 rounded-lg shadow-sm p-4 h-72 flex flex-col">
          <h3 class="font-bold text-slate-700 mb-2">Performa Omzet dan Pengeluaran per Bulan</h3>
          <div class="flex-1 min-h-0 relative">
            <Bar v-if="rekapBulananTahunan?.length > 0" :data="tahunanChartData" :options="barOptions" />
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
          <div class="p-4 border-b border-slate-200 bg-slate-50">
            <h3 class="font-bold text-slate-700">Rekapitulasi Bulanan</h3>
          </div>
          <div class="overflow-auto flex-1">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-100 text-slate-600 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th class="px-6 py-4">Bulan</th>
                  <th class="px-6 py-4 text-right">Total Omzet Penjualan</th>
                  <th class="px-6 py-4 text-right text-red-700 bg-red-50">Total Pengeluaran Gudang</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoadingTahunan">
                  <td colspan="4" class="px-6 py-12 text-center text-slate-400">Memuat data...</td>
                </tr>
                <tr v-else v-for="(item, idx) in rekapBulananTahunan" :key="idx" class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td class="px-6 py-4 font-semibold text-slate-800">{{ item.bulan_nama }}</td>
                  <td class="px-6 py-4 text-right font-bold text-blue-600">{{ formatRupiah(item.omzet) }}</td>
                  <td class="px-6 py-4 text-right font-bold text-red-500 bg-red-50/30">{{ formatRupiah(item.pengeluaran) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ==============================================
           TAB: KALKULASI SHU ANGGOTA
           ============================================== -->
      <div v-if="activeTab === 'Laporan SHU Anggota'" class="max-w-4xl mx-auto h-full overflow-auto w-full">
        


        <div v-if="simulasiAnggota.length > 0" class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div class="p-6 border-b border-slate-100 bg-slate-50 flex flex-col gap-4">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="font-bold text-lg text-slate-800">Daftar Penerima SHU Anggota</h3>
                <p class="text-xs text-slate-500">Menampilkan rincian Jumlah Pembelian, Jasa Belanja, dan Kalkulasi SHU per anggota.</p>
              </div>
              <button @click="exportToExcel('SHU')" class="bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-4 rounded text-xs transition-colors flex items-center gap-2 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Export to Excel
              </button>
            </div>
            
            <!-- Ringkasan Informasi -->
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
              <div class="bg-blue-50 border border-blue-100 p-4 rounded-lg shadow-sm">
                <p class="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Total Pembelian Seluruh Anggota</p>
                <p class="text-xl font-black text-blue-800">{{ formatRupiah(totalPembelianSeluruhAnggota) }}</p>
              </div>
              <div class="bg-indigo-50 border border-indigo-100 p-4 rounded-lg shadow-sm">
                <p class="text-xs text-indigo-600 font-bold uppercase tracking-wider mb-1">Total Jasa Belanja (Alokasi)</p>
                <p class="text-xl font-black text-indigo-800">{{ formatRupiah(totalJasaBelanjaSeluruhAnggota) }}</p>
              </div>
              <div class="bg-green-50 border border-green-100 p-4 rounded-lg shadow-sm">
                <p class="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">Jumlah Anggota</p>
                <p class="text-xl font-black text-green-800">{{ simulasiAnggota.length }} <span class="text-sm font-medium">Orang</span></p>
              </div>
            </div>
          </div>
          
          <div class="overflow-auto max-h-[500px]">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th class="px-4 py-3 w-12 text-center">No</th>
                  <th class="px-4 py-3">Nama Anggota</th>
                  <th class="px-4 py-3">Pangkat</th>
                  <th class="px-4 py-3 text-right">Data Simpanan</th>
                  <th class="px-4 py-3 text-right border-r border-slate-200">Data Belanja</th>
                  <th class="px-4 py-3 text-right bg-blue-50/50">Jasa Simpanan</th>
                  <th class="px-4 py-3 text-right bg-blue-50/50">Jasa Belanjaan</th>
                  <th class="px-4 py-3 text-right bg-blue-50/50 border-r border-slate-200">Jasa Bagi Rata</th>
                  <th class="px-4 py-3 text-right bg-green-50 text-green-700">Total SHU (Jumlah Jasa)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(anggota, index) in simulasiAnggota" :key="anggota.nrp" class="border-b border-slate-100 hover:bg-slate-50">
                  <td class="px-4 py-3 text-center text-slate-400 font-bold">{{ index + 1 }}</td>
                  <td class="px-4 py-3 font-medium text-slate-800">
                    <div>{{ anggota.nama }}</div>
                    <div class="text-[10px] text-slate-400">NRP: {{ anggota.nrp }}</div>
                  </td>
                  <td class="px-4 py-3 font-medium text-slate-600 text-xs">{{ anggota.pangkat }}</td>
                  <td class="px-4 py-3 text-right text-slate-500 text-xs">{{ formatRupiah(anggota.simpanan) }}</td>
                  <td class="px-4 py-3 text-right text-slate-500 text-xs border-r border-slate-100">{{ formatRupiah(anggota.belanja) }}</td>
                  
                  <td class="px-4 py-3 text-right font-semibold text-blue-600">{{ formatRupiah(anggota.shu_simpanan) }}</td>
                  <td class="px-4 py-3 text-right font-semibold text-blue-600">{{ formatRupiah(anggota.shu_belanja) }}</td>
                  <td class="px-4 py-3 text-right font-semibold text-blue-600 border-r border-slate-100">{{ formatRupiah(anggota.shu_bagirata) }}</td>
                  
                  <td class="px-4 py-3 text-right font-bold text-green-700 bg-green-50/30 text-[15px]">{{ formatRupiah(anggota.total_diterima) }}</td>
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
          <h3 class="font-bold text-lg text-red-700">Konfirmasi Void Transaksi</h3>
          <button @click="tutupModalVoid" class="text-red-400 hover:text-red-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        
        <div class="p-6 flex flex-col gap-4">
          <div class="bg-slate-50 p-3 rounded text-sm text-slate-700 border border-slate-200 mb-2">
            Anda akan membatalkan Transaksi <b>#TRX-{{ transaksiToVoid?.id_transaksi }}</b> senilai <b>{{ formatRupiah(transaksiToVoid?.total_bayar) }}</b>. Stok barang akan dikembalikan dan jurnal akuntansi pembalik akan dicatat. Tindakan ini memerlukan otorisasi Supervisor/Admin.
          </div>
        </div>

        <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 flex-shrink-0">
          <button @click="tutupModalVoid" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-md">Batal</button>
          <button @click="submitVoid" :disabled="isSubmittingVoid" class="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm disabled:opacity-50 flex gap-2 items-center">
            <span v-if="isSubmittingVoid">Memproses...</span>
            <span v-else>Void Sekarang</span>
          </button>
        </div>
      </div>
    </div>

  </main>
</template>

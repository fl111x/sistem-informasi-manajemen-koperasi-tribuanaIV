<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';
import * as XLSX from 'xlsx';

const searchQuery = ref('');
const activeTab = ref('Semua');
const daftarAnggota = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');

const formatRupiah = (angka) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
};

// Pagination State
const currentPage = ref(1);
const totalPages = ref(1);
const totalItems = ref(0);
const limit = 30;

// Modal State
const isModalOpen = ref(false);
const modalMode = ref('tambah'); 
const idSedangDiedit = ref(null);

const formAnggota = ref({
  nrp: '',
  nama: '',
  pangkat: '',
  jenis_anggota: 'Militer',
  saldo_voucher: 0
});

// Notifikasi
const isNotifModalOpen = ref(false);
const notifTitle = ref('Pemberitahuan');
const notifMessage = ref('');

const tampilkanNotif = (title, message) => {
  notifTitle.value = title;
  notifMessage.value = message;
  isNotifModalOpen.value = true;
};
const tutupNotif = () => isNotifModalOpen.value = false;

// Delete Modal State
const isDeleteModalOpen = ref(false);
const itemToDelete = ref(null);

// Fitur Ekspor Excel All
const isExporting = ref(false);
const exportExcelAll = async () => {
  try {
    isExporting.value = true;
    const response = await api.get('/anggota/rekap-voucher');
    const rawData = response.data.data || [];

    if (rawData.length === 0) {
      return tampilkanNotif('Peringatan', 'Tidak ada data anggota untuk diekspor.');
    }

    // 5 Kolom Sesuai Spesifikasi: No | Nama | Pangkat | NRP | Saldo Voucher
    const excelRows = rawData.map((item, idx) => ({
      'No': idx + 1,
      'Nama': item.nama,
      'Pangkat': item.pangkat || '-',
      'NRP': item.nrp,
      'Saldo Voucher': formatRupiah(item.sisa_saldo)
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);

    // Atur Lebar Kolom Excel (Bersih, tanpa merge cell)
    worksheet['!cols'] = [
      { wch: 6 },  // No
      { wch: 30 }, // Nama
      { wch: 20 }, // Pangkat
      { wch: 20 }, // NRP
      { wch: 22 }  // Saldo Voucher
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Anggota');

    const filename = `Data_Anggota_Koperasi_TribuanaIV_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);

    tampilkanNotif('Berhasil', 'Data seluruh anggota berhasil diekspor ke Excel.');
  } catch (error) {
    console.error('Error exporting Excel:', error);
    tampilkanNotif('Gagal', 'Terjadi kesalahan saat mengekspor data ke Excel.');
  } finally {
    isExporting.value = false;
  }
};

// Fitur Cetak Detail Anggota Individu (Laporan Resmi / PDF)
const isPrintModalOpen = ref(false);
const printData = ref(null);
const isLoadingPrint = ref(false);

const daftarJatahBulan = computed(() => {
  if (!printData.value || !printData.value.summary) return [];
  const blnTerdaftar = printData.value.summary.bln_terdaftar || 1;
  const totalTerpakai = printData.value.summary.total_terpakai || 0;
  const bulanTerpakaiCount = Math.floor(totalTerpakai / 100000);

  const createdAt = printData.value.anggota?.created_at ? new Date(printData.value.anggota.created_at) : new Date(2026, 0, 1);
  const startYear = isNaN(createdAt.getFullYear()) ? 2026 : createdAt.getFullYear();
  const startMonth = isNaN(createdAt.getMonth()) ? 0 : createdAt.getMonth();

  const list = [];
  for (let i = 0; i < blnTerdaftar; i++) {
    const d = new Date(startYear, startMonth + i, 1);
    const namaBulan = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const formattedNamaBulan = namaBulan.charAt(0).toUpperCase() + namaBulan.slice(1);

    list.push({
      bulan: i + 1,
      label: formattedNamaBulan,
      status: (i + 1) <= bulanTerpakaiCount ? 'Terpakai' : 'Belum Terpakai'
    });
  }
  return list;
});

const bukaModalCetakDetail = async (item) => {
  try {
    isLoadingPrint.value = true;
    const response = await api.get(`/anggota/${item.nrp}/detail-cetak`);
    printData.value = response.data;
    isPrintModalOpen.value = true;
  } catch (error) {
    console.error('Error fetching detail cetak anggota:', error);
    tampilkanNotif('Gagal', 'Gagal memuat detail laporan anggota.');
  } finally {
    isLoadingPrint.value = false;
  }
};

const tutupPrintModal = () => {
  isPrintModalOpen.value = false;
  printData.value = null;
};

const cetakLaporanResmi = () => {
  window.print();
};

const isDistributing = ref(false);
const isDistribusiModalOpen = ref(false);

const bukaModalDistribusi = () => {
  isDistribusiModalOpen.value = true;
};

const tutupModalDistribusi = () => {
  isDistribusiModalOpen.value = false;
};

const eksekusiDistribusiVoucher = async () => {
  try {
    isDistributing.value = true;
    const response = await api.post('/voucher/distribusi');
    tutupModalDistribusi();
    tampilkanNotif('Berhasil', response.data?.message || 'Voucher bulanan (Rp 100.000) berhasil dibagikan dan diakumulasikan ke seluruh anggota aktif.');
    await fetchAnggota();
  } catch (error) {
    tampilkanNotif('Gagal', error.response?.data?.message || 'Gagal mendistribusi voucher.');
  } finally {
    isDistributing.value = false;
  }
};

const fetchAnggota = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    
    const params = new URLSearchParams({
      page: currentPage.value,
      limit: limit,
      search: searchQuery.value,
      jenis_anggota: activeTab.value
    });

    const response = await api.get(`/anggota?${params.toString()}`);
    if (response.data.pagination) {
      daftarAnggota.value = response.data.data || [];
      totalPages.value = response.data.pagination.totalPages;
      totalItems.value = response.data.pagination.totalItems;
    } else {
      daftarAnggota.value = response.data.data || [];
    }
  } catch (error) {
    console.error('Error fetching anggota:', error);
    // Silent fail if endpoint doesn't exist yet, just mock for now
    if (error.response?.status === 404) {
      daftarAnggota.value = [
        { id_anggota: 1, nrp: '123456789', nama: 'Sertu Budi', pangkat: 'Sertu', jenis_anggota: 'Militer', saldo_voucher: 0, simpanan: 0 },
        { id_anggota: 2, nrp: '198701012010121001', nama: 'Agus Santoso', pangkat: 'III/b', jenis_anggota: 'PNS', saldo_voucher: 0, simpanan: 0 }
      ];
    } else {
      errorMessage.value = 'Gagal memuat data anggota.';
    }
  } finally {
    isLoading.value = false;
  }
};


const applyFilter = () => {
  currentPage.value = 1;
  fetchAnggota();
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchAnggota();
  }
};

onMounted(() => {
  fetchAnggota();
});

const dataDitampilkan = computed(() => daftarAnggota.value);

const bukaModalTambah = () => {
  modalMode.value = 'tambah';
  idSedangDiedit.value = null;
  formAnggota.value = { nrp: '', nama: '', pangkat: '', jenis_anggota: 'Militer', saldo_voucher: 0 };
  isModalOpen.value = true;
};

const bukaModalEdit = (item) => {
  modalMode.value = 'edit';
  idSedangDiedit.value = item.nrp;
  formAnggota.value = { ...item };
  isModalOpen.value = true;
};

const tutupModal = () => isModalOpen.value = false;

const simpanAnggota = async () => {
  if (!formAnggota.value.nrp || !formAnggota.value.nama || !formAnggota.value.pangkat) {
    tampilkanNotif('Gagal', 'NRP, Nama, dan Pangkat wajib diisi.');
    return;
  }

  try {
    const dataToSend = { ...formAnggota.value };

    if (modalMode.value === 'tambah') {
      await api.post('/anggota', dataToSend);
      tampilkanNotif('Berhasil', 'Anggota baru ditambahkan.');
    } else {
      await api.put(`/anggota/${idSedangDiedit.value}`, dataToSend);
      tampilkanNotif('Berhasil', 'Data anggota diperbarui.');
    }
    await fetchAnggota();
    tutupModal();
  } catch (error) {
    tampilkanNotif('Gagal', error.response?.data?.message || 'Gagal menyimpan data anggota.');
  }
};

const bukaModalHapus = (item) => {
  itemToDelete.value = item;
  isDeleteModalOpen.value = true;
};
const tutupModalHapus = () => isDeleteModalOpen.value = false;

const konfirmasiHapus = async () => {
  try {
    await api.delete(`/anggota/${itemToDelete.value.nrp}`);
    await fetchAnggota();
    tutupModalHapus();
    tampilkanNotif('Berhasil', 'Anggota dihapus.');
  } catch (error) {
    tampilkanNotif('Gagal', error.response?.data?.message || 'Gagal menghapus anggota.');
  }
};
</script>

<template>
  <main class="flex-1 flex flex-col h-full overflow-hidden bg-white w-full">
    
    <!-- Header -->
    <header class="px-8 py-6 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Kelola Anggota</h1>
        <p class="text-sm text-slate-500 mt-1">Data nominatif anggota koperasi dan saldo voucher.</p>
      </div>
      <div class="flex gap-2">
        <button @click="exportExcelAll" :disabled="isExporting" class="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <span v-if="isExporting">Mengunduh...</span>
          <span v-else>Ekspor Excel</span>
        </button>
        <button @click="bukaModalDistribusi" :disabled="isDistributing" class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span v-if="isDistributing">Memproses...</span>
          <span v-else>Distribusi Voucher</span>
        </button>
        <button @click="bukaModalTambah" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          Tambah Anggota
        </button>
      </div>

    </header>

    <!-- Toolbar & Tabs -->
    <div class="px-8 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 bg-slate-50 flex-shrink-0 justify-between items-start sm:items-center">
      <div class="flex gap-1 bg-slate-200/50 p-1 rounded-lg">
        <button @click="activeTab = 'Semua'; applyFilter()" :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-colors', activeTab === 'Semua' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700']">Semua</button>
        <button @click="activeTab = 'Militer'; applyFilter()" :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-colors', activeTab === 'Militer' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700']">Militer</button>
        <button @click="activeTab = 'PNS'; applyFilter()" :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-colors', activeTab === 'PNS' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700']">PNS</button>
        <button @click="activeTab = 'PPPK'; applyFilter()" :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-colors', activeTab === 'PPPK' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700']">PPPK</button>
      </div>
      <div class="relative w-full sm:w-72">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input type="text" v-model="searchQuery" @keyup.enter="applyFilter" placeholder="Cari nama atau NRP... (Enter)" class="w-full border border-slate-300 pl-10 pr-4 py-2 rounded-md text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white shadow-sm transition-all">
      </div>
    </div>

    <!-- Table -->
    <div class="flex-1 overflow-auto p-8 pt-4">
      <div class="border border-slate-200 rounded-lg shadow-sm overflow-hidden bg-white">
        <table class="w-full text-left text-sm text-slate-600">
          <thead class="bg-slate-100 text-slate-600 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th class="px-5 py-4 w-1/4">Nama Lengkap</th>
              <th class="px-5 py-4">Pangkat / Jenis</th>
              <th class="px-5 py-4 w-1/4">NRP</th>
              <th class="px-5 py-4 text-right">Saldo Voucher</th>
              <th class="px-5 py-4 w-32 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="5" class="px-5 py-12 text-center text-slate-400">Memuat data...</td>
            </tr>
            <tr v-else-if="errorMessage">
              <td colspan="5" class="px-5 py-12 text-center text-red-500">{{ errorMessage }}</td>
            </tr>
            <tr v-else-if="dataDitampilkan.length === 0">
              <td colspan="5" class="px-5 py-12 text-center text-slate-400">Data anggota tidak ditemukan.</td>
            </tr>
            <tr v-else v-for="item in dataDitampilkan" :key="item.id_anggota" class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td class="px-5 py-3 font-medium text-slate-800">{{ item.nama }}</td>
              <td class="px-5 py-3 text-slate-700">
                <div class="font-medium">{{ item.pangkat }}</div>
                <span v-if="item.jenis_anggota === 'PNS'" class="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-emerald-100 text-emerald-700 mt-1 inline-block">PNS</span>
                <span v-else-if="item.jenis_anggota === 'PPPK'" class="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-purple-100 text-purple-700 mt-1 inline-block">PPPK</span>
                <span v-else class="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-blue-100 text-blue-700 mt-1 inline-block">Militer</span>
              </td>
              <td class="px-5 py-3 text-slate-800 font-medium">{{ item.nrp }}</td>
              <td class="px-5 py-3 text-right font-bold text-indigo-600">{{ formatRupiah(item.saldo_voucher) }}</td>
              <td class="px-5 py-3 text-center">
                <div class="flex justify-center gap-1.5">
                  <button @click="bukaModalCetakDetail(item)" class="text-slate-400 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 p-1.5 rounded transition-colors" title="Cetak Laporan Detail">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  </button>
                  <button @click="bukaModalEdit(item)" class="text-slate-400 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 p-1.5 rounded transition-colors" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button @click="bukaModalHapus(item)" class="text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 p-1.5 rounded transition-colors" title="Hapus">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div class="text-xs text-slate-500">
          Menampilkan <span class="font-bold text-slate-700">{{ dataDitampilkan.length }}</span> dari <span class="font-bold text-slate-700">{{ totalItems }}</span> anggota secara total.
        </div>
        <div class="flex items-center gap-2">
          <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="px-3 py-1.5 text-sm font-medium border border-slate-300 rounded-md bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Sebelumnya
          </button>
          <span class="text-sm font-medium text-slate-600">Hal {{ currentPage }} dari {{ totalPages }}</span>
          <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages" class="px-3 py-1.5 text-sm font-medium border border-slate-300 rounded-md bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Selanjutnya
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL FORM -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white w-full max-w-md rounded-xl shadow-xl flex flex-col overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 class="font-bold text-lg text-slate-800">{{ modalMode === 'tambah' ? 'Tambah Anggota' : 'Edit Anggota' }}</h3>
          <button @click="tutupModal" class="text-slate-400 hover:text-slate-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div class="p-6 flex flex-col gap-4">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">NRP / NIP</label>
            <input type="text" v-model="formAnggota.nrp" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap</label>
            <input type="text" v-model="formAnggota.nama" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Pangkat</label>
            <input type="text" v-model="formAnggota.pangkat" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Jenis Keanggotaan</label>
            <select v-model="formAnggota.jenis_anggota" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 bg-white">
              <option value="Militer">Militer</option>
              <option value="PNS">PNS</option>
              <option value="PPPK">PPPK</option>
            </select>
          </div>
          <div v-if="modalMode === 'edit'">
            <label class="block text-sm font-semibold text-slate-700 mb-1">Saldo Voucher (Rp)</label>
            <input type="number" v-model="formAnggota.saldo_voucher" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
          </div>
        </div>
        <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button @click="tutupModal" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-md">Batal</button>
          <button @click="simpanAnggota" class="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md">Simpan</button>
        </div>
      </div>
    </div>

    <!-- MODAL HAPUS & NOTIF -->
    <div v-if="isDeleteModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white w-full max-w-sm rounded-xl shadow-xl flex flex-col overflow-hidden">
        <div class="p-6 flex flex-col items-center text-center">
          <div class="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 class="font-bold text-lg text-slate-800 mb-2">Konfirmasi Hapus</h3>
          <p class="text-sm text-slate-500 mb-1">Yakin menghapus data anggota ini?</p>
          <p class="font-bold mt-2">{{ itemToDelete?.nama }} ({{ itemToDelete?.nrp }})</p>
        </div>
        <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button @click="tutupModalHapus" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-md">Batal</button>
          <button @click="konfirmasiHapus" class="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-md">Hapus</button>
        </div>
      </div>
    </div>

    <!-- MODAL CETAK DETAIL ANGGOTA INDIVIDU (LAPORAN RESMI) -->
    <div v-if="isPrintModalOpen && printData" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div class="bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col overflow-hidden my-auto max-h-[90vh]">
        <!-- Header Modal (Hidden when printing) -->
        <div class="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center print:hidden">
          <h3 class="font-bold text-slate-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Laporan Resmi Personel: {{ printData.anggota.nama }}
          </h3>
          <button @click="tutupPrintModal" class="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- Printable Document Container -->
        <div class="p-8 overflow-y-auto bg-white space-y-6 text-slate-800 font-mono" id="printable-receipt">
          <!-- Kop Laporan Resmi -->
          <div class="text-center border-b-2 border-slate-900 pb-3">
            <h2 class="font-black text-lg text-slate-900 tracking-wider">LEMBAR DATA ANGGOTA - PROGRAM ANTIGRAVITY</h2>
            <p class="text-xs text-slate-600 font-bold mt-1">KOPERASI TRIBUANA IV</p>
            <p class="text-[11px] text-slate-500 mt-0.5">Tanggal Cetak: {{ new Date().toLocaleDateString('id-ID', { dateStyle: 'full' }) }}</p>
          </div>

          <!-- IDENTITAS PERSONEL -->
          <div class="space-y-1.5 text-sm border-b border-slate-200 pb-4">
            <h3 class="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">IDENTITAS PERSONEL:</h3>
            <div class="grid grid-cols-[110px_15px_1fr] items-center">
              <span>Nama</span><span>:</span><span class="font-bold">{{ printData.anggota.nama }}</span>
            </div>
            <div class="grid grid-cols-[110px_15px_1fr] items-center">
              <span>Pangkat</span><span>:</span><span class="font-semibold">{{ printData.anggota.pangkat }}</span>
            </div>
            <div class="grid grid-cols-[110px_15px_1fr] items-center">
              <span>N R P</span><span>:</span><span class="font-bold">{{ printData.anggota.nrp }}</span>
            </div>
          </div>

          <!-- SALDO VOUCHER SAAT INI -->
          <div class="py-3 border-y border-slate-300 bg-slate-50 px-4 flex items-center justify-between">
            <span class="font-bold text-sm text-slate-800">SALDO VOUCHER SAAT INI :</span>
            <span class="font-black text-base text-indigo-700">{{ formatRupiah(printData.summary.sisa_saldo) }}</span>
          </div>

          <!-- INFORMASI JATAH VOUCHER -->
          <div class="space-y-2">
            <h3 class="font-bold text-xs uppercase tracking-wider text-slate-500">INFORMASI JATAH VOUCHER:</h3>
            <div class="border border-slate-200 rounded-md divide-y divide-slate-100 bg-white">
              <div v-for="j in daftarJatahBulan" :key="j.bulan" class="px-4 py-2 flex justify-between items-center text-xs">
                <span class="font-semibold">{{ j.label }}</span>
                <span class="font-bold uppercase tracking-wider px-2 py-0.5 rounded" :class="j.status === 'Terpakai' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'">
                  Status: {{ j.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- Tanda Tangan Resmi (Untuk Print Out Document) -->
          <div class="pt-6 grid grid-cols-2 text-center text-xs text-slate-700 print:grid">
            <div>
              <p>Mengetahui,</p>
              <p class="font-bold mt-1">Pengurus Koperasi Tribuana IV</p>
              <div class="h-16"></div>
              <p class="font-bold underline">( .................................... )</p>
            </div>
            <div>
              <p>Cijantung, {{ new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}</p>
              <p class="font-bold mt-1">Personel Yang Bersangkutan</p>
              <div class="h-16"></div>
              <p class="font-bold underline">{{ printData.anggota.nama }}</p>
              <p class="text-[11px] text-slate-500">NRP: {{ printData.anggota.nrp }}</p>
            </div>
          </div>
        </div>

        <!-- Footer Actions (Hidden when printing) -->
        <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 print:hidden">
          <button @click="tutupPrintModal" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-md">
            Tutup
          </button>
          <button @click="cetakLaporanResmi" class="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Cetak Laporan Resmi
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL KONFIRMASI DISTRIBUSI VOUCHER -->
    <div v-if="isDistribusiModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-100">
        <!-- Header Modal -->
        <div class="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-blue-50 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="font-bold text-lg text-slate-800 leading-tight">Distribusi Voucher Bulanan</h3>
              <p class="text-xs text-indigo-600 font-medium mt-0.5">Konfirmasi Alokasi Saldo Anggota</p>
            </div>
          </div>
          <button @click="tutupModalDistribusi" class="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-white/60">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content Body -->
        <div class="p-6 space-y-4">
          <p class="text-sm text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin membagikan alokasi voucher bulanan ke <strong class="text-slate-800">seluruh anggota aktif</strong>?
          </p>

          <!-- Summary Box -->
          <div class="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 space-y-2.5">
            <div class="flex justify-between items-center text-sm">
              <span class="text-slate-500 font-medium">Alokasi Per Anggota:</span>
              <span class="font-bold text-indigo-700">Rp 100.000</span>
            </div>
            <div class="flex justify-between items-center text-sm border-t border-indigo-100/80 pt-2">
              <span class="text-slate-500 font-medium">Jumlah Anggota Aktif:</span>
              <span class="font-bold text-slate-800">{{ totalItems }} Anggota</span>
            </div>
            <div class="flex justify-between items-center text-sm border-t border-indigo-100/80 pt-2">
              <span class="text-slate-500 font-medium">Estimasi Total Voucher:</span>
              <span class="font-black text-emerald-600">{{ formatRupiah(totalItems * 100000) }}</span>
            </div>
          </div>

          <!-- Alert/Notice Rule -->
          <div class="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 flex gap-3 items-start text-xs text-amber-900">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="space-y-1 leading-snug">
              <span class="font-bold block">Sistem Akumulasi Otomatis:</span>
              <p>Saldo Rp 100.000 akan otomatis ditambahkan ke sisa saldo voucher masing-masing anggota. Saldo bulan lalu yang belum dipakai tidak akan hangus.</p>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-3">
          <button @click="tutupModalDistribusi" :disabled="isDistributing" class="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors disabled:opacity-50">
            Batal
          </button>
          <button @click="eksekusiDistribusiVoucher" :disabled="isDistributing" class="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50">
            <svg v-if="isDistributing" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span v-if="isDistributing">Memproses Distribusi...</span>
            <span v-else>Ya, Bagikan Voucher Sekarang</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="isNotifModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white w-full max-w-sm rounded-xl shadow-xl p-6 text-center">
        <h3 class="font-bold text-lg text-slate-800 mb-2">{{ notifTitle }}</h3>
        <p class="text-sm text-slate-500 mb-4">{{ notifMessage }}</p>
        <button @click="tutupNotif" class="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md w-full">Tutup</button>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const user = computed(() => authStore.user);

// State untuk form filter
const searchQuery = ref('');
const kategoriTerpilih = ref('Semua kategori');
const filterStok = ref('Semua Stok');

// ==========================================
// STATE & API: Database Kelola Barang
// ==========================================
const daftarBarang = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');

// Pagination State
const currentPage = ref(1);
const totalPages = ref(1);
const totalItems = ref(0);
const limit = 30;

// ==========================================
// STATE UNTUK MODAL FORM (CRUD)
// ==========================================
const isModalOpen = ref(false);
const modalMode = ref('tambah'); // 'tambah' atau 'edit'
const idSedangDiedit = ref(null);

const isDeleteModalOpen = ref(false);
const itemToDelete = ref(null);

// Detail Modal
const isDetailModalOpen = ref(false);
const barangDetail = ref(null);
const riwayatSupplier = ref([]);
const isLoadingRiwayat = ref(false);

const isMutasiModalOpen = ref(false);
const formMutasi = ref({
  id_barang: null,
  nama_barang: '',
  stok_gudang: 0,
  jumlah: 0,
  tujuan: 'Swalayan'
});

const isNotifModalOpen = ref(false);
const notifTitle = ref('Pemberitahuan');
const notifMessage = ref('');

const tampilkanNotif = (title, message) => {
  notifTitle.value = title;
  notifMessage.value = message;
  isNotifModalOpen.value = true;
};

const tutupNotif = () => {
  isNotifModalOpen.value = false;
};

const formBarang = ref({
  barcode: '',
  nama_barang: '',
  golongan: '',
  harga_beli: 0,
  stok_swalayan: 0,
  stok_grosir: 0,
  harga_swalayan: 0,
  harga_grosir: 0,
  satuan_swalayan: '',
  satuan_grosir: '',
  stok_gudang: 0,
  stok_minimal: 10
});

const bukaModalTambah = () => {
  modalMode.value = 'tambah';
  idSedangDiedit.value = null;
  formBarang.value = {
    barcode: '',
    nama_barang: '',
    golongan: '',
    harga_beli: 0,
    stok_swalayan: 0,
    stok_grosir: 0,
    harga_swalayan: 0,
    harga_grosir: 0,
    satuan_swalayan: '',
    satuan_grosir: '',
    stok_gudang: 0,
    stok_minimal: 10
  };
  isModalOpen.value = true;
};

const bukaModalEdit = (item) => {
  modalMode.value = 'edit';
  idSedangDiedit.value = item.id_barang;
  formBarang.value = { 
    barcode: item.barcode || '',
    nama_barang: item.nama_barang || '',
    golongan: item.golongan || '',
    harga_beli: item.harga_beli || 0,
    stok_swalayan: item.stok_swalayan || 0,
    stok_grosir: item.stok_grosir || 0,
    harga_swalayan: item.harga_swalayan || 0,
    harga_grosir: item.harga_grosir || 0,
    satuan_swalayan: item.satuan_swalayan || '',
    satuan_grosir: item.satuan_grosir || '',
    stok_gudang: item.stok_gudang || 0,
    stok_minimal: item.stok_minimal !== undefined ? item.stok_minimal : 10
  };
  isModalOpen.value = true;
};

const tutupModal = () => {
  isModalOpen.value = false;
};

const simpanBarang = async () => {
  try {
    if (modalMode.value === 'tambah') {
      await api.post('/barang', formBarang.value);
    } else {
      await api.put(`/barang/${idSedangDiedit.value}`, formBarang.value);
    }
    
    await fetchBarang();
    tutupModal();
  } catch (error) {
    console.error('Error saving barang:', error);
    tampilkanNotif('Gagal Menyimpan', error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.');
  }
};

const bukaModalHapus = (item) => {
  itemToDelete.value = item;
  isDeleteModalOpen.value = true;
};

const bukaModalDetail = async (item) => {
  barangDetail.value = item;
  riwayatSupplier.value = [];
  isLoadingRiwayat.value = true;
  isDetailModalOpen.value = true;
  
  try {
    const res = await api.get(`/barang/${item.id_barang}/riwayat`);
    riwayatSupplier.value = res.data;
  } catch (error) {
    console.error('Error fetching riwayat:', error);
    tampilkanNotif('Gagal', 'Gagal memuat riwayat supplier');
  } finally {
    isLoadingRiwayat.value = false;
  }
};

const tutupModalDetail = () => {
  isDetailModalOpen.value = false;
};

const tutupModalHapus = () => {
  isDeleteModalOpen.value = false;
  itemToDelete.value = null;
};

const konfirmasiHapus = async () => {
  if (!itemToDelete.value) return;
  
  try {
    await api.delete(`/barang/${itemToDelete.value.id_barang}`);
    await fetchBarang();
    tutupModalHapus();
  } catch (error) {
    console.error('Error deleting barang:', error);
    tampilkanNotif('Gagal Menghapus', error.response?.data?.message || 'Gagal menghapus barang.');
  }
};

const bukaModalMutasi = (item) => {
  formMutasi.value = {
    id_barang: item.id_barang,
    nama_barang: item.nama_barang,
    stok_gudang: item.stok_gudang || 0,
    jumlah: 0,
    tujuan: 'Swalayan'
  };
  isMutasiModalOpen.value = true;
};

const tutupModalMutasi = () => {
  isMutasiModalOpen.value = false;
};

const simpanMutasi = async () => {
  if (formMutasi.value.jumlah <= 0) {
    tampilkanNotif('Gagal', 'Jumlah mutasi harus lebih dari 0');
    return;
  }
  if (formMutasi.value.jumlah > formMutasi.value.stok_gudang) {
    tampilkanNotif('Gagal', 'Stok gudang tidak mencukupi');
    return;
  }
  
  try {
    await api.post('/barang/mutasi', {
      id_barang: formMutasi.value.id_barang,
      jumlah: formMutasi.value.jumlah,
      tujuan: formMutasi.value.tujuan
    });
    await fetchBarang();
    tutupModalMutasi();
    tampilkanNotif('Berhasil', 'Mutasi stok berhasil dilakukan');
  } catch (error) {
    console.error('Error mutasi:', error);
    tampilkanNotif('Gagal Mutasi', error.response?.data?.message || 'Terjadi kesalahan saat memutasi stok.');
  }
};

const fetchBarang = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    
    const params = new URLSearchParams({
      page: currentPage.value,
      limit: limit,
      search: searchQuery.value,
      kategori: kategoriTerpilih.value,
      stok_menipis: filterStok.value === 'Stok Menipis'
    });

    const response = await api.get(`/barang?${params.toString()}`);
    if (response.data.pagination) {
      daftarBarang.value = response.data.data;
      totalPages.value = response.data.pagination.totalPages;
      totalItems.value = response.data.pagination.totalItems;
    } else {
      // Fallback if backend doesn't support pagination yet
      daftarBarang.value = response.data;
    }
  } catch (error) {
    console.error('Error fetching barang:', error);
    errorMessage.value = 'Gagal memuat data barang. Silakan coba lagi.';
  } finally {
    isLoading.value = false;
  }
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchBarang();
  }
};

const applyFilter = () => {
  currentPage.value = 1;
  fetchBarang();
};

onMounted(() => {
  fetchBarang();
});

// dataDitampilkan simply returns the fetched data
const dataDitampilkan = computed(() => daftarBarang.value);

const formatRupiah = (angka) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
};
</script>

<template>
  <!-- Perhatikan: Tidak ada lagi div h-screen dan tidak ada <aside> sidebar di sini -->
  <main class="flex-1 flex flex-col h-full overflow-hidden bg-white w-full">
    
    <!-- Header Area -->
    <header class="px-8 py-6 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Kelola Barang</h1>
        <p class="text-sm text-slate-500 mt-1">Data barang dengan harga eceran & grosir serta stok terpusat.</p>
      </div>
      <button @click="bukaModalTambah" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        Tambah Barang
      </button>
    </header>

    <!-- Toolbar Pencarian & Filter -->
    <div class="px-8 py-4 border-b border-slate-100 flex gap-4 bg-slate-50 flex-shrink-0 flex-wrap">
      <div class="relative flex-1 min-w-[200px]">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input type="text" v-model="searchQuery" @keyup.enter="applyFilter" placeholder="Cari nama barang... (Tekan Enter)" class="w-full border border-slate-300 pl-10 pr-4 py-2 rounded-md text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white">
      </div>
      
      <select v-model="filterStok" @change="applyFilter" class="w-48 border border-slate-300 px-4 py-2 rounded-md text-sm text-slate-700 focus:outline-none focus:border-blue-600 bg-white cursor-pointer">
        <option>Semua Stok</option>
        <option>Stok Menipis</option>
      </select>

      <select v-model="kategoriTerpilih" @change="applyFilter" class="w-48 border border-slate-300 px-4 py-2 rounded-md text-sm text-slate-700 focus:outline-none focus:border-blue-600 bg-white cursor-pointer">
        <option>Semua kategori</option>
        <option>FOOD</option>
        <option>NON FOOD</option>
        <option>ELEKTRO</option>
        <option>PECAH BELAH</option>
        <option>ATK</option>
        <option>KOSMETIK</option>
        <option>OBAT</option>
        <option>ABRI</option>
        <option>RAJUTAN</option>
      </select>
    </div>

    <!-- Tabel Data -->
    <div class="flex-1 overflow-auto p-8 pt-4">
      <div class="border border-slate-200 rounded-lg shadow-sm overflow-hidden bg-white">
        <table class="w-full text-left text-sm text-slate-600">
          <thead class="bg-slate-100 text-slate-600 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th class="px-5 py-4">Nama Barang</th>
              <th class="px-5 py-4">Golongan</th>
              <th class="px-5 py-4 text-right">Harga Beli</th>
              <th class="px-5 py-4 text-right">Harga Swalayan</th>
              <th class="px-5 py-4 text-right">Harga Grosir</th>
              <th class="px-5 py-4 text-center">Stok Gudang</th>
              <th class="px-5 py-4 text-center">Stok Swalayan</th>
              <th class="px-5 py-4 text-center">Stok Grosir</th>
              <th class="px-5 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="9" class="px-5 py-12 text-center text-slate-400">Memuat data...</td>
            </tr>
            <tr v-else-if="errorMessage">
              <td colspan="9" class="px-5 py-12 text-center text-red-500">{{ errorMessage }}</td>
            </tr>
            <tr v-else-if="dataDitampilkan.length === 0">
              <td colspan="9" class="px-5 py-12 text-center text-slate-400">Barang tidak ditemukan.</td>
            </tr>
            <tr v-else v-for="(item, index) in dataDitampilkan" :key="item.id_barang || index" class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td class="px-5 py-3 font-medium text-slate-800">{{ item.nama_barang }}</td>
              <td class="px-5 py-3 text-slate-500">{{ item.golongan }}</td>
              <td class="px-5 py-3 text-right text-slate-700">{{ formatRupiah(item.harga_beli) }}</td>
              <td class="px-5 py-3 text-right text-slate-700">{{ formatRupiah(item.harga_swalayan) }}</td>
              <td class="px-5 py-3 text-right text-slate-700">{{ formatRupiah(item.harga_grosir) }}</td>
              <td class="px-5 py-3 text-center text-slate-700 font-bold bg-blue-50">{{ item.stok_gudang || 0 }}</td>
              <td class="px-5 py-3 text-center">
                <span :class="(item.stok_swalayan || 0) <= 5 ? 'text-red-600 font-bold bg-red-50 px-2 py-1 rounded border border-red-200' : 'text-slate-700'">
                  {{ item.stok_swalayan || 0 }} {{ item.satuan_swalayan }}
                </span>
              </td>
              <td class="px-5 py-3 text-center">
                <span :class="(item.stok_grosir || 0) <= 5 ? 'text-red-600 font-bold bg-red-50 px-2 py-1 rounded border border-red-200' : 'text-slate-700'">
                  {{ item.stok_grosir || 0 }} {{ item.satuan_grosir }}
                </span>
              </td>
              <td class="px-5 py-3 text-center">
                <div class="flex justify-center gap-2">
                  <button @click="bukaModalDetail(item)" class="text-slate-400 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 p-1.5 rounded transition-colors" title="Detail Riwayat">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </button>
                  <button @click="bukaModalMutasi(item)" class="text-slate-400 hover:text-green-600 bg-slate-100 hover:bg-green-50 p-1.5 rounded transition-colors" title="Mutasi Stok">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  </button>
                  <button @click="bukaModalEdit(item)" class="text-slate-400 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 p-1.5 rounded transition-colors" title="Edit Barang">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button @click="bukaModalHapus(item)" class="text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 p-1.5 rounded transition-colors" title="Hapus Barang">
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
          Menampilkan <span class="font-bold text-slate-700">{{ dataDitampilkan.length }}</span> dari <span class="font-bold text-slate-700">{{ totalItems }}</span> barang secara total.
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

    <!-- ========================================== -->
    <!-- MODAL FORM (TAMBAH / EDIT) -->
    <!-- ========================================== -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white w-full max-w-2xl rounded-xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]">
        
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
          <h3 class="font-bold text-lg text-slate-800">{{ modalMode === 'tambah' ? 'Tambah Barang Baru' : 'Edit Barang' }}</h3>
          <button @click="tutupModal" class="text-slate-400 hover:text-slate-600 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 flex flex-col gap-4 overflow-y-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Barcode / Kode</label>
              <input type="text" v-model="formBarang.barcode" placeholder="Scan atau ketik barcode" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Nama Barang</label>
              <input type="text" v-model="formBarang.nama_barang" placeholder="Masukkan nama barang" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
            </div>
            
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Golongan</label>
              <select v-model="formBarang.golongan" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 bg-white">
                <option value="">Pilih Kategori</option>
                <option value="FOOD">FOOD</option>
                <option value="NON FOOD">NON FOOD</option>
                <option value="ELEKTRO">ELEKTRO</option>
                <option value="PECAH BELAH">PECAH BELAH</option>
                <option value="ATK">ATK</option>
                <option value="KOSMETIK">KOSMETIK</option>
                <option value="OBAT">OBAT</option>
                <option value="ABRI">ABRI</option>
                <option value="RAJUTAN">RAJUTAN</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Harga Beli</label>
              <input type="number" v-model="formBarang.harga_beli" placeholder="0" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Stok Gudang Pusat (Fisik)</label>
              <input type="number" v-model="formBarang.stok_gudang" :disabled="user?.nama_role !== 'Admin Sistem' && user?.nama_role !== 'Admin Gudang'" placeholder="0" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed">
              <span v-if="user?.nama_role !== 'Admin Sistem' && user?.nama_role !== 'Admin Gudang'" class="text-[10px] text-red-500 font-bold">Hanya Admin Gudang / Sistem yang dapat mengedit stok fisik gudang.</span>
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Batas Stok Minimal</label>
              <input type="number" v-model="formBarang.stok_minimal" placeholder="Contoh: 10" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
            </div>

            <div class="border-t border-slate-200 md:col-span-2 pt-2 mt-2">
              <h4 class="font-semibold text-slate-700 text-sm mb-2">Informasi Swalayan (Eceran)</h4>
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Stok Swalayan</label>
              <input type="number" v-model="formBarang.stok_swalayan" placeholder="0" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Harga Swalayan</label>
              <input type="number" v-model="formBarang.harga_swalayan" placeholder="0" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-semibold text-slate-700 mb-1">Satuan Swalayan</label>
              <input type="text" v-model="formBarang.satuan_swalayan" placeholder="Contoh: Bungkus, Pcs, dll" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
            </div>

            <div class="border-t border-slate-200 md:col-span-2 pt-2 mt-2">
              <h4 class="font-semibold text-slate-700 text-sm mb-2">Informasi Grosir</h4>
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Stok Grosir</label>
              <input type="number" v-model="formBarang.stok_grosir" placeholder="0" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Harga Grosir</label>
              <input type="number" v-model="formBarang.harga_grosir" placeholder="0" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-semibold text-slate-700 mb-1">Satuan Grosir</label>
              <input type="text" v-model="formBarang.satuan_grosir" placeholder="Contoh: Dus, Karton, dll" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 flex-shrink-0">
          <button @click="tutupModal" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-md transition-colors">Batal</button>
          <button @click="simpanBarang" class="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors">Simpan Data</button>
        </div>

      </div>
    </div>

    <!-- MODAL HAPUS -->
    <div v-if="isDeleteModalOpen" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all">
        <div class="p-6 text-center">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h3 class="text-lg font-bold text-slate-800 mb-2">Hapus Barang</h3>
          <p class="text-slate-500 text-sm">Apakah Anda yakin ingin menghapus barang <span class="font-bold text-slate-700">{{ itemToDelete?.nama_barang }}</span>? Aksi ini akan menyembunyikan data (soft delete).</p>
        </div>
        <div class="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
          <button @click="tutupModalHapus" class="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">Batal</button>
          <button @click="konfirmasiHapus" class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors">Ya, Hapus</button>
        </div>
      </div>
    </div>

    <!-- MODAL DETAIL BARANG -->
    <div v-if="isDetailModalOpen" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Detail Barang
          </h2>
          <button @click="tutupModalDetail" class="text-slate-400 hover:text-slate-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto">
          <div class="mb-6 pb-4 border-b border-slate-200">
            <h3 class="text-xl font-bold text-slate-800">{{ barangDetail?.nama_barang }}</h3>
            <div class="text-sm text-slate-500 mt-1 flex gap-4">
              <span>Barcode: <span class="font-semibold text-slate-700">{{ barangDetail?.barcode || '-' }}</span></span>
              <span>Kategori: <span class="font-semibold text-slate-700">{{ barangDetail?.golongan || '-' }}</span></span>
            </div>
          </div>
          
          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <div class="text-xs text-blue-600 font-bold uppercase mb-1">Stok Gudang</div>
              <div class="text-xl font-black text-slate-800">{{ barangDetail?.stok_gudang || 0 }}</div>
            </div>
            <div class="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
              <div class="text-xs text-emerald-600 font-bold uppercase mb-1">Toko Swalayan</div>
              <div class="text-xl font-black text-slate-800">{{ barangDetail?.stok_swalayan || 0 }} {{ barangDetail?.satuan_swalayan }}</div>
              <div class="text-xs text-slate-500 mt-1">Hrg: {{ formatRupiah(barangDetail?.harga_swalayan) }}</div>
            </div>
            <div class="bg-amber-50 p-3 rounded-lg border border-amber-100">
              <div class="text-xs text-amber-600 font-bold uppercase mb-1">Toko Grosir</div>
              <div class="text-xl font-black text-slate-800">{{ barangDetail?.stok_grosir || 0 }} {{ barangDetail?.satuan_grosir }}</div>
              <div class="text-xs text-slate-500 mt-1">Hrg: {{ formatRupiah(barangDetail?.harga_grosir) }}</div>
            </div>
          </div>
          
          <h4 class="font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2">Riwayat Pembelian (Supplier)</h4>
          <div class="border border-slate-200 rounded-lg overflow-hidden">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-4 py-2 font-semibold">Tanggal</th>
                  <th class="px-4 py-2 font-semibold">Supplier</th>
                  <th class="px-4 py-2 font-semibold text-right">Jumlah</th>
                  <th class="px-4 py-2 font-semibold text-right">Harga Satuan</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoadingRiwayat">
                  <td colspan="4" class="px-4 py-8 text-center text-slate-400">Memuat riwayat...</td>
                </tr>
                <tr v-else-if="riwayatSupplier.length === 0">
                  <td colspan="4" class="px-4 py-8 text-center text-slate-400">Belum ada riwayat pembelian untuk barang ini.</td>
                </tr>
                <tr v-else v-for="(hist, idx) in riwayatSupplier" :key="idx" class="border-b border-slate-100 hover:bg-slate-50">
                  <td class="px-4 py-2">{{ new Date(hist.waktu_pembelian).toLocaleDateString('id-ID') }}</td>
                  <td class="px-4 py-2 font-medium text-slate-700">{{ hist.nama_supplier }}</td>
                  <td class="px-4 py-2 text-right">{{ hist.jumlah }}</td>
                  <td class="px-4 py-2 text-right">{{ formatRupiah(hist.harga_satuan) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100 flex-shrink-0">
          <button @click="tutupModalDetail" class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors">Tutup</button>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODAL MUTASI STOK -->
    <!-- ========================================== -->
    <div v-if="isMutasiModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white w-full max-w-md rounded-xl shadow-xl flex flex-col overflow-hidden">
        
        <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 class="font-bold text-lg text-slate-800">Mutasi Stok Gudang</h3>
          <button @click="tutupModalMutasi" class="text-slate-400 hover:text-slate-600 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="p-6 flex flex-col gap-4">
          <div class="bg-blue-50 p-4 rounded-md border border-blue-100 mb-2">
            <p class="text-xs text-blue-500 font-semibold mb-1">Barang Terpilih:</p>
            <p class="font-bold text-slate-800">{{ formMutasi.nama_barang }}</p>
            <p class="text-sm text-slate-600 mt-1">Sisa Stok Gudang: <span class="font-bold text-slate-800">{{ formMutasi.stok_gudang }}</span></p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Tujuan Mutasi</label>
            <select v-model="formMutasi.tujuan" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
              <option value="Swalayan">Ke Toko Swalayan (Eceran)</option>
              <option value="Grosir">Ke Toko Grosir (Partai)</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Jumlah Mutasi</label>
            <input type="number" v-model="formMutasi.jumlah" min="1" :max="formMutasi.stok_gudang" placeholder="0" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
          </div>
        </div>

        <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button @click="tutupModalMutasi" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-md transition-colors w-full sm:w-auto">Batal</button>
          <button @click="simpanMutasi" class="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors w-full sm:w-auto">Proses Mutasi</button>
        </div>

      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODAL NOTIFIKASI -->
    <!-- ========================================== -->
    <div v-if="isNotifModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white w-full max-w-sm rounded-xl shadow-xl flex flex-col overflow-hidden">
        
        <div class="p-6 flex flex-col items-center text-center">
          <div class="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="font-bold text-lg text-slate-800 mb-2">{{ notifTitle }}</h3>
          <p class="text-sm text-slate-500">{{ notifMessage }}</p>
        </div>

        <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-center">
          <button @click="tutupNotif" class="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors w-full">Tutup</button>
        </div>

      </div>
    </div>

  </main>
</template>
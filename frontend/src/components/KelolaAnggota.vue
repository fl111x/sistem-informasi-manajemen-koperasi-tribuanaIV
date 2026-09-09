<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';

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
  jenis_anggota: 'Militer'
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

const isDistributing = ref(false);
const distribusiVoucher = async () => {
  try {
    isDistributing.value = true;
    await api.post('/voucher/distribusi');
    tampilkanNotif('Berhasil', 'Voucher bulanan berhasil dibagikan ke seluruh anggota militer aktif.');
    await fetchAnggota();
  } catch (error) {
    tampilkanNotif('Gagal', error.response?.data?.message || 'Gagal mendistribusi voucher.');
  } finally {
    isDistributing.value = false;
  }
};
const konfirmasiDistribusi = () => {
  if (confirm('Anda yakin ingin membagikan voucher Rp 100.000 kepada seluruh anggota militer aktif secara otomatis?')) {
    distribusiVoucher();
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

const distribusiVoucher = async () => {
  try {
    await api.post('/voucher/distribusi');
    tampilkanNotif('Berhasil', 'Distribusi voucher telah dijalankan.');
    await fetchAnggota();
  } catch (error) {
    tampilkanNotif('Gagal', 'Gagal menjalankan distribusi voucher.');
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
  formAnggota.value = { nrp: '', nama: '', pangkat: '', jenis_anggota: 'Militer' };
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
  try {
    if (modalMode.value === 'tambah') {
      await api.post('/anggota', formAnggota.value);
      tampilkanNotif('Berhasil', 'Anggota berhasil ditambahkan.');
    } else {
      await api.put(`/anggota/${idSedangDiedit.value}`, formAnggota.value);
      tampilkanNotif('Berhasil', 'Anggota berhasil diperbarui.');
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
        <p class="text-sm text-slate-500 mt-1">Data nominatif anggota koperasi, voucher dan simpanan.</p>
      </div>
      <div class="flex gap-2">
        <button @click="konfirmasiDistribusi" :disabled="isDistributing" class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span v-if="isDistributing">Memproses...</span>
          <span v-else>Distribusi Voucher</span>
        </button>
        <button @click="bukaModalTambah" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          Tambah Anggota
        </button>
      </div>
<<<<<<< HEAD
      <div class="flex">
        <button @click="bukaModalTambah" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          Tambah Anggota
        </button>
        <button @click="distribusiVoucher" class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors flex items-center gap-2 ml-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18"/>
          </svg>
          Distribusi Voucher
        </button>
      </div>
=======
>>>>>>> f0e74b71d17bcb532265112fb65c417109ba177e
    </header>

    <!-- Toolbar & Tabs -->
    <div class="px-8 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 bg-slate-50 flex-shrink-0 justify-between items-start sm:items-center">
      <div class="flex gap-1 bg-slate-200/50 p-1 rounded-lg">
        <button @click="activeTab = 'Semua'; applyFilter()" :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-colors', activeTab === 'Semua' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700']">Semua</button>
        <button @click="activeTab = 'Militer'; applyFilter()" :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-colors', activeTab === 'Militer' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700']">Militer</button>
        <button @click="activeTab = 'PNS'; applyFilter()" :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-colors', activeTab === 'PNS' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700']">PNS</button>
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
              <th class="px-5 py-4 w-1/4">NRP</th>
<<<<<<< HEAD
              <th class="px-5 py-4 w-1/3">Nama Lengkap</th>
              <th class="px-5 py-4">Pangkat</th>
              <th class="px-5 py-4">Jenis</th>
              <th class="px-5 py-4">Saldo Voucher</th>
              <th class="px-5 py-4">Simpanan</th>
=======
              <th class="px-5 py-4 w-1/4">Nama Lengkap</th>
              <th class="px-5 py-4">Pangkat / Jenis</th>
              <th class="px-5 py-4 text-right">Saldo Voucher</th>
              <th class="px-5 py-4 text-right">Simpanan</th>
>>>>>>> f0e74b71d17bcb532265112fb65c417109ba177e
              <th class="px-5 py-4 w-24 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
<<<<<<< HEAD
              <td colspan="7" class="px-5 py-12 text-center text-slate-400">Memuat data...</td>
            </tr>
            <tr v-else-if="errorMessage">
              <td colspan="7" class="px-5 py-12 text-center text-red-500">{{ errorMessage }}</td>
            </tr>
            <tr v-else-if="dataDitampilkan.length === 0">
              <td colspan="7" class="px-5 py-12 text-center text-slate-400">Data anggota tidak ditemukan.</td>
=======
              <td colspan="6" class="px-5 py-12 text-center text-slate-400">Memuat data...</td>
            </tr>
            <tr v-else-if="errorMessage">
              <td colspan="6" class="px-5 py-12 text-center text-red-500">{{ errorMessage }}</td>
            </tr>
            <tr v-else-if="dataDitampilkan.length === 0">
              <td colspan="6" class="px-5 py-12 text-center text-slate-400">Data anggota tidak ditemukan.</td>
>>>>>>> f0e74b71d17bcb532265112fb65c417109ba177e
            </tr>
            <tr v-else v-for="item in dataDitampilkan" :key="item.id_anggota" class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td class="px-5 py-3 font-medium text-slate-800">{{ item.nrp }}</td>
              <td class="px-5 py-3 text-slate-800">{{ item.nama }}</td>
              <td class="px-5 py-3 text-slate-700">
                <div class="font-medium">{{ item.pangkat }}</div>
                <span v-if="item.jenis_anggota === 'PNS'" class="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-emerald-100 text-emerald-700 mt-1 inline-block">PNS</span>
                <span v-else class="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-blue-100 text-blue-700 mt-1 inline-block">Militer</span>
              </td>
<<<<<<< HEAD
              <td class="px-5 py-3 text-center">{{ item.saldo_voucher }}</td>
              <td class="px-5 py-3 text-center">{{ item.simpanan }}</td>
=======
              <td class="px-5 py-3 text-right font-bold text-indigo-600">{{ formatRupiah(item.saldo_voucher) }}</td>
              <td class="px-5 py-3 text-right font-bold text-slate-600">{{ formatRupiah(item.simpanan) }}</td>
>>>>>>> f0e74b71d17bcb532265112fb65c417109ba177e
              <td class="px-5 py-3 text-center">
                <div class="flex justify-center gap-2">
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
            </select>
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

    <div v-if="isNotifModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white w-full max-w-sm rounded-xl shadow-xl p-6 text-center">
        <h3 class="font-bold text-lg text-slate-800 mb-2">{{ notifTitle }}</h3>
        <p class="text-sm text-slate-500 mb-4">{{ notifMessage }}</p>
        <button @click="tutupNotif" class="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md w-full">Tutup</button>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';

const searchQuery = ref('');
const daftarAnggota = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');

// Modal State
const isModalOpen = ref(false);
const modalMode = ref('tambah'); 
const idSedangDiedit = ref(null);

const formAnggota = ref({
  nrp: '',
  nama: '',
  jenis: 'Militer',
  pangkat_golongan: ''
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

const fetchAnggota = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    const response = await api.get('/anggota');
    daftarAnggota.value = response.data;
  } catch (error) {
    console.error('Error fetching anggota:', error);
    // Silent fail if endpoint doesn't exist yet, just mock for now
    if (error.response?.status === 404) {
      daftarAnggota.value = [
        { id_anggota: 1, nrp: '123456789', nama: 'Sertu Budi', jenis: 'Militer', pangkat_golongan: 'Sertu' },
        { id_anggota: 2, nrp: '198701012010121001', nama: 'Agus Santoso', jenis: 'PNS', pangkat_golongan: 'III/b' }
      ];
    } else {
      errorMessage.value = 'Gagal memuat data anggota.';
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchAnggota();
});

const dataDitampilkan = computed(() => {
  if (!searchQuery.value) return daftarAnggota.value;
  const query = searchQuery.value.toLowerCase();
  return daftarAnggota.value.filter(a => 
    (a.nama && a.nama.toLowerCase().includes(query)) || 
    (a.nrp && a.nrp.includes(query))
  );
});

const bukaModalTambah = () => {
  modalMode.value = 'tambah';
  idSedangDiedit.value = null;
  formAnggota.value = { nrp: '', nama: '', jenis: 'Militer', pangkat_golongan: '' };
  isModalOpen.value = true;
};

const bukaModalEdit = (item) => {
  modalMode.value = 'edit';
  idSedangDiedit.value = item.id_anggota;
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
    await api.delete(`/anggota/${itemToDelete.value.id_anggota}`);
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
        <p class="text-sm text-slate-500 mt-1">Data nominatif anggota koperasi (Militer, PNS, P3K).</p>
      </div>
      <button @click="bukaModalTambah" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        Tambah Anggota
      </button>
    </header>

    <!-- Toolbar -->
    <div class="px-8 py-4 border-b border-slate-100 flex gap-4 bg-slate-50 flex-shrink-0">
      <div class="relative w-full max-w-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input type="text" v-model="searchQuery" placeholder="Cari nama atau NRP..." class="w-full border border-slate-300 pl-10 pr-4 py-2 rounded-md text-sm text-slate-800 focus:outline-none focus:border-blue-600 bg-white">
      </div>
    </div>

    <!-- Table -->
    <div class="flex-1 overflow-auto p-8 pt-4">
      <div class="border border-slate-200 rounded-lg shadow-sm overflow-hidden bg-white">
        <table class="w-full text-left text-sm text-slate-600">
          <thead class="bg-slate-100 text-slate-600 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th class="px-5 py-4 w-1/4">NRP</th>
              <th class="px-5 py-4 w-1/3">Nama Lengkap</th>
              <th class="px-5 py-4">Jenis</th>
              <th class="px-5 py-4">Pangkat/Golongan</th>
              <th class="px-5 py-4 w-24 text-center">Aksi</th>
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
              <td class="px-5 py-3 font-medium text-slate-800">{{ item.nrp }}</td>
              <td class="px-5 py-3 text-slate-800">{{ item.nama }}</td>
              <td class="px-5 py-3 text-slate-700">
                <span :class="item.jenis === 'Militer' ? 'bg-green-100 text-green-700' : (item.jenis === 'PNS' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700')" class="px-2 py-1 rounded text-xs font-bold">
                  {{ item.jenis }}
                </span>
              </td>
              <td class="px-5 py-3 text-slate-700">{{ item.pangkat_golongan }}</td>
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
      <div class="mt-4 text-xs text-slate-500">Menampilkan {{ dataDitampilkan.length }} dari {{ daftarAnggota.length }} anggota.</div>
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
            <label class="block text-sm font-semibold text-slate-700 mb-1">Jenis Pegawai</label>
            <select v-model="formAnggota.jenis" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
              <option value="Militer">Militer</option>
              <option value="PNS">PNS</option>
              <option value="P3K">P3K</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Pangkat / Golongan</label>
            <input type="text" v-model="formAnggota.pangkat_golongan" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
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

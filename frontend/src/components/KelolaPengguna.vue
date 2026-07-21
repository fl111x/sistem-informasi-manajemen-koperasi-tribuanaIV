<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';

// ==========================================
// STATE & API: Database Pengguna
// ==========================================
const daftarPengguna = ref([]);
const daftarRoles = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');
const searchQuery = ref('');

// ==========================================
// STATE UNTUK MODAL FORM (CRUD)
// ==========================================
const isModalOpen = ref(false);
const modalMode = ref('tambah'); // 'tambah' atau 'edit'
const idSedangDiedit = ref(null);

const isDeleteModalOpen = ref(false);
const itemToDelete = ref(null);

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

const formPengguna = ref({
  nama_pengguna: '',
  username: '',
  id_role: '',
  password: '' // Kosong saat diedit kecuali ingin diganti
});

const fetchData = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    
    // Fetch users and roles in parallel
    const [usersRes, rolesRes] = await Promise.all([
      api.get('/users'),
      api.get('/roles')
    ]);
    
    daftarPengguna.value = usersRes.data;
    daftarRoles.value = rolesRes.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    errorMessage.value = 'Gagal memuat data pengguna. Silakan coba lagi.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

// ==========================================
// FUNGSI PENCARIAN (READ)
// ==========================================
const dataDitampilkan = computed(() => {
  if (!searchQuery.value) return daftarPengguna.value;
  const query = searchQuery.value.toLowerCase();
  return daftarPengguna.value.filter(user => 
    (user.nama_pengguna || '').toLowerCase().includes(query) || 
    (user.username || '').toLowerCase().includes(query) ||
    (user.nama_role || '').toLowerCase().includes(query)
  );
});

// ==========================================
// FUNGSI CRUD (Create, Update, Delete)
// ==========================================
const bukaModalTambah = () => {
  modalMode.value = 'tambah';
  idSedangDiedit.value = null;
  formPengguna.value = { nama_pengguna: '', username: '', id_role: daftarRoles.value.length > 0 ? daftarRoles.value[0].id_role : '', password: '' };
  isModalOpen.value = true;
};

const bukaModalEdit = (user) => {
  modalMode.value = 'edit';
  idSedangDiedit.value = user.id_pengguna;
  formPengguna.value = { 
    nama_pengguna: user.nama_pengguna, 
    username: user.username, 
    id_role: user.id_role, 
    password: '' 
  };
  isModalOpen.value = true;
};

const tutupModal = () => {
  isModalOpen.value = false;
};

const simpanPengguna = async () => {
  try {
    if (modalMode.value === 'tambah') {
      await api.post('/auth/register', formPengguna.value);
    } else {
      const payload = { ...formPengguna.value };
      if (!payload.password) delete payload.password; // Don't send empty password
      await api.put(`/users/${idSedangDiedit.value}`, payload);
    }
    
    // Refresh data
    await fetchData();
    tutupModal();
  } catch (error) {
    console.error('Error saving user:', error);
    tampilkanNotif('Gagal Menyimpan', error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.');
  }
};

const bukaModalHapus = (user) => {
  itemToDelete.value = user;
  isDeleteModalOpen.value = true;
};

const tutupModalHapus = () => {
  isDeleteModalOpen.value = false;
  itemToDelete.value = null;
};

const konfirmasiHapus = async () => {
  if (!itemToDelete.value) return;
  
  try {
    await api.delete(`/users/${itemToDelete.value.id_pengguna}`);
    await fetchData();
    tutupModalHapus();
  } catch (error) {
    console.error('Error deleting user:', error);
    tampilkanNotif('Gagal Menghapus', error.response?.data?.message || 'Gagal menghapus pengguna.');
  }
};
</script>

<template>
  <main class="flex-1 flex flex-col h-full w-full bg-slate-50 overflow-hidden relative">
    
    <!-- HEADER -->
    <header class="px-8 py-6 border-b border-slate-200 flex justify-between items-center flex-shrink-0 bg-white">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Kelola Pengguna</h1>
        <p class="text-sm text-slate-500 mt-1">Manajemen akses, peran, dan data staf Koperasi Tribuana IV.</p>
      </div>
      <button @click="bukaModalTambah" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
        Tambah Pengguna
      </button>
    </header>

    <!-- TOOLBAR PENCARIAN -->
    <div class="px-8 py-4 border-b border-slate-100 flex gap-4 bg-slate-50 flex-shrink-0">
      <div class="relative w-full max-w-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input 
          type="text" 
          v-model="searchQuery"
          placeholder="Cari nama, username, atau peran..." 
          class="w-full border border-slate-300 pl-10 pr-4 py-2 rounded-md text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
        >
      </div>
    </div>

    <!-- TABEL DATA PENGGUNA -->
    <div class="flex-1 overflow-auto p-8 pt-4">
      <div class="border border-slate-200 rounded-lg shadow-sm overflow-hidden bg-white">
        <table class="w-full text-left text-sm text-slate-600">
          <thead class="bg-slate-100 text-slate-600 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th class="px-5 py-4 w-1/3">Pengguna</th>
              <th class="px-5 py-4 w-1/4">Peran (Role)</th>
              <th class="px-5 py-4 w-1/4">Terakhir Login</th>
              <th class="px-5 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="4" class="px-5 py-12 text-center text-slate-400">Memuat data...</td>
            </tr>
            <tr v-else-if="errorMessage">
              <td colspan="4" class="px-5 py-12 text-center text-red-500">{{ errorMessage }}</td>
            </tr>
            <tr v-else-if="dataDitampilkan.length === 0">
              <td colspan="4" class="px-5 py-12 text-center text-slate-400">Pengguna tidak ditemukan.</td>
            </tr>
            <tr v-else v-for="user in dataDitampilkan" :key="user.id_pengguna" class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              
              <!-- Kolom Nama & Username -->
              <td class="px-5 py-3">
                <div class="flex flex-col">
                  <span class="font-bold text-slate-800">{{ user.nama_pengguna }}</span>
                  <span class="text-xs text-slate-400">@{{ user.username }}</span>
                </div>
              </td>

              <!-- Kolom Peran -->
              <td class="px-5 py-3">
                <span class="inline-flex items-center px-2 py-1 rounded text-xs font-semibold"
                  :class="user.nama_role === 'Administrator' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'">
                  {{ user.nama_role }}
                </span>
              </td>

              <!-- Kolom Terakhir Login -->
              <td class="px-5 py-3 text-slate-500 text-xs font-medium">{{ user.terakhirLogin }}</td>

              <!-- Kolom Aksi -->
              <td class="px-5 py-3">
                <div class="flex justify-center gap-2">
                  <button @click="bukaModalEdit(user)" class="text-slate-400 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 p-1.5 rounded transition-colors" title="Edit Pengguna">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button @click="bukaModalHapus(user)" class="text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 p-1.5 rounded transition-colors" title="Hapus Pengguna">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </td>

            </tr>
          </tbody>
        </table>
      </div>
      <div class="mt-4 text-xs text-slate-500">Menampilkan {{ dataDitampilkan.length }} dari {{ daftarPengguna.length }} pengguna.</div>
    </div>

    <!-- ========================================== -->
    <!-- MODAL FORM (TAMBAH / EDIT) -->
    <!-- ========================================== -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div class="bg-white w-full max-w-md rounded-xl shadow-xl flex flex-col overflow-hidden">
        
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 class="font-bold text-lg text-slate-800">{{ modalMode === 'tambah' ? 'Tambah Pengguna Baru' : 'Edit Pengguna' }}</h3>
          <button @click="tutupModal" class="text-slate-400 hover:text-slate-600 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 flex flex-col gap-4">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap</label>
            <input type="text" v-model="formPengguna.nama_pengguna" placeholder="Masukkan nama lengkap" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Username</label>
            <input type="text" v-model="formPengguna.username" placeholder="Masukkan username" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Peran (Role)</label>
            <select v-model="formPengguna.id_role" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 cursor-pointer">
              <option v-for="role in daftarRoles" :key="role.id_role" :value="role.id_role">
                {{ role.nama_role }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Password <span v-if="modalMode==='edit'" class="text-xs text-slate-400 font-normal">(Kosongkan jika tidak diganti)</span></label>
            <input type="password" v-model="formPengguna.password" placeholder="Masukkan kata sandi" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button @click="tutupModal" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-md transition-colors">Batal</button>
          <button @click="simpanPengguna" class="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors">Simpan Data</button>
        </div>

      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODAL KONFIRMASI HAPUS -->
    <!-- ========================================== -->
    <div v-if="isDeleteModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white w-full max-w-sm rounded-xl shadow-xl flex flex-col overflow-hidden">
        
        <div class="p-6 flex flex-col items-center text-center">
          <div class="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 class="font-bold text-lg text-slate-800 mb-2">Konfirmasi Hapus</h3>
          <p class="text-sm text-slate-500 mb-1">Apakah Anda yakin ingin menghapus pengguna ini?</p>
          <p class="text-sm font-semibold text-slate-700 bg-slate-50 px-3 py-2 rounded border border-slate-200 w-full mt-2">
            {{ itemToDelete?.nama_pengguna || 'Pengguna Tidak Diketahui' }}
          </p>
          <p class="text-xs text-red-500 mt-3">Tindakan ini tidak dapat dibatalkan.</p>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button @click="tutupModalHapus" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-md transition-colors w-full sm:w-auto">Batal</button>
          <button @click="konfirmasiHapus" class="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition-colors w-full sm:w-auto">Hapus Akses</button>
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
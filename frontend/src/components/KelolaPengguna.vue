<script setup>
import { ref, computed } from 'vue';

// ==========================================
// MOCK DATA: Database Pengguna
// ==========================================
const daftarPengguna = ref([
  { id: 1, nama: 'Budi Santoso', username: 'admin_budi', peran: 'Administrator', status: 'Aktif', terakhirLogin: '21 Jul 2026, 08:15' },
  { id: 2, nama: 'Rina Melati', username: 'kasir_rina', peran: 'Kasir Swalayan', status: 'Aktif', terakhirLogin: '21 Jul 2026, 07:30' },
  { id: 3, nama: 'Dewi Lestari', username: 'grosir_dewi', peran: 'Kasir Grosir', status: 'Aktif', terakhirLogin: '20 Jul 2026, 15:45' },
  { id: 4, nama: 'Agus Pratama', username: 'kasir_agus', peran: 'Kasir Swalayan', status: 'Nonaktif', terakhirLogin: '10 Jun 2026, 14:00' },
]);

const searchQuery = ref('');

// ==========================================
// STATE UNTUK MODAL FORM (CRUD)
// ==========================================
const isModalOpen = ref(false);
const modalMode = ref('tambah'); // 'tambah' atau 'edit'
const idSedangDiedit = ref(null);

// Form model
const formPengguna = ref({
  nama: '',
  username: '',
  peran: 'Kasir Swalayan',
  status: 'Aktif',
  password: '' // Kosong saat diedit kecuali ingin diganti
});

// ==========================================
// FUNGSI PENCARIAN (READ)
// ==========================================
const dataDitampilkan = computed(() => {
  if (!searchQuery.value) return daftarPengguna.value;
  const query = searchQuery.value.toLowerCase();
  return daftarPengguna.value.filter(user => 
    user.nama.toLowerCase().includes(query) || 
    user.username.toLowerCase().includes(query) ||
    user.peran.toLowerCase().includes(query)
  );
});

// ==========================================
// FUNGSI CRUD (Create, Update, Delete)
// ==========================================
const bukaModalTambah = () => {
  modalMode.value = 'tambah';
  idSedangDiedit.value = null;
  formPengguna.value = { nama: '', username: '', peran: 'Kasir Swalayan', status: 'Aktif', password: '' };
  isModalOpen.value = true;
};

const bukaModalEdit = (user) => {
  modalMode.value = 'edit';
  idSedangDiedit.value = user.id;
  // Salin data ke form
  formPengguna.value = { 
    nama: user.nama, 
    username: user.username, 
    peran: user.peran, 
    status: user.status, 
    password: '' 
  };
  isModalOpen.value = true;
};

const tutupModal = () => {
  isModalOpen.value = false;
};

const simpanPengguna = () => {
  if (modalMode.value === 'tambah') {
    // CREATE (Tambah Data)
    const idBaru = daftarPengguna.value.length > 0 ? Math.max(...daftarPengguna.value.map(u => u.id)) + 1 : 1;
    daftarPengguna.value.push({
      id: idBaru,
      nama: formPengguna.value.nama,
      username: formPengguna.value.username,
      peran: formPengguna.value.peran,
      status: formPengguna.value.status,
      terakhirLogin: '-'
    });
  } else {
    // UPDATE (Edit Data)
    const index = daftarPengguna.value.findIndex(u => u.id === idSedangDiedit.value);
    if (index !== -1) {
      daftarPengguna.value[index].nama = formPengguna.value.nama;
      daftarPengguna.value[index].username = formPengguna.value.username;
      daftarPengguna.value[index].peran = formPengguna.value.peran;
      daftarPengguna.value[index].status = formPengguna.value.status;
    }
  }
  tutupModal();
};

const hapusPengguna = (id) => {
  if (confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
    // DELETE (Hapus Data)
    daftarPengguna.value = daftarPengguna.value.filter(u => u.id !== id);
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
              <th class="px-5 py-4 w-1/4">Pengguna</th>
              <th class="px-5 py-4 w-1/6">Peran (Role)</th>
              <th class="px-5 py-4 w-1/6 text-center">Status</th>
              <th class="px-5 py-4 w-1/5">Terakhir Login</th>
              <th class="px-5 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="dataDitampilkan.length === 0">
              <td colspan="5" class="px-5 py-12 text-center text-slate-400">Pengguna tidak ditemukan.</td>
            </tr>
            <tr v-else v-for="user in dataDitampilkan" :key="user.id" class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              
              <!-- Kolom Nama & Username -->
              <td class="px-5 py-3">
                <div class="flex flex-col">
                  <span class="font-bold text-slate-800">{{ user.nama }}</span>
                  <span class="text-xs text-slate-400">@{{ user.username }}</span>
                </div>
              </td>

              <!-- Kolom Peran -->
              <td class="px-5 py-3">
                <span class="inline-flex items-center px-2 py-1 rounded text-xs font-semibold"
                  :class="user.peran === 'Administrator' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'">
                  {{ user.peran }}
                </span>
              </td>

              <!-- Kolom Status -->
              <td class="px-5 py-3 text-center">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  :class="user.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                  <div class="w-1.5 h-1.5 rounded-full" :class="user.status === 'Aktif' ? 'bg-green-500' : 'bg-red-500'"></div>
                  {{ user.status }}
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
                  <button @click="hapusPengguna(user.id)" class="text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 p-1.5 rounded transition-colors" title="Hapus Pengguna">
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
            <input type="text" v-model="formPengguna.nama" placeholder="Masukkan nama lengkap" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Username</label>
            <input type="text" v-model="formPengguna.username" placeholder="Masukkan username" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
          </div>
          
          <div class="flex gap-4">
            <div class="flex-1">
              <label class="block text-sm font-semibold text-slate-700 mb-1">Peran (Role)</label>
              <select v-model="formPengguna.peran" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 cursor-pointer">
                <option>Administrator</option>
                <option>Kasir Swalayan</option>
                <option>Kasir Grosir</option>
              </select>
            </div>
            <div class="flex-1">
              <label class="block text-sm font-semibold text-slate-700 mb-1">Status</label>
              <select v-model="formPengguna.status" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 cursor-pointer">
                <option>Aktif</option>
                <option>Nonaktif</option>
              </select>
            </div>
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

  </main>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';

// State untuk form filter
const searchQuery = ref('');
const kategoriTerpilih = ref('Semua kategori');

// ==========================================
// STATE & API: Database Kelola Barang
// ==========================================
const daftarBarang = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');

// ==========================================
// STATE UNTUK MODAL FORM (CRUD)
// ==========================================
const isModalOpen = ref(false);
const modalMode = ref('tambah'); // 'tambah' atau 'edit'
const idSedangDiedit = ref(null);

const formBarang = ref({
  nama_barang: '',
  golongan: '',
  harga_beli: 0,
  stok_swalayan: 0,
  stok_grosir: 0,
  harga_swalayan: 0,
  harga_grosir: 0,
  satuan_swalayan: '',
  satuan_grosir: ''
});

const bukaModalTambah = () => {
  modalMode.value = 'tambah';
  idSedangDiedit.value = null;
  formBarang.value = {
    nama_barang: '',
    golongan: '',
    harga_beli: 0,
    stok_swalayan: 0,
    stok_grosir: 0,
    harga_swalayan: 0,
    harga_grosir: 0,
    satuan_swalayan: '',
    satuan_grosir: ''
  };
  isModalOpen.value = true;
};

const bukaModalEdit = (item) => {
  modalMode.value = 'edit';
  idSedangDiedit.value = item.id_barang;
  formBarang.value = { 
    nama_barang: item.nama_barang || '',
    golongan: item.golongan || '',
    harga_beli: item.harga_beli || 0,
    stok_swalayan: item.stok_swalayan || 0,
    stok_grosir: item.stok_grosir || 0,
    harga_swalayan: item.harga_swalayan || 0,
    harga_grosir: item.harga_grosir || 0,
    satuan_swalayan: item.satuan_swalayan || '',
    satuan_grosir: item.satuan_grosir || ''
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
    alert(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.');
  }
};

const hapusBarang = async (id) => {
  if (confirm('Apakah Anda yakin ingin menghapus barang ini?')) {
    try {
      await api.delete(`/barang/${id}`);
      await fetchBarang();
    } catch (error) {
      console.error('Error deleting barang:', error);
      alert(error.response?.data?.message || 'Gagal menghapus barang.');
    }
  }
};

const fetchBarang = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    const response = await api.get('/barang');
    daftarBarang.value = response.data;
  } catch (error) {
    console.error('Error fetching barang:', error);
    errorMessage.value = 'Gagal memuat data barang. Silakan coba lagi.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchBarang();
});

// Fungsi Filter
const dataDitampilkan = computed(() => {
  return daftarBarang.value.filter((item) => {
    const nama = item.nama_barang || '';
    const golongan = item.golongan || '';

    const cocokKataKunci = nama.toLowerCase().includes(searchQuery.value.toLowerCase());
    const cocokKategori = kategoriTerpilih.value === 'Semua kategori' || golongan === kategoriTerpilih.value;
    return cocokKataKunci && cocokKategori;
  });
});

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
    <div class="px-8 py-4 border-b border-slate-100 flex gap-4 bg-slate-50 flex-shrink-0">
      <div class="relative flex-1">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input type="text" v-model="searchQuery" placeholder="Cari nama barang..." class="w-full border border-slate-300 pl-10 pr-4 py-2 rounded-md text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white">
      </div>
      <select v-model="kategoriTerpilih" class="w-64 border border-slate-300 px-4 py-2 rounded-md text-sm text-slate-700 focus:outline-none focus:border-blue-600 bg-white cursor-pointer">
        <option>Semua kategori</option>
        <option>Sembako</option>
        <option>Minuman</option>
        <option>Makanan Ringan</option>
        <option>Perawatan Diri</option>
        <option>Kebutuhan Rumah</option>
        <option>ATK</option>
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
              <th class="px-5 py-4 text-center">Stok Swalayan</th>
              <th class="px-5 py-4 text-center">Stok Grosir</th>
              <th class="px-5 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="8" class="px-5 py-12 text-center text-slate-400">Memuat data...</td>
            </tr>
            <tr v-else-if="errorMessage">
              <td colspan="8" class="px-5 py-12 text-center text-red-500">{{ errorMessage }}</td>
            </tr>
            <tr v-else-if="dataDitampilkan.length === 0">
              <td colspan="8" class="px-5 py-12 text-center text-slate-400">Barang tidak ditemukan.</td>
            </tr>
            <tr v-else v-for="(item, index) in dataDitampilkan" :key="item.id_barang || index" class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td class="px-5 py-3 font-medium text-slate-800">{{ item.nama_barang }}</td>
              <td class="px-5 py-3 text-slate-500">{{ item.golongan }}</td>
              <td class="px-5 py-3 text-right text-slate-700">{{ formatRupiah(item.harga_beli) }}</td>
              <td class="px-5 py-3 text-right text-slate-700">{{ formatRupiah(item.harga_swalayan) }}</td>
              <td class="px-5 py-3 text-right text-slate-700">{{ formatRupiah(item.harga_grosir) }}</td>
              <td class="px-5 py-3 text-center text-slate-700">{{ item.stok_swalayan }} {{ item.satuan_swalayan }}</td>
              <td class="px-5 py-3 text-center text-slate-700">{{ item.stok_grosir }} {{ item.satuan_grosir }}</td>
              <td class="px-5 py-3 text-center">
                <div class="flex justify-center gap-2">
                  <button @click="bukaModalEdit(item)" class="text-slate-400 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 p-1.5 rounded transition-colors" title="Edit Barang">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button @click="hapusBarang(item.id_barang)" class="text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 p-1.5 rounded transition-colors" title="Hapus Barang">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="mt-4 text-xs text-slate-500">Menampilkan {{ dataDitampilkan.length }} dari {{ daftarBarang.length }} barang.</div>
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
            <div class="md:col-span-2">
              <label class="block text-sm font-semibold text-slate-700 mb-1">Nama Barang</label>
              <input type="text" v-model="formBarang.nama_barang" placeholder="Masukkan nama barang" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
            </div>
            
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Golongan</label>
              <input type="text" v-model="formBarang.golongan" placeholder="Masukkan golongan (kategori)" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Harga Beli</label>
              <input type="number" v-model="formBarang.harga_beli" placeholder="0" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600">
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
  </main>
</template>
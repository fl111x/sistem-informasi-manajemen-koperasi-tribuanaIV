<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';

const daftarPO = ref([]);
const daftarSupplier = ref([]);
const daftarBarang = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');

// Tab State
const activeTab = ref('Riwayat PO'); // 'Riwayat PO', 'Buat PO Baru'

// State Form PO
const formPO = ref({
  kategori: 'Swalayan',
  id_supplier: '',
  items: []
});
const barangPilihan = ref('');
const jumlahBarang = ref(1);
const hargaSatuan = ref(0);

// Notifikasi
const isNotifModalOpen = ref(false);
const notifTitle = ref('');
const notifMessage = ref('');

const tampilkanNotif = (title, message) => {
  notifTitle.value = title;
  notifMessage.value = message;
  isNotifModalOpen.value = true;
};
const tutupNotif = () => isNotifModalOpen.value = false;

// Detail Modal
const isDetailModalOpen = ref(false);
const poDetail = ref(null);

const fetchData = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    const [resPO, resSupplier, resBarang] = await Promise.all([
      api.get('/pembelian').catch(() => ({ data: [] })),
      api.get('/supplier').catch(() => ({ data: [] })),
      api.get('/barang').catch(() => ({ data: [] }))
    ]);
    
    daftarPO.value = resPO.data;
    daftarSupplier.value = resSupplier.data;
    daftarBarang.value = resBarang.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    errorMessage.value = 'Gagal memuat data pembelian dan master data.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

// Handle Tambah Item ke PO
const tambahItemPO = () => {
  if (!barangPilihan.value) {
    tampilkanNotif('Peringatan', 'Silakan pilih barang terlebih dahulu.');
    return;
  }
  
  const brg = daftarBarang.value.find(b => b.id_barang === barangPilihan.value);
  if (!brg) return;

  // Cek apakah sudah ada di list
  const existing = formPO.value.items.find(i => i.id_barang === brg.id_barang);
  if (existing) {
    existing.jumlah += parseInt(jumlahBarang.value);
    existing.harga_satuan = hargaSatuan.value; // update harga
  } else {
    formPO.value.items.push({
      id_barang: brg.id_barang,
      nama_barang: brg.nama_barang,
      jumlah: parseInt(jumlahBarang.value),
      harga_satuan: hargaSatuan.value
    });
  }
  
  // Reset input
  barangPilihan.value = '';
  jumlahBarang.value = 1;
  hargaSatuan.value = 0;
};

const hapusItemPO = (index) => {
  formPO.value.items.splice(index, 1);
};

const totalBOPBaru = computed(() => {
  return formPO.value.items.reduce((total, item) => total + (item.jumlah * item.harga_satuan), 0);
});

// Handle Simpan PO Baru
const isSubmitting = ref(false);
const simpanPOBaru = async () => {
  if (!formPO.value.id_supplier || formPO.value.items.length === 0) {
    tampilkanNotif('Peringatan', 'Pastikan Supplier dan minimal 1 Barang telah dipilih.');
    return;
  }

  try {
    isSubmitting.value = true;
    await api.post('/pembelian', formPO.value);
    tampilkanNotif('Berhasil', 'Purchase Order berhasil dibuat.');
    
    // Reset Form & pindah tab
    formPO.value = { kategori: 'Swalayan', id_supplier: '', items: [] };
    activeTab.value = 'Riwayat PO';
    await fetchData();
  } catch (error) {
    tampilkanNotif('Gagal', error.response?.data?.message || 'Gagal membuat PO.');
  } finally {
    isSubmitting.value = false;
  }
};

// Handle Status Gudang (Terima / Mutasi)
const updateStatusPO = async (id, statusBaru) => {
  try {
    await api.put(`/pembelian/${id}/status`, { status: statusBaru });
    tampilkanNotif('Berhasil', `Status PO diubah menjadi ${statusBaru}.`);
    await fetchData();
    isDetailModalOpen.value = false;
  } catch (error) {
    tampilkanNotif('Gagal', error.response?.data?.message || 'Gagal mengubah status.');
  }
};

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
        <h1 class="text-2xl font-bold text-slate-800">Modul Gudang & Pembelian</h1>
        <p class="text-sm text-slate-500 mt-1">Manajemen Purchase Order (PO) dan mutasi stok barang.</p>
      </div>
      <div class="flex bg-slate-100 p-1 rounded-lg">
        <button 
          @click="activeTab = 'Riwayat PO'" 
          :class="activeTab === 'Riwayat PO' ? 'bg-white shadow-sm font-bold text-slate-800' : 'text-slate-500 hover:text-slate-700'"
          class="px-4 py-2 rounded-md text-sm transition-all"
        >
          Riwayat PO
        </button>
        <button 
          @click="activeTab = 'Buat PO Baru'" 
          :class="activeTab === 'Buat PO Baru' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'"
          class="px-4 py-2 rounded-md text-sm transition-all"
        >
          Buat PO Baru
        </button>
      </div>
    </header>

    <div class="flex-1 overflow-auto bg-slate-50 p-8">
      
      <!-- TAB: RIWAYAT PO -->
      <div v-if="activeTab === 'Riwayat PO'" class="h-full">
        <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
          
          <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 class="font-bold text-slate-700">Daftar Purchase Order</h2>
            <button @click="fetchData" class="text-sm text-blue-600 font-semibold hover:underline flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Segarkan
            </button>
          </div>

          <div class="flex-1 overflow-auto">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-100 text-slate-600 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th class="px-5 py-4">ID PO</th>
                  <th class="px-5 py-4">Waktu Pembelian</th>
                  <th class="px-5 py-4">Supplier</th>
                  <th class="px-5 py-4">Kategori</th>
                  <th class="px-5 py-4 text-right">Total Biaya</th>
                  <th class="px-5 py-4 text-center">Status</th>
                  <th class="px-5 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoading">
                  <td colspan="7" class="px-5 py-12 text-center text-slate-400">Memuat data...</td>
                </tr>
                <tr v-else-if="daftarPO.length === 0">
                  <td colspan="7" class="px-5 py-12 text-center text-slate-400">Belum ada riwayat PO.</td>
                </tr>
                <tr v-else v-for="po in daftarPO" :key="po.id_pembelian" class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td class="px-5 py-3 font-medium text-slate-800">#PO-{{ po.id_pembelian }}</td>
                  <td class="px-5 py-3 text-slate-700">{{ formatDate(po.waktu_pembelian) }}</td>
                  <td class="px-5 py-3 text-slate-700">{{ po.nama_supplier || 'Supplier Tidak Diketahui' }}</td>
                  <td class="px-5 py-3 text-slate-700">{{ po.kategori }}</td>
                  <td class="px-5 py-3 text-right font-semibold text-slate-700">{{ formatRupiah(po.total_biaya) }}</td>
                  <td class="px-5 py-3 text-center">
                    <span 
                      class="px-2 py-1 rounded text-[11px] font-bold"
                      :class="{
                        'bg-yellow-100 text-yellow-700': po.status === 'Menunggu',
                        'bg-blue-100 text-blue-700': po.status === 'Diterima',
                        'bg-green-100 text-green-700': po.status === 'Dimutasi',
                        'bg-red-100 text-red-700': po.status === 'Ditunda' || po.status === 'Batal'
                      }"
                    >
                      {{ po.status }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-center">
                    <button @click="poDetail = po; isDetailModalOpen = true" class="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline">
                      Aksi / Detail
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

      <!-- TAB: BUAT PO BARU -->
      <div v-else class="max-w-4xl mx-auto h-full overflow-auto">
        <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div class="p-6 border-b border-slate-100 bg-slate-50">
            <h2 class="font-bold text-lg text-slate-800">Form Purchase Order Baru</h2>
            <p class="text-xs text-slate-500">Pilih supplier dan tambahkan daftar barang yang akan dipesan.</p>
          </div>
          
          <div class="p-6 flex flex-col gap-6">
            <!-- Informasi Umum -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">Pilih Supplier</label>
                <select v-model="formPO.id_supplier" class="w-full border border-slate-300 px-3 py-2.5 rounded-md focus:outline-none focus:border-blue-600 bg-white text-sm">
                  <option disabled value="">-- Pilih Supplier --</option>
                  <option v-for="s in daftarSupplier" :key="s.id_supplier" :value="s.id_supplier">{{ s.nama_supplier }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">Kategori Tujuan</label>
                <select v-model="formPO.kategori" class="w-full border border-slate-300 px-3 py-2.5 rounded-md focus:outline-none focus:border-blue-600 bg-white text-sm">
                  <option value="Swalayan">Swalayan (Eceran)</option>
                  <option value="Grosir">Grosir</option>
                </select>
              </div>
            </div>

            <hr class="border-slate-200">

            <!-- Tambah Item -->
            <div>
              <h3 class="font-bold text-slate-800 mb-3 text-sm">Tambahkan Barang ke PO</h3>
              <div class="flex gap-3 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div class="flex-1">
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Pilih Barang</label>
                  <select v-model="barangPilihan" @change="hargaSatuan = (daftarBarang.find(b => b.id_barang === barangPilihan)?.harga_beli || 0)" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 bg-white text-sm">
                    <option disabled value="">-- Cari Barang --</option>
                    <option v-for="b in daftarBarang" :key="b.id_barang" :value="b.id_barang">{{ b.nama_barang }} (Stok Saat Ini: {{ formPO.kategori === 'Swalayan' ? b.stok_swalayan : b.stok_grosir }})</option>
                  </select>
                </div>
                <div class="w-32">
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Jumlah</label>
                  <input type="number" v-model="jumlahBarang" min="1" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 bg-white text-sm">
                </div>
                <div class="w-40">
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Harga Satuan (Beli)</label>
                  <input type="number" v-model="hargaSatuan" min="0" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 bg-white text-sm">
                </div>
                <button @click="tambahItemPO" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm h-[38px]">
                  Tambah
                </button>
              </div>
            </div>

            <!-- Tabel Item Terpilih -->
            <div class="border border-slate-200 rounded-lg overflow-hidden">
              <table class="w-full text-left text-sm text-slate-600">
                <thead class="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th class="px-4 py-3">Nama Barang</th>
                    <th class="px-4 py-3 text-center">Jumlah</th>
                    <th class="px-4 py-3 text-right">Harga Satuan</th>
                    <th class="px-4 py-3 text-right">Subtotal</th>
                    <th class="px-4 py-3 text-center w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="formPO.items.length === 0">
                    <td colspan="5" class="px-4 py-8 text-center text-slate-400">Belum ada barang ditambahkan.</td>
                  </tr>
                  <tr v-else v-for="(item, idx) in formPO.items" :key="idx" class="border-b border-slate-100">
                    <td class="px-4 py-2 font-medium text-slate-800">{{ item.nama_barang }}</td>
                    <td class="px-4 py-2 text-center">{{ item.jumlah }}</td>
                    <td class="px-4 py-2 text-right">{{ formatRupiah(item.harga_satuan) }}</td>
                    <td class="px-4 py-2 text-right font-semibold">{{ formatRupiah(item.jumlah * item.harga_satuan) }}</td>
                    <td class="px-4 py-2 text-center">
                      <button @click="hapusItemPO(idx)" class="text-red-500 hover:bg-red-50 p-1 rounded" title="Hapus">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot class="bg-blue-50/50 border-t border-slate-200" v-if="formPO.items.length > 0">
                  <tr>
                    <td colspan="3" class="px-4 py-3 text-right font-bold text-slate-700">TOTAL BIAYA:</td>
                    <td class="px-4 py-3 text-right font-black text-blue-700 text-lg">{{ formatRupiah(totalBOPBaru) }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

          </div>

          <!-- Footer Actions -->
          <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <button @click="activeTab = 'Riwayat PO'" class="px-6 py-2 rounded-md font-semibold text-slate-600 hover:bg-slate-200 transition-colors text-sm">
              Batal
            </button>
            <button 
              @click="simpanPOBaru" 
              :disabled="isSubmitting || formPO.items.length === 0 || !formPO.id_supplier"
              class="px-6 py-2 rounded-md font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex gap-2 items-center"
            >
              <span v-if="isSubmitting">Menyimpan...</span>
              <span v-else>Simpan Purchase Order</span>
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- MODAL DETAIL / AKSI GUDANG -->
    <div v-if="isDetailModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white w-full max-w-2xl rounded-xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]">
        <div class="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center flex-shrink-0">
          <h3 class="font-bold text-lg text-slate-800">Detail Purchase Order #PO-{{ poDetail?.id_pembelian }}</h3>
          <button @click="isDetailModalOpen = false" class="text-slate-400 hover:text-slate-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        
        <div class="p-6 overflow-y-auto">
          <!-- Info -->
          <div class="grid grid-cols-2 gap-y-2 text-sm mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div><span class="text-slate-500 block text-xs">Supplier:</span> <span class="font-bold text-slate-800">{{ poDetail?.nama_supplier }}</span></div>
            <div><span class="text-slate-500 block text-xs">Waktu Order:</span> <span class="font-bold text-slate-800">{{ formatDate(poDetail?.waktu_pembelian) }}</span></div>
            <div><span class="text-slate-500 block text-xs">Kategori Tujuan:</span> <span class="font-bold text-slate-800">{{ poDetail?.kategori }}</span></div>
            <div><span class="text-slate-500 block text-xs">Status Terkini:</span> 
              <span class="font-bold" :class="poDetail?.status === 'Dimutasi' ? 'text-green-600' : 'text-blue-600'">{{ poDetail?.status }}</span>
            </div>
          </div>

          <!-- Note Mutasi -->
          <div v-if="poDetail?.status === 'Menunggu' || poDetail?.status === 'Diterima'" class="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm text-yellow-800">
            <strong>Perhatian:</strong> PO ini belum dimutasi ke stok fisik. Klik tombol <b>"Mutasi ke Stok Fisik"</b> di bawah agar kuantitas barang otomatis bertambah di Master Barang.
          </div>
          <div v-if="poDetail?.status === 'Dimutasi'" class="mb-4 bg-green-50 border-l-4 border-green-500 p-3 text-sm text-green-800">
            PO ini telah diselesaikan dan stok barang telah <strong>otomatis bertambah</strong> pada gudang/master barang.
          </div>

          <!-- (Idealnya ambil detail items dari API getById, karena data riwayat PO di /pembelian mungkin tidak punya array items lengkap. 
               Untuk simulasi, kita tampilkan totalnya saja jika items kosong). -->
          <h4 class="font-bold text-slate-800 text-sm mb-2 border-b border-slate-200 pb-1">Ringkasan Total Biaya</h4>
          <div class="text-3xl font-black text-blue-600 mb-4">{{ formatRupiah(poDetail?.total_biaya) }}</div>
        </div>

        <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 flex-shrink-0">
          <button @click="isDetailModalOpen = false" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-md">Tutup</button>
          
          <template v-if="poDetail?.status !== 'Dimutasi' && poDetail?.status !== 'Batal'">
            <button v-if="poDetail?.status === 'Menunggu'" @click="updateStatusPO(poDetail.id_pembelian, 'Diterima')" class="px-4 py-2 text-sm font-bold text-slate-700 bg-yellow-400 hover:bg-yellow-500 rounded-md shadow-sm">
              Tandai Diterima (Gudang)
            </button>
            <button @click="updateStatusPO(poDetail.id_pembelian, 'Dimutasi')" class="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm">
              Mutasi ke Stok Fisik (Selesai)
            </button>
            <button @click="updateStatusPO(poDetail.id_pembelian, 'Batal')" class="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-md">
              Batalkan PO
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- MODAL NOTIFIKASI -->
    <div v-if="isNotifModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white w-full max-w-sm rounded-xl shadow-xl p-6 text-center">
        <h3 class="font-bold text-lg text-slate-800 mb-2">{{ notifTitle }}</h3>
        <p class="text-sm text-slate-500 mb-4">{{ notifMessage }}</p>
        <button @click="tutupNotif" class="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md w-full">Tutup</button>
      </div>
    </div>
  </main>
</template>

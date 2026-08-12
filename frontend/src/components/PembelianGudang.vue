<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const user = computed(() => authStore.user);

const daftarPO = ref([]);
const daftarSupplier = ref([]);

const daftarBarang = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');

// Tab State
const activeTab = ref('Riwayat PO'); // 'Riwayat PO', 'Buat PO Baru', 'Hutang Supplier'

// State Form PO
const formPO = ref({
  kategori: 'Swalayan',
  id_supplier: '',
  metode_pembayaran: 'Tunai',
  jatuh_tempo: '',
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

const bukaDetailPO = async (po) => {
  try {
    const res = await api.get(`/pembelian/${po.id_pembelian}`);
    poDetail.value = res.data;
    
    // Check missing items only if status is not Dimutasi or Batal
    if (poDetail.value.status !== 'Dimutasi' && poDetail.value.status !== 'Batal') {
       // Just to populate itemBelumLengkap computed
    }
    
    // Copy items to editable temp items if needed for Edit PO
    editPOItems.value = JSON.parse(JSON.stringify(res.data.items));

    isDetailModalOpen.value = true;
  } catch (error) {
    tampilkanNotif('Gagal', 'Gagal mengambil detail PO');
  }
};

const itemBelumLengkap = computed(() => {
  if (!poDetail.value || !poDetail.value.items) return [];
  return poDetail.value.items.filter(i => {
    if (!i.id_barang) return false;
    if (!i.barcode || i.harga_swalayan === 0 || i.harga_swalayan === null) return true;
    
    // Validasi satuan berdasarkan kategori PO
    if (poDetail.value.kategori === 'Swalayan' && !i.satuan_swalayan) return true;
    if (poDetail.value.kategori === 'Grosir' && !i.satuan_grosir) return true;
    
    return false;
  });
});

const isLengkapiDataModalOpen = ref(false);
const formLengkapiData = ref({
  id_barang: null,
  nama_barang: '',
  barcode: '',
  harga_swalayan: 0,
  harga_grosir: 0,
  satuan_swalayan: '',
  satuan_grosir: ''
});

const isSubmittingLengkapi = ref(false);
const bukaLengkapiData = (item) => {
  formLengkapiData.value = {
    id_barang: item.id_barang,
    nama_barang: item.snapshot_nama_barang || 'Barang Baru',
    barcode: item.barcode || '',
    harga_swalayan: item.harga_swalayan || 0,
    harga_grosir: item.harga_grosir || 0,
    satuan_swalayan: item.satuan_swalayan || '',
    satuan_grosir: item.satuan_grosir || ''
  };
  isLengkapiDataModalOpen.value = true;
};

const simpanLengkapiData = async () => {
  if (poDetail.value?.kategori === 'Swalayan' && !formLengkapiData.value.satuan_swalayan) {
    tampilkanNotif('Gagal', 'Satuan Swalayan harus diisi karena ini PO Swalayan!');
    return;
  }
  if (poDetail.value?.kategori === 'Grosir' && !formLengkapiData.value.satuan_grosir) {
    tampilkanNotif('Gagal', 'Satuan Grosir harus diisi karena ini PO Grosir!');
    return;
  }

  try {
    isSubmittingLengkapi.value = true;
    await api.put(`/barang/${formLengkapiData.value.id_barang}`, formLengkapiData.value);
    tampilkanNotif('Berhasil', 'Data barang berhasil dilengkapi.');
    isLengkapiDataModalOpen.value = false;
    await bukaDetailPO(poDetail.value); // refresh detail
  } catch (error) {
    tampilkanNotif('Gagal', error.response?.data?.message || 'Gagal menyimpan data.');
  } finally {
    isSubmittingLengkapi.value = false;
  }
};

const isBarangBaruModalOpen = ref(false);
const formBarangBaru = ref({
  nama_barang: '',
  harga_beli: 0
});

const isSubmittingBarang = ref(false);
const simpanBarangBaru = async () => {
  try {
    isSubmittingBarang.value = true;
    const response = await api.post('/barang', formBarangBaru.value);
    tampilkanNotif('Berhasil', 'Barang baru berhasil ditambahkan ke Master Data.');
    
    // Refresh list barang
    const resBarang = await api.get('/barang').catch(() => ({ data: [] }));
    daftarBarang.value = resBarang.data;
    
    // Auto-select newly added item (assuming backend returns id_barang)
    if (response.data.id_barang) {
      barangPilihan.value = response.data.id_barang;
      hargaSatuan.value = formBarangBaru.value.harga_beli;
    }
    
    isBarangBaruModalOpen.value = false;
  } catch (error) {
    tampilkanNotif('Gagal', error.response?.data?.message || 'Gagal menambahkan barang baru.');
  } finally {
    isSubmittingBarang.value = false;
  }
};

// ================= HUTANG SUPPLIER =================
const daftarHutang = ref([]);
const isBayarHutangModalOpen = ref(false);
const formBayarHutang = ref({
  nominal_bayar: 0,
  metode_pembayaran: 'Transfer',
  keterangan: ''
});
const hutangTerpilih = ref(null);

const bukaBayarHutang = (hutang) => {
  hutangTerpilih.value = hutang;
  formBayarHutang.value = {
    nominal_bayar: hutang.sisa_hutang,
    metode_pembayaran: 'Transfer',
    keterangan: ''
  };
  isBayarHutangModalOpen.value = true;
};

const simpanBayarHutang = async () => {
  try {
    await api.post(`/hutang/${hutangTerpilih.value.id_hutang}/bayar`, formBayarHutang.value);
    tampilkanNotif('Berhasil', 'Pembayaran hutang berhasil dicatat.');
    isBayarHutangModalOpen.value = false;
    await fetchData();
  } catch (error) {
    tampilkanNotif('Gagal', error.response?.data?.message || 'Gagal membayar hutang.');
  }
};

// ================= MODAL MUTASI PARSIAL =================
const isMutasiModalOpen = ref(false);
const isSubmittingMutasi = ref(false);
const formMutasi = ref({
  mutasi_items: [],
  keterangan_mutasi: ''
});

const bukaMutasiModal = () => {
  formMutasi.value = {
    mutasi_items: poDetail.value.items.map(i => {
      const barangMaster = daftarBarang.value.find(b => b.id_barang === i.id_barang) || {};
      return {
        id_detail: i.id_detail,
        id_barang: i.id_barang,
        nama_barang: i.snapshot_nama_barang,
        jumlah_total: i.jumlah,
        jumlah_dimutasi_sebelumnya: i.jumlah_dimutasi || 0,
        jumlah_mutasi: 0,
        harga_beli: barangMaster.harga_beli || 0,
        harga_swalayan: barangMaster.harga_swalayan || 0,
        harga_grosir: barangMaster.harga_grosir || 0,
        satuan_swalayan: barangMaster.satuan_swalayan || '',
        satuan_grosir: barangMaster.satuan_grosir || ''
      };
    }).filter(i => i.jumlah_total > i.jumlah_dimutasi_sebelumnya)
  };
  if(formMutasi.value.mutasi_items.length === 0){
      tampilkanNotif('Info', 'Semua barang sudah dimutasi penuh.');
      return;
  }
  isMutasiModalOpen.value = true;
};

const simpanMutasiPO = async () => {
  try {
    isSubmittingMutasi.value = true;
    await api.post(`/pembelian/${poDetail.value.id_pembelian}/mutasi`, formMutasi.value);
    tampilkanNotif('Berhasil', 'Mutasi parsial berhasil dilakukan.');
    isMutasiModalOpen.value = false;
    isDetailModalOpen.value = false;
    await fetchData();
  } catch (error) {
    tampilkanNotif('Gagal', error.response?.data?.message || 'Gagal memutasi PO.');
  } finally {
    isSubmittingMutasi.value = false;
  }
};

// ================= MODAL TERIMA (Catatan Gudang) =================
const isTerimaModalOpen = ref(false);
const catatanGudang = ref('');
const bukaTerimaModal = () => {
  catatanGudang.value = '';
  isTerimaModalOpen.value = true;
};
const terimaPO = async () => {
  try {
    await api.put(`/pembelian/${poDetail.value.id_pembelian}/status`, { status: 'Diterima', catatan_gudang: catatanGudang.value });
    tampilkanNotif('Berhasil', 'Status PO diubah menjadi Diterima.');
    isTerimaModalOpen.value = false;
    isDetailModalOpen.value = false;
    await fetchData();
  } catch (error) {
    tampilkanNotif('Gagal', error.response?.data?.message || 'Gagal update status PO.');
  }
};

// ================= EDIT PO =================
const isEditPO = ref(false);
const editPOItems = ref([]);
const simpanEditPO = async () => {
  try {
    await api.put(`/pembelian/${poDetail.value.id_pembelian}/edit`, { items: editPOItems.value });
    tampilkanNotif('Berhasil', 'Perubahan PO berhasil disimpan.');
    isEditPO.value = false;
    await bukaDetailPO(poDetail.value); // refresh detail modal
    await fetchData();
  } catch (error) {
    tampilkanNotif('Gagal', error.response?.data?.message || 'Gagal menyimpan PO.');
  }
};

const fetchData = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    const [resPO, resBarang, resSupplier, resHutang] = await Promise.all([
      api.get('/pembelian').catch(() => ({ data: [] })),
      api.get('/barang').catch(() => ({ data: [] })),
      api.get('/supplier').catch(() => ({ data: [] })),
      api.get('/hutang').catch(() => ({ data: [] }))
    ]);
    
    daftarPO.value = resPO.data;
    daftarBarang.value = resBarang.data;
    daftarSupplier.value = resSupplier.data;
    daftarHutang.value = resHutang.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    errorMessage.value = 'Gagal memuat data.';
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
  
  if (formPO.value.metode_pembayaran === 'Kontrabon' && !formPO.value.jatuh_tempo) {
    tampilkanNotif('Peringatan', 'Tanggal jatuh tempo harus diisi untuk pembayaran Kontrabon.');
    return;
  }

  try {
    isSubmitting.value = true;
    const payload = { ...formPO.value };
    if (payload.metode_pembayaran === 'Kontrabon') {
      payload.metode_pembayaran = 'Tempo';
    } else {
      payload.metode_pembayaran = 'Cash';
    }
    
    await api.post('/pembelian', payload);
    tampilkanNotif('Berhasil', 'Purchase Order berhasil dibuat.');
    
    // Reset Form & pindah tab
    formPO.value = { kategori: 'Swalayan', id_supplier: '', metode_pembayaran: 'Tunai', jatuh_tempo: '', items: [] };
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
        <button v-if="user?.nama_role === 'Admin Sistem' || user?.nama_role === 'Admin Pembelian'"
          @click="activeTab = 'Buat PO Baru'" 
          :class="activeTab === 'Buat PO Baru' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'"
          class="px-4 py-2 rounded-md text-sm transition-all"
        >
          Buat PO Baru
        </button>
        <button v-if="user?.nama_role === 'Admin Sistem' || user?.nama_role === 'Admin Pembelian'"
          @click="activeTab = 'Hutang Supplier'" 
          :class="activeTab === 'Hutang Supplier' ? 'bg-white shadow-sm font-bold text-slate-800' : 'text-slate-500 hover:text-slate-700'"
          class="px-4 py-2 rounded-md text-sm transition-all"
        >
          Hutang Supplier
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
                        'bg-orange-100 text-orange-700': po.status === 'Dipesan',
                        'bg-blue-100 text-blue-700': po.status === 'Diterima',
                        'bg-green-100 text-green-700': po.status === 'Dimutasi',
                        'bg-red-100 text-red-700': po.status === 'Ditunda' || po.status === 'Batal'
                      }"
                    >
                      {{ po.status }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-center">
                    <button @click="bukaDetailPO(po)" class="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline">
                      Aksi / Detail
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

      <!-- TAB: HUTANG SUPPLIER -->
      <div v-else-if="activeTab === 'Hutang Supplier'" class="h-full">
        <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
          <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 class="font-bold text-slate-700">Daftar Hutang Jatuh Tempo</h2>
            <button @click="fetchData" class="text-sm text-blue-600 font-semibold hover:underline flex items-center gap-1">
              Segarkan
            </button>
          </div>
          <div class="flex-1 overflow-auto">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-100 text-slate-600 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th class="px-5 py-4">PO Referensi</th>
                  <th class="px-5 py-4">Supplier</th>
                  <th class="px-5 py-4">Jatuh Tempo</th>
                  <th class="px-5 py-4 text-right">Total Hutang</th>
                  <th class="px-5 py-4 text-right">Sisa Hutang</th>
                  <th class="px-5 py-4 text-center">Status</th>
                  <th class="px-5 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoading">
                  <td colspan="7" class="px-5 py-12 text-center text-slate-400">Memuat data...</td>
                </tr>
                <tr v-else-if="daftarHutang.length === 0">
                  <td colspan="7" class="px-5 py-12 text-center text-slate-400">Belum ada data hutang.</td>
                </tr>
                <tr v-else v-for="h in daftarHutang" :key="h.id_hutang" class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td class="px-5 py-3 font-medium text-slate-800">#PO-{{ h.id_pembelian }}</td>
                  <td class="px-5 py-3 text-slate-700">{{ h.nama_supplier }}</td>
                  <td class="px-5 py-3 font-semibold text-red-600">{{ formatDate(h.tanggal_jatuh_tempo).split(',')[0] }}</td>
                  <td class="px-5 py-3 text-right text-slate-700">{{ formatRupiah(h.total_hutang) }}</td>
                  <td class="px-5 py-3 text-right font-bold text-slate-800">{{ formatRupiah(h.sisa_hutang) }}</td>
                  <td class="px-5 py-3 text-center">
                    <span 
                      class="px-2 py-1 rounded text-[11px] font-bold"
                      :class="{'bg-red-100 text-red-700': h.status_lunas === 'Belum Lunas', 'bg-yellow-100 text-yellow-700': h.status_lunas === 'Sebagian', 'bg-green-100 text-green-700': h.status_lunas === 'Lunas'}"
                    >
                      {{ h.status_lunas }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-center">
                    <button v-if="h.status_lunas !== 'Lunas'" @click="bukaBayarHutang(h)" class="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded shadow-sm">
                      Bayar
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
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="lg:col-span-2">
                <label class="block text-sm font-semibold text-slate-700 mb-1">Supplier</label>
                <select v-model="formPO.id_supplier" class="w-full border border-slate-300 px-3 py-2.5 rounded-md focus:outline-none focus:border-blue-600 bg-white text-sm">
                  <option disabled value="">-- Pilih Supplier --</option>
                  <option v-for="s in daftarSupplier" :key="s.id_supplier" :value="s.id_supplier">{{ s.nama_supplier }}</option>
                </select>
              </div>
              <div class="lg:col-span-2">
                <label class="block text-sm font-semibold text-slate-700 mb-1">Kategori Tujuan</label>
                <select v-model="formPO.kategori" class="w-full border border-slate-300 px-3 py-2.5 rounded-md focus:outline-none focus:border-blue-600 bg-white text-sm">
                  <option value="Swalayan">Swalayan (Eceran)</option>
                  <option value="Grosir">Grosir</option>
                </select>
              </div>
              <div class="lg:col-span-2">
                <label class="block text-sm font-semibold text-slate-700 mb-1">Metode Pembayaran</label>
                <select v-model="formPO.metode_pembayaran" class="w-full border border-slate-300 px-3 py-2.5 rounded-md focus:outline-none focus:border-blue-600 bg-white text-sm">
                  <option value="Tunai">Tunai</option>
                  <option value="Kontrabon">Kontrabon (Tempo)</option>
                </select>
              </div>
              <div class="lg:col-span-2" v-if="formPO.metode_pembayaran === 'Kontrabon'">
                <label class="block text-sm font-semibold text-slate-700 mb-1">Tanggal Jatuh Tempo</label>
                <input type="date" v-model="formPO.jatuh_tempo" class="w-full border border-slate-300 px-3 py-2.5 rounded-md focus:outline-none focus:border-blue-600 bg-white text-sm" />
              </div>
            </div>

            <hr class="border-slate-200">

            <!-- Tambah Item -->
            <div>
              <h3 class="font-bold text-slate-800 mb-3 text-sm">Tambahkan Barang ke PO</h3>
              <div class="flex gap-3 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div class="flex-1">
                  <div class="flex justify-between items-center mb-1">
                    <label class="block text-xs font-semibold text-slate-600">Pilih Barang</label>
                    <button @click="isBarangBaruModalOpen = true" class="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                      Barang Baru
                    </button>
                  </div>
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
          <div v-if="poDetail?.status === 'Diterima'" class="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm text-yellow-800">
            <strong>Perhatian:</strong> PO ini belum dimutasi ke stok fisik. Admin Penjualan dapat melakukan mutasi parsial.
          </div>

          <!-- Catatan Gudang -->
          <div v-if="poDetail?.catatan_gudang" class="mb-4 bg-orange-50 border-l-4 border-orange-400 p-3 text-sm text-orange-900 rounded">
            <strong>Catatan dari Gudang:</strong> {{ poDetail.catatan_gudang }}
          </div>
          
          <div v-if="poDetail?.keterangan_mutasi" class="mb-4 bg-indigo-50 border-l-4 border-indigo-400 p-3 text-sm text-indigo-900 rounded whitespace-pre-wrap">
            <strong>Keterangan Administrasi Mutasi Terakhir:</strong><br/>
            {{ poDetail.keterangan_mutasi }}
          </div>
          
          <!-- Peringatan Barang Belum Lengkap -->
          <div v-if="itemBelumLengkap.length > 0 && poDetail?.status !== 'Dimutasi' && poDetail?.status !== 'Batal'" class="mb-4 bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-800">
            <strong>Penyelesaian Administrasi:</strong> Terdapat <b>{{ itemBelumLengkap.length }}</b> barang baru di dalam PO ini yang belum memiliki Barcode atau Harga Jual. Anda <b>tidak bisa melakukan mutasi</b> sebelum melengkapi data barang-barang tersebut!
            
            <div class="mt-3 flex flex-col gap-2">
              <div v-for="item in itemBelumLengkap" :key="item.id_detail_pembelian" class="flex justify-between items-center bg-white p-2 rounded border border-red-200">
                <span class="font-semibold">{{ item.snapshot_nama_barang }}</span>
                <button @click="bukaLengkapiData(item)" class="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded font-bold shadow-sm">
                  Lengkapi Data
                </button>
              </div>
            </div>
          </div>
          <div v-if="poDetail?.status === 'Dimutasi'" class="mb-4 bg-green-50 border-l-4 border-green-500 p-3 text-sm text-green-800">
            PO ini telah diselesaikan dan stok barang telah <strong>otomatis bertambah</strong> pada gudang/master barang.
          </div>

          <h4 class="font-bold text-slate-800 text-sm mb-2 border-b border-slate-200 pb-2 flex justify-between items-center">
            <span>Daftar Barang</span>
            <button v-if="poDetail?.status === 'Diterima' && (user?.nama_role === 'Admin Sistem' || user?.nama_role === 'Admin Pembelian') && !isEditPO" 
                    @click="isEditPO = true" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded shadow-sm text-sm">
              Edit Barang (Revisi)
            </button>
            <div v-if="isEditPO" class="flex gap-2">
              <button @click="isEditPO = false" class="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-1.5 rounded shadow-sm text-sm">Batal Edit</button>
              <button @click="simpanEditPO" class="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded shadow-sm text-sm">Simpan Perubahan</button>
            </div>
          </h4>
          
          <div class="border border-slate-200 rounded-lg overflow-hidden mb-4">
             <table class="w-full text-left text-xs text-slate-600">
                <thead class="bg-slate-100 uppercase font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th class="px-3 py-2">Barang</th>
                    <th class="px-3 py-2 text-center">Jumlah Pesan</th>
                    <th class="px-3 py-2 text-center" v-if="poDetail?.status === 'Diterima' || poDetail?.status === 'Dimutasi'">Dimutasi</th>
                    <th class="px-3 py-2 text-right">Harga</th>
                    <th class="px-3 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Tampilan Biasa -->
                  <template v-if="!isEditPO">
                    <tr v-for="item in poDetail?.items" :key="item.id_detail" class="border-b border-slate-100">
                      <td class="px-3 py-2 font-medium">{{ item.snapshot_nama_barang }}</td>
                      <td class="px-3 py-2 text-center">{{ item.jumlah }}</td>
                      <td class="px-3 py-2 text-center text-blue-600 font-bold" v-if="poDetail?.status === 'Diterima' || poDetail?.status === 'Dimutasi'">{{ item.jumlah_dimutasi || 0 }}</td>
                      <td class="px-3 py-2 text-right">{{ formatRupiah(item.harga_satuan) }}</td>
                      <td class="px-3 py-2 text-right font-bold">{{ formatRupiah(item.jumlah * item.harga_satuan) }}</td>
                    </tr>
                  </template>
                  <!-- Mode Edit -->
                  <template v-else>
                    <tr v-for="item in editPOItems" :key="item.id_detail" class="border-b border-slate-100">
                      <td class="px-3 py-2 font-medium">{{ item.snapshot_nama_barang }}</td>
                      <td class="px-3 py-2 text-center"><input type="number" v-model="item.jumlah" min="0" class="w-16 border rounded text-center px-1 py-0.5"></td>
                      <td class="px-3 py-2 text-center" v-if="poDetail?.status === 'Diterima' || poDetail?.status === 'Dimutasi'">-</td>
                      <td class="px-3 py-2 text-right"><input type="number" v-model="item.harga_satuan" min="0" class="w-24 border rounded text-right px-1 py-0.5"></td>
                      <td class="px-3 py-2 text-right font-bold">{{ formatRupiah(item.jumlah * item.harga_satuan) }}</td>
                    </tr>
                  </template>
                </tbody>
             </table>
          </div>

          <div class="text-right">
             <span class="text-xs text-slate-500 font-bold block mb-1">Total Biaya:</span>
             <div class="text-3xl font-black text-blue-600">{{ formatRupiah(poDetail?.total_biaya) }}</div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 flex-shrink-0">
          <button @click="isDetailModalOpen = false" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-md">Tutup</button>
          
          <template v-if="poDetail?.status !== 'Dimutasi' && poDetail?.status !== 'Batal'">
            
            <button v-if="poDetail?.status === 'Menunggu' && (user?.nama_role === 'Admin Sistem' || user?.nama_role === 'Admin Order')" 
                    @click="updateStatusPO(poDetail.id_pembelian, 'Dipesan')" class="px-4 py-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-md shadow-sm">
              Tandai Dipesan (Admin Order)
            </button>

            <button v-if="poDetail?.status === 'Dipesan' && (user?.nama_role === 'Admin Sistem' || user?.nama_role === 'Admin Gudang')" 
                    @click="bukaTerimaModal" class="px-4 py-2 text-sm font-bold text-slate-700 bg-yellow-400 hover:bg-yellow-500 rounded-md shadow-sm">
              Terima & Catat (Admin Gudang)
            </button>

            <button v-if="poDetail?.status === 'Diterima' && (user?.nama_role === 'Admin Sistem' || user?.nama_role === 'Admin Penjualan')" 
                    @click="bukaMutasiModal" :disabled="itemBelumLengkap.length > 0 || isEditPO" class="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              Mutasi Parsial (Admin Penjualan)
            </button>

            <button v-if="user?.nama_role === 'Admin Sistem' || user?.nama_role === 'Admin Pembelian'" 
                    @click="updateStatusPO(poDetail.id_pembelian, 'Batal')" class="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm">
              Batalkan PO
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- MODAL LENGKAPI DATA BARANG -->
    <div v-if="isLengkapiDataModalOpen" class="fixed inset-0 z-[55] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white w-full max-w-md rounded-xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]">
        <div class="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center flex-shrink-0">
          <h3 class="font-bold text-lg text-slate-800">Lengkapi Administrasi Barang</h3>
          <button @click="isLengkapiDataModalOpen = false" class="text-slate-400 hover:text-slate-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        
        <div class="p-6 overflow-y-auto flex flex-col gap-4">
          <div class="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-2">
            Silakan lengkapi <b>Barcode</b>, <b>Harga Swalayan</b>, dan <b>Satuan (sesuai PO)</b> untuk <strong>{{ formLengkapiData.nama_barang }}</strong> sebelum bisa dimutasi.
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Nama Barang <span class="text-red-500">*</span></label>
            <input type="text" v-model="formLengkapiData.nama_barang" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 text-sm">
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Barcode / Kode <span class="text-red-500">*</span></label>
            <input type="text" v-model="formLengkapiData.barcode" placeholder="Scan atau ketik barcode" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 text-sm">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Harga Swalayan <span class="text-red-500">*</span></label>
              <input type="number" v-model="formLengkapiData.harga_swalayan" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 text-sm">
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Harga Grosir (Opsional)</label>
              <input type="number" v-model="formLengkapiData.harga_grosir" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 text-sm">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Satuan Swalayan <span v-if="poDetail?.kategori === 'Swalayan'" class="text-red-500">*</span></label>
              <input type="text" v-model="formLengkapiData.satuan_swalayan" placeholder="Contoh: Pcs, Botol" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 text-sm">
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Satuan Grosir <span v-if="poDetail?.kategori === 'Grosir'" class="text-red-500">*</span></label>
              <input type="text" v-model="formLengkapiData.satuan_grosir" placeholder="Contoh: Dus, Karton" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 text-sm">
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 flex-shrink-0">
          <button @click="isLengkapiDataModalOpen = false" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-md">Batal</button>
          <button @click="simpanLengkapiData" :disabled="isSubmittingLengkapi" class="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm disabled:opacity-50 flex gap-2 items-center">
            <span v-if="isSubmittingLengkapi">Menyimpan...</span>
            <span v-else>Simpan Kelengkapan</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL BARANG BARU CEPAT -->
    <div v-if="isBarangBaruModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <!-- ... existing code ... -->
      <div class="bg-white w-full max-w-md rounded-xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]">
        <div class="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center flex-shrink-0">
          <h3 class="font-bold text-lg text-slate-800">Tambah Barang Cepat</h3>
          <button @click="isBarangBaruModalOpen = false" class="text-slate-400 hover:text-slate-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        
        <div class="p-6 overflow-y-auto flex flex-col gap-4">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Nama Barang <span class="text-red-500">*</span></label>
            <input type="text" v-model="formBarangBaru.nama_barang" placeholder="Masukkan nama barang" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 text-sm">
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Harga Beli</label>
            <input type="number" v-model="formBarangBaru.harga_beli" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 text-sm">
          </div>
        </div>

        <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 flex-shrink-0">
          <button @click="isBarangBaruModalOpen = false" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-md">Batal</button>
          <button @click="simpanBarangBaru" :disabled="isSubmittingBarang" class="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm disabled:opacity-50 flex gap-2 items-center">
            <span v-if="isSubmittingBarang">Menyimpan...</span>
            <span v-else>Simpan ke Master</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL TERIMA GUDANG -->
    <div v-if="isTerimaModalOpen" class="fixed inset-0 z-[55] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white w-full max-w-md rounded-xl shadow-xl flex flex-col overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 class="font-bold text-lg text-slate-800">Penerimaan Gudang</h3>
        </div>
        <div class="p-6">
          <label class="block text-sm font-semibold text-slate-700 mb-1">Catatan Gudang (Jika ada barang kurang/rusak)</label>
          <textarea v-model="catatanGudang" rows="3" placeholder="Contoh: Indomie goreng kurang 1 dus, bumbunya bocor..." class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 text-sm"></textarea>
        </div>
        <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button @click="isTerimaModalOpen = false" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-md">Batal</button>
          <button @click="terimaPO" class="px-4 py-2 text-sm font-bold text-slate-800 bg-yellow-400 hover:bg-yellow-500 rounded-md shadow-sm">Konfirmasi Terima</button>
        </div>
      </div>
    </div>

    <!-- MODAL MUTASI PARSIAL -->
    <div v-if="isMutasiModalOpen" class="fixed inset-0 z-[55] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white w-full max-w-3xl rounded-xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]">
        <div class="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 class="font-bold text-lg text-slate-800">Mutasi Fisik ke Toko</h3>
        </div>
        <div class="p-6 overflow-y-auto flex flex-col gap-4">
           <div class="bg-blue-50 text-blue-800 text-sm p-3 rounded mb-2 border border-blue-200">
             Tentukan berapa jumlah barang yang akan dimasukkan ke stok rak toko (Swalayan/Grosir) saat ini. 
             Sisa barang yang belum dimutasi akan tetap tercatat di sistem sebagai stok gudang sementara.
           </div>
           
           <div class="flex flex-col gap-3">
             <div v-for="(item, idx) in formMutasi.mutasi_items" :key="idx" class="border border-slate-200 rounded overflow-hidden">
               
               <!-- Baris Info Mutasi -->
               <div class="bg-slate-100 p-3 flex flex-wrap justify-between items-center gap-4 border-b border-slate-200">
                 <div class="font-bold text-slate-800">{{ item.nama_barang }}</div>
                 <div class="flex items-center gap-4 flex-wrap">
                   <div class="text-sm text-slate-600">Pesan: <span class="font-bold">{{ item.jumlah_total }}</span></div>
                   <div class="text-sm text-slate-600">Telah Mutasi: <span class="font-bold">{{ item.jumlah_dimutasi_sebelumnya }}</span></div>
                   <div class="flex items-center gap-2 bg-white px-2 py-1 rounded shadow-sm border border-slate-300">
                     <label class="text-sm font-bold text-blue-700">Mutasi Saat Ini:</label>
                     <input type="number" v-model="item.jumlah_mutasi" min="0" :max="item.jumlah_total - item.jumlah_dimutasi_sebelumnya" class="w-20 border-b border-slate-400 focus:border-blue-600 focus:outline-none text-center font-bold">
                   </div>
                 </div>
               </div>

               <!-- Form Edit Master -->
               <div class="p-3 bg-white">
                 <p class="text-[11px] font-bold text-slate-400 uppercase mb-2">Penyesuaian Data Master (Opsional)</p>
                 <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                       <label class="block text-xs font-semibold text-slate-600 mb-1">Harga Beli</label>
                       <input type="number" v-model="item.harga_beli" class="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500">
                    </div>
                    <div>
                       <label class="block text-xs font-semibold text-slate-600 mb-1">Harga Swalayan</label>
                       <input type="number" v-model="item.harga_swalayan" class="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500">
                    </div>
                    <div>
                       <label class="block text-xs font-semibold text-slate-600 mb-1">Harga Grosir</label>
                       <input type="number" v-model="item.harga_grosir" class="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500">
                    </div>
                    <div>
                       <label class="block text-xs font-semibold text-slate-600 mb-1">Satuan Swalayan</label>
                       <input type="text" v-model="item.satuan_swalayan" class="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500">
                    </div>
                    <div>
                       <label class="block text-xs font-semibold text-slate-600 mb-1">Satuan Grosir</label>
                       <input type="text" v-model="item.satuan_grosir" class="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500">
                    </div>
                 </div>
               </div>

             </div>
           </div>
        </div>
        <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button @click="isMutasiModalOpen = false" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-md">Batal</button>
          <button @click="simpanMutasiPO" :disabled="isSubmittingMutasi" class="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm disabled:opacity-50">
             {{ isSubmittingMutasi ? 'Memproses...' : 'Simpan Mutasi' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL BAYAR HUTANG -->
    <div v-if="isBayarHutangModalOpen" class="fixed inset-0 z-[55] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white w-full max-w-md rounded-xl shadow-xl flex flex-col overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 class="font-bold text-lg text-slate-800">Bayar Hutang Supplier</h3>
        </div>
        <div class="p-6 flex flex-col gap-4">
          <div class="bg-slate-100 p-3 rounded text-sm text-slate-700">
             <strong>Sisa Hutang:</strong> <span class="font-bold text-red-600 text-lg">{{ formatRupiah(hutangTerpilih?.sisa_hutang) }}</span>
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Nominal Bayar <span class="text-red-500">*</span></label>
            <input type="number" v-model="formBayarHutang.nominal_bayar" min="1" :max="hutangTerpilih?.sisa_hutang" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 text-sm">
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Metode</label>
            <select v-model="formBayarHutang.metode_pembayaran" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 text-sm">
              <option value="Transfer">Transfer Bank</option>
              <option value="Cash">Cash Keras</option>
              <option value="Cek">Cek / Giro</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Keterangan / Ref Transfer</label>
            <input type="text" v-model="formBayarHutang.keterangan" class="w-full border border-slate-300 px-3 py-2 rounded-md focus:outline-none focus:border-blue-600 text-sm">
          </div>
        </div>
        <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button @click="isBayarHutangModalOpen = false" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-md">Batal</button>
          <button @click="simpanBayarHutang" class="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm">Simpan Pembayaran</button>
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

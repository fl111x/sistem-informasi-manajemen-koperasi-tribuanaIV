<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';

// ==========================================
// DATA DARI DATABASE
// ==========================================
const masterBarangGrosir = ref([]);

const fetchBarang = async () => {
  try {
    const response = await api.get('/barang');
    masterBarangGrosir.value = response.data;
  } catch (error) {
    console.error('Error fetching barang:', error);
  }
};

onMounted(() => {
  fetchBarang();
});

// State pencarian dan kasir
const searchQuery = ref('');
const uangDiterima = ref();

// Notifikasi Modal
const isNotifModalOpen = ref(false);
const notifTitle = ref('Pemberitahuan');
const notifMessage = ref('');
const tampilkanNotif = (title, message) => {
  notifTitle.value = title;
  notifMessage.value = message;
  isNotifModalOpen.value = true;
};
const tutupNotif = () => isNotifModalOpen.value = false;

// Keranjang (Faktur) - Mulai kosong
const keranjang = ref([]);

// State untuk Diskon
const diskonRupiah = ref(0);
const diskonPersen = ref(0);

// ==========================================
// LOGIKA AUTOCOMPLETE & MANAJEMEN FAKTUR
// ==========================================
const hasilPencarian = computed(() => {
  if (searchQuery.value === '') return [];
  const query = searchQuery.value.toLowerCase();
  return masterBarangGrosir.value.filter(item => 
    (item.nama_barang && item.nama_barang.toLowerCase().includes(query)) || 
    (item.barcode && item.barcode.toLowerCase().includes(query))
  );
});

const sinkronisasiDiskon = () => {
  if (keranjang.value.length === 0) {
    diskonRupiah.value = 0;
    diskonPersen.value = 0;
  } else {
    if (diskonPersen.value > 0) hitungDariPersen();
    else if (diskonRupiah.value > 0) hitungDariRupiah();
  }
};

const tambahKeFaktur = (item) => {
  const barangAda = keranjang.value.find(b => b.id_barang === item.id_barang);
  
  if (barangAda) {
    barangAda.qty += 1;
    barangAda.subtotal = barangAda.qty * barangAda.harga;
  } else {
    keranjang.value.unshift({
      id_barang: item.id_barang,
      nama: item.nama_barang,
      satuan: item.satuan_grosir,
      qty: 1,
      harga: item.harga_grosir || 0,
      subtotal: item.harga_grosir || 0
    });
  }
  
  searchQuery.value = '';
  sinkronisasiDiskon();
};

// ==========================================
// KENDALI KUANTITAS (Hanya Ketik Manual)
// ==========================================
const updateQtyManual = (index) => {
  if (keranjang.value[index].qty < 1 || keranjang.value[index].qty === '') {
    keranjang.value[index].qty = 1;
  }
  keranjang.value[index].subtotal = keranjang.value[index].qty * keranjang.value[index].harga;
  sinkronisasiDiskon();
};

const hapusDariFaktur = (index) => {
  keranjang.value.splice(index, 1); 
  sinkronisasiDiskon();
};

// ==========================================
// LOGIKA PERHITUNGAN MATEMATIKA
// ==========================================
const subtotalBelanja = computed(() => {
  return keranjang.value.reduce((total, item) => total + item.subtotal, 0);
});

const totalBelanjaAkhir = computed(() => {
  return Math.max(0, subtotalBelanja.value - (Number(diskonRupiah.value) || 0));
});

const kembalian = computed(() => {
  const bayar = Number(uangDiterima.value) || 0;
  if (bayar === 0 || bayar < totalBelanjaAkhir.value) return 0;
  return bayar - totalBelanjaAkhir.value;
});

const hitungDariRupiah = () => {
  if (subtotalBelanja.value > 0) {
    let nominal = Number(diskonRupiah.value) || 0;
    if (nominal > subtotalBelanja.value) {
      nominal = subtotalBelanja.value;
      diskonRupiah.value = nominal;
    }
    let persen = (nominal / subtotalBelanja.value) * 100;
    diskonPersen.value = parseFloat(persen.toFixed(2));
  }
};

const hitungDariPersen = () => {
  if (subtotalBelanja.value > 0) {
    let persen = Number(diskonPersen.value) || 0;
    if (persen > 100) {
      persen = 100;
      diskonPersen.value = persen;
    }
    let nominal = (persen / 100) * subtotalBelanja.value;
    diskonRupiah.value = Math.round(nominal);
  }
};

const setUang = (nominal) => {
  if (nominal === 'Pas') {
    uangDiterima.value = totalBelanjaAkhir.value;
  } else {
    uangDiterima.value = nominal;
  }
};

const formatRupiah = (angka) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

const isProcessing = ref(false);

const prosesTransaksi = async () => {
  if (keranjang.value.length === 0) {
    return tampilkanNotif('Keranjang Kosong', 'Silakan tambahkan barang terlebih dahulu.');
  }
  
  if (!uangDiterima.value || uangDiterima.value < totalBelanjaAkhir.value) {
    return tampilkanNotif('Uang Kurang', 'Nominal uang yang diterima kurang dari total bayar.');
  }

  isProcessing.value = true;

  try {
    const itemsPayload = keranjang.value.map(item => {
      // Proporsikan diskon global ke masing-masing item berdasarkan subtotalnya
      const proportion = subtotalBelanja.value > 0 ? (item.subtotal / subtotalBelanja.value) : 0;
      const itemDiskon = Math.round(proportion * (Number(diskonRupiah.value) || 0));
      
      return {
        id_barang: item.id_barang,
        quantity: item.qty,
        diskon: itemDiskon
      };
    });

    const payload = {
      jenis_transaksi: 'Grosir',
      total_bayar: totalBelanjaAkhir.value,
      items: itemsPayload
    };

    const response = await api.post('/transaksi', payload);
    
    tampilkanNotif('Transaksi Berhasil', 'Transaksi berhasil disimpan. Kembalian: ' + formatRupiah(kembalian.value));
    
    // Reset Kasir
    keranjang.value = [];
    uangDiterima.value = '';
    diskonRupiah.value = 0;
    diskonPersen.value = 0;
    searchQuery.value = '';
    
    // Refresh stok
    await fetchBarang();

  } catch (error) {
    console.error('Error processing transaction:', error);
    tampilkanNotif('Transaksi Gagal', error.response?.data?.message || 'Terjadi kesalahan saat menyimpan transaksi.');
  } finally {
    isProcessing.value = false;
  }
};
</script>

<template>
  <!-- PERHATIKAN: Komponen langsung dimulai dengan <main>, tanpa Sidebar -->
  <main class="flex-1 flex flex-col h-full w-full bg-slate-50 overflow-hidden">
    
    <!-- Header -->
    <header class="px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0">
      <h1 class="text-xl font-bold text-slate-800">Kasir Grosir</h1>
      <p class="text-sm text-slate-500">Kasir penjualan partai. Ketik nama barang pada kolom pencarian di bawah.</p>
    </header>

    <!-- Area Transaksi -->
    <div class="flex-1 flex p-5 gap-5 overflow-hidden">
      
      <!-- Kiri: Tabel Barang & Pencarian -->
      <div class="flex-1 flex flex-col h-full border border-slate-300 bg-white rounded-lg shadow-sm overflow-hidden relative">
        
        <div class="relative w-full z-20">
          <div class="p-3 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              v-model="searchQuery"
              placeholder="Ketik nama barang grosir..." 
              class="w-full bg-transparent border-none focus:outline-none text-base text-slate-800"
              autofocus
            >
          </div>

          <!-- DROPDOWN PENCARIAN -->
          <div v-if="searchQuery.length > 0" class="absolute w-full top-full left-0 bg-white border-b border-x border-slate-300 shadow-lg max-h-60 overflow-y-auto rounded-b-md">
            <ul v-if="hasilPencarian.length > 0">
              <li 
                v-for="item in hasilPencarian" 
                :key="item.id_barang"
                @click="tambahKeFaktur(item)"
                class="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 flex justify-between items-center transition-colors"
              >
                <div>
                  <span class="font-medium text-slate-800">{{ item.nama_barang }}</span>
                  <span class="text-xs text-slate-500 ml-2">({{ item.satuan_grosir || '-' }})</span>
                </div>
                <span class="text-sm font-bold text-slate-600">{{ formatRupiah(item.harga_grosir) }}</span>
              </li>
            </ul>
            <div v-else class="px-4 py-3 text-sm text-slate-500 bg-slate-50 text-center">
              Barang tidak ditemukan.
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-auto z-10">
          <table class="w-full text-left text-sm text-slate-600">
            <thead class="bg-slate-100 text-slate-700 uppercase font-semibold text-xs sticky top-0 border-b border-slate-200">
              <tr>
                <th class="px-4 py-2.5 w-2/5">Barang</th>
                <th class="px-4 py-2.5 w-1/6">Satuan</th>
                <th class="px-2 py-2.5 w-1/6 text-center">Qty</th>
                <th class="px-4 py-2.5 w-1/6 text-right">Harga/Unit</th>
                <th class="px-4 py-2.5 text-right">Subtotal</th>
                <th class="px-3 py-2.5 w-10 text-center"></th> 
              </tr>
            </thead>
            <tbody>
              <tr v-if="keranjang.length === 0">
                <td colspan="6" class="px-4 py-10 text-center text-slate-400">Belum ada barang pada faktur.</td>
              </tr>
              <tr v-else class="border-b border-slate-100 hover:bg-slate-50 transition-colors" v-for="(item, index) in keranjang" :key="index">
                <td class="px-4 py-2 font-medium text-slate-800">{{ item.nama }}</td>
                <td class="px-4 py-2 text-slate-600">{{ item.satuan }}</td>
                
                <!-- KOLOM QTY (HANYA KETIK MANUAL) -->
                <td class="px-2 py-2">
                  <div class="flex items-center justify-center">
                    <input 
                      type="number" 
                      v-model="item.qty" 
                      @input="updateQtyManual(index)"
                      min="1"
                      class="w-16 h-8 text-center font-bold text-slate-800 border border-slate-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                      title="Ketik jumlah barang"
                    >
                  </div>
                </td>

                <td class="px-4 py-2 text-right">{{ formatRupiah(item.harga) }}</td>
                <td class="px-4 py-2 text-right font-bold text-slate-800">{{ formatRupiah(item.subtotal) }}</td>
                
                <!-- HAPUS TOTAL -->
                <td class="px-3 py-2 text-center">
                  <button 
                    @click="hapusDariFaktur(index)" 
                    class="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-all focus:outline-none" 
                    title="Hapus barang dari faktur"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Kanan: Panel Faktur/Pembayaran -->
      <div class="w-[380px] flex flex-col h-full bg-white border border-slate-300 rounded-lg shadow-sm p-4 justify-between">
        
        <div class="flex flex-col gap-3">
          <h3 class="text-base font-bold text-slate-800 border-b border-slate-200 pb-1">Faktur Grosir</h3>

          <div class="flex justify-between items-center text-slate-600 text-sm border-b border-slate-100 pb-2">
            <span>Subtotal Barang</span>
            <span class="font-bold text-slate-800">{{ formatRupiah(subtotalBelanja) }}</span>
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-800 block mb-1">Diskon (Otomatis Terhitung)</label>
            <div class="flex gap-2">
              <div class="relative w-2/3">
                <span class="absolute left-2.5 top-1.5 text-slate-400 text-sm font-bold">Rp</span>
                <input 
                  type="number" v-model="diskonRupiah" @input="hitungDariRupiah" min="0" :disabled="keranjang.length === 0"
                  class="w-full border border-slate-300 pl-8 pr-2 py-1.5 rounded text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
                >
              </div>
              <div class="relative w-1/3">
                <input 
                  type="number" v-model="diskonPersen" @input="hitungDariPersen" min="0" max="100" step="0.01" :disabled="keranjang.length === 0"
                  class="w-full border border-slate-300 pl-2 pr-6 py-1.5 rounded text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
                >
                <span class="absolute right-2.5 top-1.5 text-slate-400 text-sm font-bold">%</span>
              </div>
            </div>
          </div>

          <div class="flex justify-between items-end bg-blue-50 p-3 rounded border border-blue-100">
            <span class="text-blue-800 text-xs font-bold pb-1">TOTAL FAKTUR</span>
            <span class="text-2xl font-black text-blue-600">{{ formatRupiah(totalBelanjaAkhir) }}</span>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-800">Uang Diterima</label>
            <input 
              type="number" v-model="uangDiterima" :disabled="keranjang.length === 0"
              class="w-full border border-slate-300 p-2 rounded text-right text-base font-bold focus:outline-none focus:border-blue-600 bg-slate-50 disabled:bg-slate-100"
              placeholder="0"
            >
          </div>

          <div class="grid grid-cols-4 gap-1.5">
            <button @click="setUang('Pas')" :disabled="keranjang.length === 0" class="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-[11px] font-semibold py-1.5 rounded border border-slate-300">Uang Pas</button>
            <button @click="setUang(2000000)" :disabled="keranjang.length === 0" class="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-[11px] font-semibold py-1.5 rounded border border-slate-300">2 Juta</button>
            <button @click="setUang(3000000)" :disabled="keranjang.length === 0" class="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-[11px] font-semibold py-1.5 rounded border border-slate-300">3 Juta</button>
            <button @click="setUang(4000000)" :disabled="keranjang.length === 0" class="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-[11px] font-semibold py-1.5 rounded border border-slate-300">4 Juta</button>
          </div>

          <div class="flex justify-between items-center bg-slate-100 p-3 rounded border border-slate-200">
            <span class="text-sm font-semibold text-slate-600">Kembalian</span>
            <span class="text-lg font-bold text-slate-800">{{ formatRupiah(kembalian) }}</span>
          </div>
        </div>

        <!-- Tombol Cetak -->
        <div class="mt-2">
          <button 
            @click="prosesTransaksi"
            class="w-full font-bold py-3 text-sm rounded transition-colors flex justify-center items-center gap-2"
            :class="uangDiterima >= totalBelanjaAkhir ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' : 'bg-slate-300 text-slate-500 cursor-not-allowed'"
            :disabled="uangDiterima < totalBelanjaAkhir || isProcessing"
          >
            <span v-if="isProcessing">Memproses...</span>
            <span v-else>Bayar & Cetak Struk</span>
          </button>
          <p class="text-center text-[10px] text-slate-400 mt-1">Tekan F2 untuk jalan pintas</p>
        </div>

      </div>

    </div>

    <!-- MODAL NOTIFIKASI -->
    <div v-if="isNotifModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white w-full max-w-sm rounded-xl shadow-xl flex flex-col overflow-hidden">
        <div class="p-6 flex flex-col items-center text-center">
          <div class="w-16 h-16 rounded-full flex items-center justify-center mb-4"
               :class="notifTitle.includes('Berhasil') ? 'bg-green-100 text-green-500' : 'bg-blue-100 text-blue-500'">
            <svg v-if="notifTitle.includes('Berhasil')" xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="font-bold text-lg text-slate-800 mb-2">{{ notifTitle }}</h3>
          <p class="text-sm text-slate-500">{{ notifMessage }}</p>
        </div>
        <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-center">
          <button @click="tutupNotif" class="px-6 py-2 text-sm font-bold text-white rounded-md shadow-sm transition-colors w-full"
                  :class="notifTitle.includes('Berhasil') ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'">
            Tutup
          </button>
        </div>
      </div>
    </div>
    
  </main>
</template>
<script setup>
import { ref, computed } from 'vue';

// ==========================================
// MOCK DATA: Simulasi Database
// ==========================================
const masterBarangGrosir = [
  { id: 1, nama: 'Minyak Goreng Sawit 2L', satuan: 'Karton', harga: 185000 },
  { id: 2, nama: 'Gula Pasir Kemasan 1Kg', satuan: 'Karung', harga: 825000 },
  { id: 3, nama: 'Mie Instan Goreng', satuan: 'Dus', harga: 112000 },
  { id: 4, nama: 'Beras Premium 5 Kg', satuan: 'Karung 25kg', harga: 340000 },
  { id: 5, nama: 'Kopi Sachet 20 x 25 g', satuan: 'Dus', harga: 150000 },
  { id: 6, nama: 'Air Mineral 600 ml', satuan: 'Dus', harga: 45000 },
  { id: 7, nama: 'Teh Kotak 300 ml', satuan: 'Dus', harga: 65000 },
];

// State simulasi
const searchQuery = ref('');
const uangDiterima = ref();

// Keranjang (Faktur)
const keranjang = ref([
  { id: 2, nama: 'Gula Pasir Kemasan 1Kg', satuan: 'Karung', qty: 2, harga: 825000, subtotal: 1650000 },
  { id: 1, nama: 'Minyak Goreng Sawit 2L', satuan: 'Karton', qty: 1, harga: 185000, subtotal: 185000 },
  { id: 5, nama: 'Kopi Sachet 20 x 25 g', satuan: 'Dus', qty: 1, harga: 150000, subtotal: 150000 }
]);

// State untuk Diskon
const diskonRupiah = ref(0);
const diskonPersen = ref(0);

// ==========================================
// LOGIKA AUTOCOMPLETE & MANAJEMEN FAKTUR
// ==========================================
const hasilPencarian = computed(() => {
  if (searchQuery.value === '') return [];
  const query = searchQuery.value.toLowerCase();
  return masterBarangGrosir.filter(item => item.nama.toLowerCase().includes(query));
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
  const barangAda = keranjang.value.find(b => b.id === item.id);
  
  if (barangAda) {
    barangAda.qty += 1;
    barangAda.subtotal = barangAda.qty * barangAda.harga;
  } else {
    keranjang.value.unshift({
      id: item.id,
      nama: item.nama,
      satuan: item.satuan,
      qty: 1,
      harga: item.harga,
      subtotal: item.harga
    });
  }
  
  searchQuery.value = '';
  sinkronisasiDiskon();
};

// ==========================================
// KENDALI KUANTITAS (Hanya Ketik Manual)
// ==========================================
const updateQtyManual = (index) => {
  // Cegah input kosong, negatif, atau nol. Default ke 1 jika dihapus.
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
</script>

<template>
  <div class="flex h-screen w-full bg-white font-sans text-slate-800 overflow-hidden">
    
    <!-- SIDEBAR -->
    <aside class="w-64 bg-slate-50 border-r border-slate-200 flex flex-col justify-between flex-shrink-0">
      <div>
        <div class="p-5 flex items-center gap-3 border-b border-slate-200">
          <div class="bg-blue-600 text-white p-2 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <h2 class="text-sm font-bold leading-tight text-slate-800">Koperasi Tribuana IV</h2>
            <p class="text-xs text-slate-500 m-0">Swalayan & Grosir</p>
          </div>
        </div>

        <nav class="p-3 flex flex-col gap-1">
          <a href="#" class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Dashboard
          </a>
          <a href="#" class="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            Kasir Grosir
          </a>
        </nav>
      </div>

      <div class="p-4 border-t border-slate-200">
        <div class="px-3 py-2.5 bg-slate-200 rounded-lg mb-2">
          <p class="text-sm font-bold text-slate-800 m-0">Admin</p>
          <p class="text-xs text-slate-500 m-0">Semua Akses</p>
        </div>
        <button class="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Keluar
        </button>
      </div>
    </aside>

    <!-- KONTEN UTAMA -->
    <main class="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      
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
                  :key="item.id"
                  @click="tambahKeFaktur(item)"
                  class="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 flex justify-between items-center transition-colors"
                >
                  <div>
                    <span class="font-medium text-slate-800">{{ item.nama }}</span>
                    <span class="text-xs text-slate-500 ml-2">({{ item.satuan }})</span>
                  </div>
                  <span class="text-sm font-bold text-slate-600">{{ formatRupiah(item.harga) }}</span>
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

          <div class="mt-2">
            <button 
              class="w-full font-bold py-3 text-sm rounded transition-colors"
              :class="(uangDiterima >= totalBelanjaAkhir && keranjang.length > 0) ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' : 'bg-slate-300 text-slate-500 cursor-not-allowed'"
              :disabled="uangDiterima < totalBelanjaAkhir || keranjang.length === 0"
            >
              Terbitkan Faktur
            </button>
            <p class="text-center text-[10px] text-slate-400 mt-1">Tekan F2 untuk jalan pintas</p>
          </div>

        </div>

      </div>
    </main>
  </div>
</template>
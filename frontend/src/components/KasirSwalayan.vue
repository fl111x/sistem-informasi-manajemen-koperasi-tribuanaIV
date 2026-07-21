<script setup>
import { ref, computed } from 'vue';

// State simulasi
const searchQuery = ref('');
const uangDiterima = ref();

// Data keranjang dummy
const keranjang = ref([
  { nama: 'Minyak Goreng Sawit 2L', qty: 2, harga: 32000, subtotal: 64000 },
  { nama: 'Beras Premium 5 Kg', qty: 1, harga: 68000, subtotal: 68000 },
  { nama: 'Gula Pasir Kemasan 1Kg', qty: 4, harga: 17000, subtotal: 68000 }
]);

// State untuk Diskon
const diskonRupiah = ref(0);
const diskonPersen = ref(0);

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

// Fungsi Sinkronisasi Diskon
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
  <!-- PERHATIKAN: Tidak ada lagi <aside> (Sidebar) dan div h-screen di sini -->
  <!-- Komponen langsung dimulai dari tag <main> -->
  <main class="flex-1 flex flex-col h-full w-full bg-slate-50 overflow-hidden">
    
    <!-- Header dirapatkan -->
    <header class="px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0">
      <h1 class="text-xl font-bold text-slate-800">Kasir Swalayan</h1>
      <p class="text-sm text-slate-500">Kasir penjualan eceran. Pindai barcode lalu tekan Enter.</p>
    </header>

    <!-- Area Transaksi -->
    <div class="flex-1 flex p-5 gap-5 overflow-hidden">
      
      <!-- Kiri: Tabel Barang -->
      <div class="flex-1 flex flex-col h-full border border-slate-300 bg-white rounded-lg shadow-sm overflow-hidden">
        <div class="p-3 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            v-model="searchQuery"
            placeholder="Scan barcode / cari barang..." 
            class="w-full bg-transparent border-none focus:outline-none text-base text-slate-800"
            autofocus
          >
        </div>

        <div class="flex-1 overflow-auto">
          <table class="w-full text-left text-sm text-slate-600">
            <thead class="bg-slate-100 text-slate-700 uppercase font-semibold text-xs sticky top-0 border-b border-slate-200">
              <tr>
                <th class="px-4 py-2.5 w-1/2">Barang</th>
                <th class="px-4 py-2.5 w-1/6 text-center">Qty</th>
                <th class="px-4 py-2.5 w-1/6 text-right">Harga</th>
                <th class="px-4 py-2.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="keranjang.length === 0">
                <td colspan="4" class="px-4 py-10 text-center text-slate-400">Keranjang kosong.</td>
              </tr>
              <tr v-else class="border-b border-slate-100 hover:bg-slate-50 transition-colors" v-for="(item, index) in keranjang" :key="index">
                <td class="px-4 py-2 font-medium text-slate-800">{{ item.nama }}</td>
                <td class="px-4 py-2 text-center">{{ item.qty }}</td>
                <td class="px-4 py-2 text-right">{{ formatRupiah(item.harga) }}</td>
                <td class="px-4 py-2 text-right font-bold text-slate-800">{{ formatRupiah(item.subtotal) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Kanan: Panel Pembayaran -->
      <div class="w-[380px] flex flex-col h-full bg-white border border-slate-300 rounded-lg shadow-sm p-4 justify-between">
        
        <div class="flex flex-col gap-3">
          <h3 class="text-base font-bold text-slate-800 border-b border-slate-200 pb-1">Pembayaran</h3>

          <!-- Ringkasan -->
          <div class="flex justify-between items-center text-slate-600 text-sm">
            <span>Total item</span>
            <span class="font-bold text-slate-800">{{ keranjang.length }}</span>
          </div>
          <div class="flex justify-between items-center text-slate-600 text-sm border-b border-slate-100 pb-2">
            <span>Subtotal Barang</span>
            <span class="font-bold text-slate-800">{{ formatRupiah(subtotalBelanja) }}</span>
          </div>

          <!-- Diskon -->
          <div>
            <label class="text-xs font-semibold text-slate-800 block mb-1">Diskon (Otomatis Terhitung)</label>
            <div class="flex gap-2">
              <div class="relative w-2/3">
                <span class="absolute left-2.5 top-1.5 text-slate-400 text-sm font-bold">Rp</span>
                <input 
                  type="number" v-model="diskonRupiah" @input="hitungDariRupiah" min="0"
                  class="w-full border border-slate-300 pl-8 pr-2 py-1.5 rounded text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-600"
                >
              </div>
              <div class="relative w-1/3">
                <input 
                  type="number" v-model="diskonPersen" @input="hitungDariPersen" min="0" max="100" step="0.01"
                  class="w-full border border-slate-300 pl-2 pr-6 py-1.5 rounded text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-600"
                >
                <span class="absolute right-2.5 top-1.5 text-slate-400 text-sm font-bold">%</span>
              </div>
            </div>
          </div>

          <!-- TOTAL AKHIR -->
          <div class="flex justify-between items-end bg-blue-50 p-3 rounded border border-blue-100">
            <span class="text-blue-800 text-xs font-bold pb-1">TOTAL BAYAR</span>
            <span class="text-2xl font-black text-blue-600">{{ formatRupiah(totalBelanjaAkhir) }}</span>
          </div>

          <!-- Uang Diterima -->
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-800">Uang Diterima</label>
            <input 
              type="number" v-model="uangDiterima"
              class="w-full border border-slate-300 p-2 rounded text-right text-base font-bold focus:outline-none focus:border-blue-600 bg-slate-50"
              placeholder="0"
            >
          </div>

          <!-- Tombol Nominal -->
          <div class="grid grid-cols-4 gap-1.5">
            <button @click="setUang('Pas')" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold py-1.5 rounded border border-slate-300">Uang Pas</button>
            <button @click="setUang(50000)" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold py-1.5 rounded border border-slate-300">50 Ribu</button>
            <button @click="setUang(100000)" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold py-1.5 rounded border border-slate-300">100 Ribu</button>
            <button @click="setUang(200000)" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold py-1.5 rounded border border-slate-300">200 Ribu</button>
          </div>

          <!-- Kembalian -->
          <div class="flex justify-between items-center bg-slate-100 p-3 rounded border border-slate-200">
            <span class="text-sm font-semibold text-slate-600">Kembalian</span>
            <span class="text-lg font-bold text-slate-800">{{ formatRupiah(kembalian) }}</span>
          </div>
        </div>

        <!-- Tombol Cetak -->
        <div class="mt-2">
          <button 
            class="w-full font-bold py-3 text-sm rounded transition-colors"
            :class="uangDiterima >= totalBelanjaAkhir ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' : 'bg-slate-300 text-slate-500 cursor-not-allowed'"
            :disabled="uangDiterima < totalBelanjaAkhir"
          >
            Bayar & Cetak Struk
          </button>
          <p class="text-center text-[10px] text-slate-400 mt-1">Tekan F2 untuk jalan pintas</p>
        </div>

      </div>

    </div>
  </main>
</template>
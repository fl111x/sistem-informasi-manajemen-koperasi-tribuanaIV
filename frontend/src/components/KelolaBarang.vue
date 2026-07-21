<script setup>
import { ref, computed } from 'vue';

// State untuk form filter
const searchQuery = ref('');
const kategoriTerpilih = ref('Semua kategori');

// ==========================================
// MOCK DATA: Database Kelola Barang
// ==========================================
const daftarBarang = ref([
  { kode: 'BRG-0001', barcode: '8991002101010', nama: 'Beras Premium 5 kg', kategori: 'Sembako', eceran: 68000, grosir: 64000, minGrosir: '10 Sak', stok: 240 },
  { kode: 'BRG-0002', barcode: '8991002102027', nama: 'Minyak Goreng 2 L', kategori: 'Sembako', eceran: 38000, grosir: 35500, minGrosir: '12 Pouch', stok: 180 },
  { kode: 'BRG-0003', barcode: '8991002103034', nama: 'Gula Pasir 1 kg', kategori: 'Sembako', eceran: 16500, grosir: 15200, minGrosir: '20 Pak', stok: 95 },
  { kode: 'BRG-0004', barcode: '8991002104041', nama: 'Teh Kotak 300 ml', kategori: 'Minuman', eceran: 4500, grosir: 3900, minGrosir: '24 Dus', stok: 620 },
  { kode: 'BRG-0005', barcode: '8991002105058', nama: 'Kopi Sachet 20 x 25 g', kategori: 'Minuman', eceran: 12500, grosir: 11400, minGrosir: '12 Renceng', stok: 34 }, // Stok tipis
  { kode: 'BRG-0006', barcode: '8991002106065', nama: 'Air Mineral 600 ml', kategori: 'Minuman', eceran: 3500, grosir: 2900, minGrosir: '48 Botol', stok: 1240 },
  { kode: 'BRG-0007', barcode: '8991002107072', nama: 'Biskuit Kaleng 700 g', kategori: 'Makanan Ringan', eceran: 42000, grosir: 39000, minGrosir: '6 Kaleng', stok: 78 },
  { kode: 'BRG-0008', barcode: '8991002108089', nama: 'Mie Instan Goreng', kategori: 'Makanan Ringan', eceran: 3200, grosir: 2750, minGrosir: '40 Pcs', stok: 860 },
  { kode: 'BRG-0009', barcode: '8991002109096', nama: 'Sabun Mandi Batang', kategori: 'Perawatan Diri', eceran: 4800, grosir: 4200, minGrosir: '24 Pcs', stok: 410 },
  { kode: 'BRG-0010', barcode: '8991002110103', nama: 'Pasta Gigi 190 g', kategori: 'Perawatan Diri', eceran: 15000, grosir: 13500, minGrosir: '12 Pcs', stok: 22 }, // Stok tipis
  { kode: 'BRG-0011', barcode: '8991002111115', nama: 'Deterjen Bubuk 800 g', kategori: 'Kebutuhan Rumah', eceran: 22000, grosir: 20000, minGrosir: '12 Pak', stok: 130 },
  { kode: 'BRG-0012', barcode: '8991002112122', nama: 'Buku Tulis 38 lembar', kategori: 'ATK', eceran: 4000, grosir: 3300, minGrosir: '50 Pcs', stok: 540 },
]);

// Fungsi Filter
const dataDitampilkan = computed(() => {
  return daftarBarang.value.filter((item) => {
    const cocokKataKunci = item.nama.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                           item.kode.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                           item.barcode.includes(searchQuery.value);
    const cocokKategori = kategoriTerpilih.value === 'Semua kategori' || item.kategori === kategoriTerpilih.value;
    return cocokKataKunci && cocokKategori;
  });
});

const formatRupiah = (angka) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
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
      <button class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        Tambah Barang
      </button>
    </header>

    <!-- Toolbar Pencarian & Filter -->
    <div class="px-8 py-4 border-b border-slate-100 flex gap-4 bg-slate-50 flex-shrink-0">
      <div class="relative flex-1">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input type="text" v-model="searchQuery" placeholder="Cari nama, kode, atau barcode..." class="w-full border border-slate-300 pl-10 pr-4 py-2 rounded-md text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white">
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
              <th class="px-5 py-4">Kode / Barcode</th>
              <th class="px-5 py-4">Nama Barang</th>
              <th class="px-5 py-4">Kategori</th>
              <th class="px-5 py-4 text-right">Eceran</th>
              <th class="px-5 py-4 text-right">Grosir</th>
              <th class="px-5 py-4 text-center">Min Grosir</th>
              <th class="px-5 py-4 text-center">Stok</th>
              <th class="px-5 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="dataDitampilkan.length === 0">
              <td colspan="8" class="px-5 py-12 text-center text-slate-400">Barang tidak ditemukan.</td>
            </tr>
            <tr v-else v-for="(item, index) in dataDitampilkan" :key="index" class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td class="px-5 py-3"><div class="flex flex-col"><span class="font-bold text-slate-800">{{ item.kode }}</span><span class="text-xs text-slate-400">{{ item.barcode }}</span></div></td>
              <td class="px-5 py-3 font-medium text-slate-800">{{ item.nama }}</td>
              <td class="px-5 py-3 text-slate-500">{{ item.kategori }}</td>
              <td class="px-5 py-3 text-right text-slate-700">{{ formatRupiah(item.eceran) }}</td>
              <td class="px-5 py-3 text-right text-slate-700">{{ formatRupiah(item.grosir) }}</td>
              <td class="px-5 py-3 text-center text-slate-500">{{ item.minGrosir }}</td>
              <td class="px-5 py-3 text-center font-semibold"><span class="inline-block px-2 py-1 rounded text-xs" :class="item.stok <= 50 ? 'bg-red-50 text-red-600' : 'text-slate-700'">{{ item.stok }}</span></td>
              <td class="px-5 py-3 text-center">
                <button class="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> Edit
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="mt-4 text-xs text-slate-500">Menampilkan {{ dataDitampilkan.length }} dari {{ daftarBarang.length }} barang.</div>
    </div>
  </main>
</template>
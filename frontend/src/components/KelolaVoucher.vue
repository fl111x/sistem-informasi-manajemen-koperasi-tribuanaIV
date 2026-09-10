<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const isLoading = ref(false);
const isSaving = ref(false);
const isDistributing = ref(false);

const statistik = ref({
  total_anggota: 0,
  total_saldo_voucher: 0
});

const pengaturan = ref({
  tanggal_distribusi: 1,
  nominal_voucher: 100000,
  is_otomatis: 'aktif',
  terakhir_distribusi: null
});

const riwayat = ref([]);

// Modals & Notifications
const isNotifModalOpen = ref(false);
const notifTitle = ref('Pemberitahuan');
const notifMessage = ref('');

const tampilkanNotif = (title, message) => {
  notifTitle.value = title;
  notifMessage.value = message;
  isNotifModalOpen.value = true;
};
const tutupNotif = () => isNotifModalOpen.value = false;

const isConfirmModalOpen = ref(false);

const formatRupiah = (angka) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
};

const formatTanggal = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const fetchVoucherData = async () => {
  try {
    isLoading.value = true;
    const [resPengaturan, resRiwayat] = await Promise.all([
      api.get('/voucher/pengaturan'),
      api.get('/voucher/riwayat')
    ]);

    if (resPengaturan.data) {
      pengaturan.value = resPengaturan.data.pengaturan || pengaturan.value;
      statistik.value = resPengaturan.data.statistik || statistik.value;
    }
    if (resRiwayat.data) {
      riwayat.value = resRiwayat.data.data || [];
    }
  } catch (error) {
    console.error('Error fetching voucher data:', error);
    tampilkanNotif('Gagal', 'Gagal memuat data pengaturan voucher.');
  } finally {
    isLoading.value = false;
  }
};

const simpanPengaturan = async () => {
  try {
    isSaving.value = true;
    await api.put('/voucher/pengaturan', pengaturan.value);
    tampilkanNotif('Berhasil', 'Pengaturan jadwal distribusi otomatis berhasil diperbarui.');
    await fetchVoucherData();
  } catch (error) {
    console.error('Error saving voucher settings:', error);
    tampilkanNotif('Gagal', error.response?.data?.message || 'Gagal menyimpan pengaturan.');
  } finally {
    isSaving.value = false;
  }
};

const bukaModalKonfirmasi = () => {
  isConfirmModalOpen.value = true;
};
const tutupModalKonfirmasi = () => {
  isConfirmModalOpen.value = false;
};

const eksekusiDistribusiManual = async () => {
  try {
    tutupModalKonfirmasi();
    isDistributing.value = true;
    const res = await api.post('/voucher/distribusi', { metode: 'Manual' });
    tampilkanNotif('Berhasil', res.data?.message || 'Voucher bulanan berhasil dibagikan.');
    await fetchVoucherData();
  } catch (error) {
    console.error('Error executing manual distribution:', error);
    tampilkanNotif('Gagal', error.response?.data?.message || 'Gagal mendistribusikan voucher.');
  } finally {
    isDistributing.value = false;
  }
};

onMounted(() => {
  fetchVoucherData();
});
</script>

<template>
  <main class="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 w-full">
    
    <!-- Header -->
    <header class="px-8 py-6 bg-white border-b border-slate-200 flex justify-between items-center flex-shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Kelola & Distribusi Voucher</h1>
        <p class="text-sm text-slate-500 mt-1">Konfigurasi jadwal distribusi otomatis bulanan dan riwayat pembagian voucher anggota.</p>
      </div>
      <div>
        <button @click="bukaModalKonfirmasi" :disabled="isDistributing || statistik.total_anggota === 0" class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 px-5 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          <span v-if="isDistributing">Memproses...</span>
          <span v-else>Bagikan Voucher Sekarang (Manual)</span>
        </button>
      </div>
    </header>

    <div class="flex-1 overflow-auto p-8 flex flex-col gap-6">
      
      <!-- Cards Summary -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div class="p-3.5 bg-blue-100 text-blue-600 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Anggota Penerima</p>
            <p class="text-2xl font-bold text-slate-800 mt-1">{{ statistik.total_anggota }} <span class="text-sm font-normal text-slate-500">Anggota</span></p>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div class="p-3.5 bg-emerald-100 text-emerald-600 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Nominal Jatah Bulanan</p>
            <p class="text-2xl font-bold text-slate-800 mt-1">{{ formatRupiah(pengaturan.nominal_voucher) }}</p>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div class="p-3.5 bg-purple-100 text-purple-600 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Saldo Beredar</p>
            <p class="text-2xl font-bold text-slate-800 mt-1">{{ formatRupiah(statistik.total_saldo_voucher) }}</p>
          </div>
        </div>

      </div>

      <!-- Section Pengaturan Otomatis -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div class="border-b border-slate-100 pb-4 mb-6 flex justify-between items-center">
          <div>
            <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Jadwal Distribusi Otomatis Bulanan
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">Sistem akan secara otomatis menambahkan jatah voucher ke seluruh anggota aktif pada tanggal yang ditentukan setiap bulan.</p>
          </div>
          <span :class="['px-3 py-1 text-xs font-bold uppercase rounded-full', pengaturan.is_otomatis === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500']">
            {{ pengaturan.is_otomatis === 'aktif' ? 'Otomatis Aktif' : 'Otomatis Nonaktif' }}
          </span>
        </div>

        <form @submit.prevent="simpanPengaturan" class="flex flex-col gap-6">
          
          <!-- Visual Date Selector Grid -->
          <div>
            <div class="flex justify-between items-center mb-3">
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Pilih Tanggal Pembagian Rutin Bulanan (Visual Date Selector)
              </label>
              <span class="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Terpilih: Tanggal {{ pengaturan.tanggal_distribusi }} Setiap Bulan
              </span>
            </div>

            <!-- Grid Hari 1 - 28 -->
            <div class="grid grid-cols-7 sm:grid-cols-14 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <button 
                type="button"
                v-for="d in 28" 
                :key="d"
                @click="pengaturan.tanggal_distribusi = d"
                :class="[
                  'py-2.5 px-2 text-xs rounded-lg font-bold transition-all flex flex-col items-center justify-center border',
                  pengaturan.tanggal_distribusi === d
                    ? 'bg-indigo-600 text-white shadow-md border-indigo-700 ring-2 ring-indigo-300 scale-105 z-10'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
                ]"
              >
                <span class="text-[10px] opacity-75 font-normal">Tgl</span>
                <span class="text-sm font-extrabold">{{ d }}</span>
              </button>
            </div>
          </div>

          <!-- Banner Informatif Tanggal Terpilih -->
          <div class="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-4">
            <div class="p-3 bg-indigo-600 text-white rounded-xl flex-shrink-0 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div class="flex-1 text-xs leading-relaxed text-slate-700">
              Sistem akan otomatis mendistribusikan jatah voucher 
              <strong class="text-indigo-700 font-bold">{{ formatRupiah(pengaturan.nominal_voucher) }}</strong> 
              ke seluruh <strong class="text-indigo-700 font-bold">{{ statistik.total_anggota }} anggota aktif</strong> 
              setiap tanggal <strong class="text-indigo-700 font-bold">{{ pengaturan.tanggal_distribusi }}</strong> bulan berjalan.
            </div>
          </div>

          <!-- Settings Bar: Nominal & Status -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center border-t border-slate-100 pt-4">
            
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Nominal Voucher Per Anggota (Rp)</label>
              <div class="relative">
                <span class="absolute left-3.5 top-2.5 text-slate-400 font-semibold text-sm">Rp</span>
                <input type="number" v-model.number="pengaturan.nominal_voucher" step="10000" min="10000" class="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white">
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Status Pembagian Otomatis</label>
              <div class="flex gap-4 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                <label :class="['flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md cursor-pointer text-xs font-bold transition-all', pengaturan.is_otomatis === 'aktif' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200']">
                  <input type="radio" value="aktif" v-model="pengaturan.is_otomatis" class="sr-only">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  Otomatis Aktif
                </label>
                <label :class="['flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md cursor-pointer text-xs font-bold transition-all', pengaturan.is_otomatis === 'nonaktif' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200']">
                  <input type="radio" value="nonaktif" v-model="pengaturan.is_otomatis" class="sr-only">
                  Nonaktifkan
                </label>
              </div>
            </div>

          </div>

          <div class="flex justify-between items-center border-t border-slate-100 pt-4">
            <p class="text-xs text-slate-500">
              Terakhir didistribusikan: <strong class="text-slate-700">{{ pengaturan.terakhir_distribusi ? formatTanggal(pengaturan.terakhir_distribusi) : 'Belum Pernah' }}</strong>
            </p>
            <button type="submit" :disabled="isSaving" class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors shadow-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              <span v-if="isSaving">Menyimpan...</span>
              <span v-else>Simpan Jadwal Otomatis</span>
            </button>
          </div>

        </form>
      </div>

      <!-- Section Tabel Riwayat Distribusi -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex-1 flex flex-col">
        <h2 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Riwayat Distribusi Voucher
        </h2>

        <div class="flex-1 overflow-auto border border-slate-200 rounded-lg">
          <table class="w-full text-left text-sm text-slate-600">
            <thead class="bg-slate-100 text-slate-600 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th class="px-5 py-3.5">Waktu Distribusi</th>
                <th class="px-5 py-3.5">Bulan / Periode</th>
                <th class="px-5 py-3.5 text-center">Jumlah Penerima</th>
                <th class="px-5 py-3.5 text-right">Total Nominal</th>
                <th class="px-5 py-3.5 text-center">Metode</th>
                <th class="px-5 py-3.5">Eksekutor</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoading">
                <td colspan="6" class="px-5 py-8 text-center text-slate-400">Memuat riwayat...</td>
              </tr>
              <tr v-else-if="riwayat.length === 0">
                <td colspan="6" class="px-5 py-8 text-center text-slate-400">Belum ada riwayat distribusi voucher.</td>
              </tr>
              <tr v-else v-for="item in riwayat" :key="item.id_log" class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td class="px-5 py-3 font-medium text-slate-800">{{ formatTanggal(item.tanggal_distribusi) }}</td>
                <td class="px-5 py-3 text-slate-700 font-semibold">{{ item.bulan_tahun }}</td>
                <td class="px-5 py-3 text-center font-bold text-slate-800">{{ item.jumlah_penerima }} Anggota</td>
                <td class="px-5 py-3 text-right font-bold text-emerald-600">{{ formatRupiah(item.total_nominal) }}</td>
                <td class="px-5 py-3 text-center">
                  <span :class="['px-2.5 py-0.5 text-[10px] font-bold uppercase rounded', item.metode === 'Otomatis' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700']">
                    {{ item.metode }}
                  </span>
                </td>
                <td class="px-5 py-3 text-slate-600">{{ item.eksekutor }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- Modal Konfirmasi Distribusi Manual -->
    <div v-if="isConfirmModalOpen" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in duration-150">
        <div class="flex items-center gap-3 text-indigo-600 mb-4">
          <div class="p-3 bg-indigo-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h3 class="text-lg font-bold text-slate-800">Konfirmasi Distribusi Voucher</h3>
        </div>
        <p class="text-sm text-slate-600 mb-6 leading-relaxed">
          Apakah Anda yakin ingin membagikan voucher sebesar <strong>{{ formatRupiah(pengaturan.nominal_voucher) }}</strong> ke seluruh <strong>{{ statistik.total_anggota }} anggota aktif</strong> sekarang secara manual?
        </p>
        <div class="flex justify-end gap-3">
          <button @click="tutupModalKonfirmasi" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            Batal
          </button>
          <button @click="eksekusiDistribusiManual" class="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors">
            Ya, Bagikan Sekarang
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Notifikasi -->
    <div v-if="isNotifModalOpen" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 border border-slate-200">
        <h3 class="text-lg font-bold text-slate-800 mb-2">{{ notifTitle }}</h3>
        <p class="text-sm text-slate-600 mb-6">{{ notifMessage }}</p>
        <div class="flex justify-end">
          <button @click="tutupNotif" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>

  </main>
</template>

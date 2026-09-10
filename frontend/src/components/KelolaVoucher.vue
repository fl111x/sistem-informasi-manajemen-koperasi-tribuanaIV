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
const isDatePickerOpen = ref(false);

const pilihTanggal = (d) => {
  pengaturan.value.tanggal_distribusi = d;
  isDatePickerOpen.value = false;
};

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

      <!-- Section Status Otomatis & Informasi System -->
      <div class="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl shadow-lg p-6 sm:p-8 relative overflow-hidden">
        <!-- Background Decorative Circles -->
        <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div class="absolute right-40 -top-10 w-48 h-48 bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Sistem Distribusi Otomatis Aktif
            </div>
            <h2 class="text-xl sm:text-2xl font-bold tracking-tight">Distribusi Voucher Rutin Rp 100.000 / Bulan</h2>
            <p class="text-xs sm:text-sm text-indigo-200 mt-1.5 max-w-2xl leading-relaxed">
              Voucher sebesar <strong>Rp 100.000</strong> dibagikan secara <strong>otomatis oleh sistem setiap tanggal 1 awal bulan</strong> kepada seluruh <strong>{{ statistik.total_anggota }} anggota aktif</strong> tanpa perlu diinput manual.
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-shrink-0">
            <button @click="bukaModalKonfirmasi" :disabled="isDistributing || statistik.total_anggota === 0" class="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-3 px-5 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2.5 text-sm cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <span v-if="isDistributing">Memproses...</span>
              <span v-else>Bagikan Voucher Sekarang (Manual)</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-indigo-700/50 pt-5 mt-6 relative z-10 text-xs">
          <div class="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
            <div class="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <p class="text-indigo-300 text-[10px] uppercase tracking-wider font-semibold">Jadwal Rutin Sistem</p>
              <p class="font-bold text-white mt-0.5">Setiap Tanggal 1 Awal Bulan</p>
            </div>
          </div>

          <div class="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
            <div class="p-2 bg-emerald-500/20 text-emerald-300 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p class="text-indigo-300 text-[10px] uppercase tracking-wider font-semibold">Jatah Nominal Bulanan</p>
              <p class="font-bold text-white mt-0.5">Rp 100.000 / Anggota Aktif</p>
            </div>
          </div>

          <div class="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
            <div class="p-2 bg-purple-500/20 text-purple-300 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p class="text-indigo-300 text-[10px] uppercase tracking-wider font-semibold">Terakhir Didistribusikan</p>
              <p class="font-bold text-white mt-0.5">{{ pengaturan.terakhir_distribusi ? formatTanggal(pengaturan.terakhir_distribusi) : 'Belum Pernah' }}</p>
            </div>
          </div>
        </div>
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

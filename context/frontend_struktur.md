# Dokumentasi Struktur Frontend Koperasi Tribuana IV

Dokumen ini menjelaskan arsitektur, teknologi, dan struktur direktori untuk bagian *Frontend* (Antarmuka Pengguna) dari Sistem Informasi Manajemen Koperasi Tribuana IV.

## 1. Teknologi Utama (Tech Stack)
Aplikasi frontend ini dibangun menggunakan ekosistem pengembangan web modern:
- **Vue.js 3**: Framework *frontend* utama menggunakan *Composition API* (`<script setup>`).
- **Vite**: *Build tool* dan *dev server* yang cepat.
- **Tailwind CSS**: Framework *utility-first CSS* untuk mendesain antarmuka secara langsung dari dalam file komponen (UI/UX).
- **Vue Router**: Untuk manajemen *routing* (navigasi antar halaman) pada aplikasi *Single Page Application* (SPA).
- **Pinia**: *State management* (menggantikan Vuex), digunakan khusus untuk mengelola data otentikasi (sesi login user).
- **Axios**: *HTTP Client* untuk melakukan komunikasi API (Request/Response) dengan *backend*.

---

## 2. Struktur Folder
Direktori utama untuk kode *frontend* berada di `frontend/src/`. Berikut adalah penjelasan masing-masing foldernya:

```text
frontend/src/
├── assets/          # (Jika ada) Untuk menyimpan gambar statis, ikon, atau font.
├── components/      # Kumpulan komponen antarmuka (UI) / Halaman (Pages).
├── services/        # Konfigurasi komunikasi API (Axios).
├── stores/          # Konfigurasi Pinia untuk state global (Misal: auth.js).
├── App.vue          # Komponen akar (Root component) Vue.
├── main.js          # Titik masuk utama (Entry point) aplikasi Vue.
├── router.js        # Konfigurasi rute navigasi aplikasi.
└── style.css        # File global CSS (Konfigurasi import Tailwind).
```

---

## 3. Penjelasan Direktori Spesifik

### A. Komponen / Halaman (`src/components/`)
Aplikasi ini tidak memisahkan antara folder `views/` dan `components/`, semua halaman modular disimpan di dalam direktori `components`.

**1. Fondasi & Tata Letak (Layouts):**
- **`AdminLayout.vue`**: Berfungsi sebagai *wrapper* utama setelah user *login*. Memiliki desain *Sidebar* (kiri) untuk navigasi dan area konten utama (kanan) menggunakan `<router-view>`. Menampilkan menu secara kondisional berdasarkan hak akses (`user.nama_role`).
- **`HalamanLogin.vue`**: Halaman otentikasi awal. Menerima *username* dan *password*, menyimpannya ke `localStorage` dan Pinia *store* via *backend API*.
- **`DashboardKoperasi.vue`**: Halaman utama (beranda) yang menampilkan ringkasan performa penjualan harian, grafik omzet, histori transaksi terbaru, serta **Peringatan Stok Kritis**.

**2. Modul Kasir (Point of Sales):**
- **`KasirSwalayan.vue`**: Antarmuka mesin kasir untuk pembelian eceran (Swalayan). Memiliki dukungan pemindaian *barcode*, pencarian nama, pengelolaan keranjang (dengan penyimpanan *auto-save* lokal), perhitungan diskon/kembalian otomatis, notifikasi sisa stok pada tabel, dan fitur otorisasi **Void** dengan PIN Supervisor.
- **`KasirGrosir.vue`**: Sama dengan Kasir Swalayan, namun ditujukan untuk transaksi partai (Grosir) dengan satuan yang berbeda (Misal: Dus, Karton) dan perhitungan harga grosir.

**3. Modul Master Data (CRUD):**
- **`KelolaBarang.vue`**: Halaman khusus admin/gudang untuk mengatur *master data* barang, mengatur harga dasar, harga jual (eceran/grosir), stok awal, dan stok minimal.
- **`KelolaAnggota.vue`**: Manajemen data anggota koperasi. Berisi atribut profil keprajuritan/pegawai (NRP/NIP, Pangkat). Database anggota ini penting untuk perhitungan SHU di akhir.
- **`KelolaSupplier.vue`**: Manajemen profil mitra pemasok/supplier.
- **`KelolaPengguna.vue`**: Manajemen data sistem akun (*users*) dan peran hak akses (*roles*). Hanya dapat diakses oleh "Administrator".

**4. Modul Operasional & Laporan:**
- **`PembelianGudang.vue`**: Halaman untuk menerbitkan Dokumen *Purchase Order* (PO) kepada Supplier. Dilengkapi fungsi **Mutasi Stok Fisik** yang akan mengubah status "Menunggu" menjadi "Diterima/Dimutasi" yang otomatis akan menambah kuantitas barang di database.
- **`LaporanAkuntansi.vue`**: Merangkum laporan **Riwayat Belanja Anggota** (berdasarkan NRP) serta dilengkapi kalkulator pintar simulasi pembagian **SHU (Sisa Hasil Usaha)** secara proporsional.

---

### B. Konfigurasi Layanan API (`src/services/`)
- **`api.js`**: Menggunakan `axios.create()` untuk mengatur konfigurasi dasar. Secara otomatis menyematkan *Token Otentikasi (JWT)* pada header `Authorization: Bearer <token>` untuk setiap aktivitas *request* yang dipanggil oleh komponen. Base URL API didefinisikan ke alamat *Backend* (Misal: `http://localhost:3000/api`).

### C. Manajemen Rute Navigasi (`src/router.js`)
File ini mendefinisikan URL *path* yang sesuai dengan masing-masing komponen, misalnya:
- `/` diarahkan ke `DashboardKoperasi`.
- `/kasir-swalayan` diarahkan ke `KasirSwalayan`.
- `/login` diarahkan ke `HalamanLogin`.

*Router* ini dilengkapi sistem proteksi otomatis (*navigation guards*). Jika seorang *user* mencoba mengakses halaman (URL) tertentu namun tidak memiliki *token login*, maka ia akan ditendang kembali ke halaman `/login`.

### D. Manajemen State Lokal (`src/stores/`)
- **`auth.js`**: Digunakan untuk menyimpan informasi login secara dinamis tanpa me-*refresh* aplikasi. Bertugas memvalidasi *role* dari token, memastikan siapa yang sedang mengoperasikan sistem (Kasir vs Gudang vs Admin).

---

## 4. Pola Pengembangan (Development Workflow)
Jika ada developer baru yang ingin melanjutkan proyek ini, langkah kerjanya:
1. Pahami struktur `API_DOCS.md` di *backend* untuk tahu apa *request* dan *response* yang tersedia.
2. Jika butuh halaman baru, buatlah `NamaHalamanBaru.vue` di `src/components/`.
3. Daftarkan di `src/router.js`.
4. Jika halaman itu butuh diakses dari menu kiri, tambahkan pintasan (`<router-link>`) di `src/components/AdminLayout.vue`.
5. Semua konektivitas dengan database wajib menggunakan `import api from '../services/api'` agar tidak melanggar sekuritas token.

# DOKUMENTASI LENGKAP SISTEM INFORMASI MANAJEMEN KOPERASI TRIBUANA IV

Sistem Informasi Manajemen Koperasi Tribuana IV adalah aplikasi berbasis web modern yang dirancang khusus untuk mengelola operasional Koperasi Tribuana IV (Pusdiklatpassus Kopassus). Aplikasi ini mengintegrasikan seluruh unit usaha swalayan, toko grosir, manajemen pergudangan, pengelolaan data nominatif anggota (Militer, PNS, PPPK), otomatisasi distribusi voucher belanja bulanan, hingga pembukuan akuntansi dan laporan Sisa Hasil Usaha (SHU).

---

## 📋 DAFTAR ISI
1. [Deskripsi Umum Sistem](#1-deskripsi-umum-sistem)
2. [Teknologi & Arsitektur Perangkat Lunak](#2-teknologi--arsitektur-perangkat-lunak)
3. [Hak Akses & Peran Pengguna (Role Management)](#3-hak-akses--peran-pengguna-role-management)
4. [Alur & Cara Kerja Sistem (End-to-End Workflows)](#4-alur--cara-kerja-sistem-end-to-end-workflows)
   - [4.1 Alur Manajemen Anggota & Impor Otomatis Excel Nominatif](#41-alur-manajemen-anggota--impor-otomatis-excel-nominatif)
   - [4.2 Alur Distribusi & Penggunaan Voucher Belanja](#42-alur-distribusi--penggunaan-voucher-belanja)
   - [4.3 Alur Kasir Swalayan (POS Swalayan & Dual Payment)](#43-alur-kasir-swalayan-pos-swalayan--dual-payment)
   - [4.4 Alur Kasir Grosir (POS Grosir)](#44-alur-kasir-grosir-pos-grosir)
   - [4.5 Alur Manajemen Barang, Stok & Gudang](#45-alur-manajemen-barang-stok--gudang)
   - [4.6 Alur Pembelian Barang (Purchase Order & Supplier)](#46-alur-pembelian-barang-purchase-order--supplier)
   - [4.7 Alur Akuntansi, Laporan & SHU](#47-alur-akuntansi-laporan--shu)
5. [Skema & Struktur Database](#5-skema--struktur-database)
6. [Fitur Unggulan Sistem](#6-fitur-unggulan-sistem)
7. [Panduan Operasional Menjalankan Aplikasi](#7-panduan-operasional-menjalankan-aplikasi)

---

## 1. DESKRIPSI UMUM SISTEM

Koperasi Tribuana IV melayani ratusan anggota yang terdiri dari tiga kategori keanggotaan: **Militer**, **PNS (Pegawai Negeri Sipil)**, dan **PPPK (Pegawai Pemerintah dengan Perjanjian Kerja)**. 

Setiap bulan, anggota koperasi menerima jatah voucher belanja bulanan (sebesar Rp 100.000 per anggota aktif) yang dapat digunakan untuk berbelanja di Swalayan Koperasi maupun Toko Grosir Koperasi.

### **Tujuan Utama Sistem:**
1. **Otomatisasi Input Data Nominatif Anggota**: Menggantikan proses pencatatan manual satu per satu dengan fitur **Batch Import Excel Parser** yang dapat membaca file Excel nominatif bulanan secara instan dan mengklasifikasikan kategori Militer, PNS, dan PPPK secara presisi.
2. **Efisiensi Kasir & Dual-Payment**: Memungkinkan kasir swalayan dan grosir melakukan transaksi menggunakan kombinasi **Voucher Belanja + Tunai/QRIS/Transfer** dalam satu kali pembayaran.
3. **Pengelolaan Stok Ganda**: Mengelola barang dengan pemisahan harga dan stok antara unit Swalayan (ritel/pcs) dan unit Grosir (karton/dus).
4. **Otomatisasi Distribusi Voucher**: Membagikan jatah voucher Rp 100.000 secara otomatis di awal bulan dan memastikan sisa saldo voucher anggota lama tidak pernah terhapus atau mereset.
5. **Transparansi Akuntansi & SHU**: Menyediakan laporan penjualan harian/bulanan, laporan rekap voucher, laporan mutasi barang gudang, serta perhitungan SHU yang akurat.

---

## 2. TEKNOLOGI & ARSITEKTUR PERANGKAT LUNAK

Sistem ini dikembangkan dengan arsitektur **Client-Server (RESTful API)** yang terpisah antara Frontend dan Backend untuk kecepatan respons yang maksimal.

```
+-------------------------------------------------------+
|                FRONTEND (Vite + Vue 3)                |
| - TailwindCSS & Rich Custom Styling                   |
| - Axios REST Client with Auth Interceptor             |
| - SheetJS (XLSX) for Client-side Parsing & Export    |
+-------------------------------------------------------+
                           │
                    HTTP / REST API
                           │
+-------------------------------------------------------+
|               BACKEND (Express.js Node.js)            |
| - JWT Authentication & Cookie Middleware              |
| - MySQL Transaction Pool (mysql2/promise)             |
| - Automated Background Cron / Scheduler Task          |
+-------------------------------------------------------+
                           │
+-------------------------------------------------------+
|                 DATABASE (MySQL / MariaDB)            |
| Database Name: db_koperasi                            |
+-------------------------------------------------------+
```

### **Teknologi Backend:**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database Engine**: MySQL / MariaDB (Connection Pooling dengan `mysql2/promise`)
- **Autentikasi**: JWT (JSON Web Token) + HTTP Cookie
- **ORM / Driver**: Raw Prepared Statements (untuk performa dan keamanan SQL Injection)

### **Teknologi Frontend:**
- **Framework**: Vue 3 (Composition API `<script setup>`)
- **Build Tool**: Vite
- **Styling**: Vanilla CSS + TailwindCSS (Glassmorphism & Micro-animations)
- **State Management**: Pinia Store (`auth.js`)
- **Excel Parser & Generator**: SheetJS (`xlsx`)

---

## 3. HAK AKSES & PERAN PENGGUNA (ROLE MANAGEMENT)

Aplikasi memiliki kontrol akses berbasis peran (*Role-Based Access Control / RBAC*) untuk menjaga keamanan data:

| Peran (Role) | Hak Akses & Wewenang |
| :--- | :--- |
| **Admin Sistem (Superadmin)** | Akses penuh ke seluruh menu: Kelola Anggota, Impor/Ekspor Excel, Distribusi Voucher, Kelola Barang, Kelola Supplier, Gudang & Pembelian, Akuntansi & Laporan, Kelola Pengguna, Kasir Swalayan, Kasir Grosir. |
| **Admin Penjualan** | Akses ke Kelola Barang, Pembelian/Gudang, Kasir Swalayan, Kasir Grosir, dan Laporan Penjualan. |
| **Admin Gudang & Pembelian** | Akses ke Kelola Barang, Kelola Supplier, dan Pembuatan PO Pembelian serta Mutasi Stok Gudang. |
| **Admin Order** | Akses terbatas ke List Order Barang dan status pengadaan barang gudang. |
| **Kasir Swalayan** | Akses khusus untuk Transaksi Kasir Swalayan (Scan barcode, Pembayaran Voucher + Cash/QRIS, Cetak Struk Swalayan). |
| **Kasir Grosir** | Akses khusus untuk Transaksi Kasir Grosir (Penjualan Partai Besar/Dus, Cetak Struk Grosir). |

---

## 4. ALUR & CARA KERJA SISTEM (END-TO-END WORKFLOWS)

### 4.1 Alur Manajemen Anggota & Impor Otomatis Excel Nominatif

```
[File Excel Nominatif Bulanan (.xlsx/.xls)]
                     │
                     ▼
       [Tombol "Impor Excel" di Web]
                     │
                     ▼
  [Client-side XLSX Parser (KelolaAnggota.vue)]
  - Deteksi Sheet: Militer / PNS / PPPK / NOM LF
  - Deteksi NIP 18-digit (PNS/PPPK) vs NRP 6-9 digit (Militer)
  - Deteksi Golongan (I/a s/d IV/e, Pembina, PPPK, Prada-Brigjen)
                     │
                     ▼
   [Tampilan Preview Ringkasan Data Anggota]
   (Total Anggota, Total Militer, Total PNS, Total PPPK)
                     │
                     ▼
        [Tombol "Simpan & Impor Data"]
                     │
                     ▼
  [Backend Batch Upsert Transaction (anggota.controller.js)]
   - Anggota Baru  ──► INSERT + Jatah Voucher Awal Rp 100.000
   - Anggota Lama  ──► UPDATE Biodata (Saldo Voucher TETAP AMAN)
```

**Penjelasan Langkah:**
1. **Unggah File**: Pengurus mengunggah file Excel nominatif bulanan (misal: `01. NOM MIL SEPTEMBER 2026.xlsx` atau `02 NOM ASN SEPTEMBER 2026.xls`).
2. **Parsing Cerdas**: Fitur XLSX Parser membaca seluruh sheet di dalam file Excel. 
   - Bila NIP terdiri dari **18 digit angka**, sistem 100% memasukkannya ke **PNS/PPPK**.
   - Bila Pangkat mengandung kode golongan (`III/d`, `IV/a`, `Pembina`, `PPPK`), sistem otomatis menetapkan kategori ASN (PNS atau PPPK).
   - Bila NRP 6-9 digit dan pangkat militer (`Sertu`, `Prada`, `Kapten`, `Brigjen`), sistem menetapkan kategori **Militer**.
3. **Pencegahan Konflik Data (Upsert)**:
   - Data diproses berdasarkan nomor identitas unik **NRP / NIP**.
   - **Anggota Baru**: Terdaftar baru dan mendapatkan jatah voucher awal Rp 100.000.
   - **Anggota Lama**: Hanya diperbarui data nama/pangkat/kategori. Saldo voucher dari bulan-bulan sebelumnya **tidak akan terhapus atau mereset**.

---

### 4.2 Alur Distribusi & Penggunaan Voucher Belanja

1. **Jatah Voucher Bulanan**: Setiap anggota aktif berhak menerima jatah voucher belanja **Rp 100.000 per bulan**.
2. **Otomatisasi Awal Bulan**: Backend dilengkapi *background cron scheduler* yang berjalan di server setiap tanggal 1 awal bulan untuk menambahkan jatah voucher Rp 100.000 secara otomatis ke seluruh anggota aktif.
3. **Distribusi Manual Trigger**: Pengurus juga dapat menekan tombol **"Distribusi Voucher"** pada header Kelola Anggota sewaktu-waktu.
4. **Prinsip Akumulasi**: Voucher yang belum terpakai di bulan sebelumnya tidak hangus, melainkan **terakumulasi** dengan jatah bulan berjalan.

---

### 4.3 Alur Kasir Swalayan (POS Swalayan & Dual Payment)

```
[Kasir Swalayan] ──► [Input / Scan Barcode Barang] ──► [Pilih Anggota Koperasi (via NRP/Nama)]
                                                                  │
                                                                  ▼
[Cetak Struk Belanja] ◄── [Proses Simpan Transaksi] ◄── [Pilih Metode Pembayaran]
                                                         - Voucher Belanja (Potong Saldo)
                                                         - Sisa Bayar: Tunai / QRIS / Transfer
```

**Penjelasan Langkah:**
1. Kasir membuka halaman **Kasir Swalayan** (`/kasir-swalayan`).
2. Barang di-scan menggunakan *Barcode Scanner* atau dicari manual melalui pencarian nama barang.
3. Jika pembeli adalah Anggota Koperasi, Kasir memilih nama/NRP anggota. Sistem akan langsung menampilkan sisa **Saldo Voucher** yang dimiliki anggota tersebut.
4. **Metode Pembayaran Kombinasi (Dual Payment)**:
   - Kasir menentukan berapa nominal yang dibayar menggunakan **Voucher Belanja**.
   - Jika total belanja melebihi saldo voucher, sisanya dibayar menggunakan **Tunai / QRIS / Transfer**.
5. Setelah klik **Bayar & Cetak Struk**, sistem secara otomatis:
   - Mengurangi saldo voucher anggota secara *real-time*.
   - Mengurangi stok barang Swalayan (`stok_swalayan`).
   - Mencetak struk fisik thermal / PDF struk belanja.

---

### 4.4 Alur Kasir Grosir (POS Grosir)

1. Kasir membuka halaman **Kasir Grosir** (`/kasir-grosir`).
2. Kasir mendaftarkan belanjaan partai besar (dus/karton/pak).
3. Harga yang digunakan secara otomatis adalah **Harga Grosir** (`harga_grosir`).
4. Setelah transaksi selesai, stok barang Grosir (`stok_grosir`) berkurang secara otomatis dan struk belanja grosir dicetak.

---

### 4.5 Alur Manajemen Barang, Stok & Gudang

Setiap barang di Master Barang memiliki atribut ganda:
- `harga_beli`: Harga pokok pembelian dari supplier.
- `harga_swalayan`: Harga jual eceran di Swalayan.
- `harga_grosir`: Harga jual partai di Toko Grosir.
- `stok_swalayan` & `stok_grosir`: Jumlah stok fisik di unit masing-masing.
- `stok_minimal`: Batas Peringatan Stok Kritis.

Admin Gudang dapat melakukan **Mutasi Stok** antar gudang/swalayan/grosir serta mengedit data barang.

---

### 4.6 Alur Pembelian Barang (Purchase Order & Supplier)

```
[Admin Pembelian Buat PO] ──► [Status: Menunggu] ──► [Supplier Kirim Barang]
                                                            │
                                                            ▼
[Stok Barang Bertambah Otomatis] ◄── [Status: Dimutasi] ◄── [Admin Gudang Verifikasi Fisik]
```

1. **Pembuatan PO**: Admin Pembelian membuat dokumen Purchase Order (PO) ke Supplier terdaftar. 
   - *Catatan*: Jika ada barang baru yang belum terdaftar di database, Admin dapat memilih opsi *"Input Barang Baru"* dalam form PO, dan sistem akan otomatis mengentri barang tersebut ke Master Barang.
2. **Penerimaan & Mutasi**: Ketika fisik barang tiba di gudang, Admin Gudang mengubah status PO menjadi **Dimutasi**.
3. **Update Stok Automatic**: Sistem secara otomatis menambah `stok_swalayan` atau `stok_grosir` sesuai PO yang diterima.

---

### 4.7 Alur Akuntansi, Laporan & SHU

Modul Akuntansi menyediakan laporan terintegrasi:
- **Laporan Penjualan**: Filter per rentang tanggal, jenis transaksi (Swalayan/Grosir), dan metode pembayaran.
- **Laporan Rekap Voucher**: Menampilkan rekapitulasi total jatah voucher, saldo terpakai, dan sisa saldo beredar seluruh anggota.
- **Laporan Pembelian & Utang**: Menampilkan histori PO ke supplier dan kewajiban pembayaran.
- **Laporan SHU (Sisa Hasil Usaha)**: Perhitungan kontribusi pembelanjaan setiap anggota untuk pembagian SHU di akhir tahun buku.
- **Ekspor PDF & Excel**: Seluruh laporan dapat diunduh ke bentuk spreadsheet Excel atau dicetak ke PDF resmi bertandatangan pengurus.

---

## 5. SKEMA & STRUKTUR DATABASE

Database `db_koperasi` terdiri dari tabel-tabel utama berikut:

```
                          ┌──────────────┐
                          │   pengguna   │
                          └──────┬───────┘
                                 │ N:1
                          ┌──────┴───────┐
                          │     role     │
                          └──────────────┘

┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│   supplier   │◄───N:1───│  pembelian   │───1:N───►│detail_pembeli│
└──────────────┘          └──────────────┘          └──────────────┘
                                                           │ N:1
                                                    ┌──────┴───────┐
                                                    │    barang    │
                                                    └──────┬───────┘
                                                           │ 1:N
┌──────────────┐          ┌──────────────┐          ┌──────┴───────┐
│   anggota    │◄───N:1───│  transaksi   │───1:N───►│detail_transak│
└──────────────┘          └──────────────┘          └──────────────┘
```

### **Rincian Deskripsi Tabel Utama:**

1. **`anggota`**:
   - `id_anggota` (INT, PK, AUTO_INCREMENT)
   - `nrp` (VARCHAR 30, UNIQUE) - Nomor NRP Militer / NIP PNS / NIP PPPK
   - `nama` (VARCHAR 100) - Nama lengkap anggota
   - `pangkat` (VARCHAR 50) - Pangkat (Sertu, Prada, dll) atau Golongan (III/d, IV/a, PPPK)
   - `jenis_anggota` (ENUM: 'Militer', 'PNS', 'PPPK') - Klasifikasi keanggotaan
   - `saldo_voucher` (DECIMAL 15,2) - Sisa saldo voucher belanja aktif
   - `is_active` (TINYINT 1) - Status keaktifan anggota

2. **`barang`**:
   - `id_barang` (INT, PK, AUTO_INCREMENT)
   - `nama_barang` (VARCHAR 100)
   - `barcode` (VARCHAR 50, UNIQUE)
   - `golongan` (VARCHAR 50) - Makanan, Minuman, Sembako, dll.
   - `harga_beli`, `harga_swalayan`, `harga_grosir` (DECIMAL 15,2)
   - `stok_swalayan`, `stok_grosir`, `stok_minimal` (INT)
   - `satuan_swalayan`, `satuan_grosir` (VARCHAR 20)

3. **`transaksi`**:
   - `id_transaksi` (INT, PK, AUTO_INCREMENT)
   - `no_nota` (VARCHAR 50, UNIQUE)
   - `waktu_transaksi` (DATETIME)
   - `jenis_transaksi` (ENUM: 'Swalayan', 'Grosir')
   - `nrp` (VARCHAR 30, FK to `anggota.nrp`)
   - `total_bayar` (DECIMAL 15,2)
   - `dibayar_voucher` (DECIMAL 15,2)
   - `dibayar_tunai` (DECIMAL 15,2)
   - `metode_pembayaran` (ENUM: 'Voucher', 'Tunai', 'Voucher+Tunai', 'QRIS', 'Transfer')

4. **`detail_transaksi`**:
   - `id_detail` (INT, PK, AUTO_INCREMENT)
   - `id_transaksi` (INT, FK)
   - `id_barang` (INT, FK)
   - `jumlah` (INT)
   - `harga_satuan` (DECIMAL 15,2)
   - `subtotal` (DECIMAL 15,2)

5. **`pembelian`** & **`detail_pembelian`**:
   - Pencatatan dokumen PO ke Supplier, tanggal beli, total biaya, status (`Menunggu`, `Dimutasi`), dan item barang yang dipesan.

6. **`pengguna`** & **`role`**:
   - Data kredensial login (username, password hash, nama pengguna, `id_role`).

7. **`pengaturan_voucher`** & **`log_distribusi_voucher`**:
   - Konfigurasi tanggal distribusi bulanan (tanggal 1), nominal Rp 100.000, serta riwayat log pembagian bulanan.

---

## 6. FITUR UNGGULAN SISTEM

1. **Parser Impor Excel Nominatif Cerdas**: Dapat membaca berkas Excel dengan struktur kolom yang berbeda-beda (5 kolom standar, 6 kolom Kopassus, NIP duluan) dan mengklasifikasikan kategori Militer, PNS, PPPK secara otomatis.
2. **Keamanan Saldo Voucher (Upsert Protection)**: Proses impor bulanan tidak akan pernah mereset atau menghapus saldo voucher yang dimiliki anggota lama.
3. **Dual Payment Cashier POS**: Memungkinkan pembayaran belanja dengan potongan voucher + sisa tunai/QRIS secara sekaligus.
4. **Pemisahan Unit Swalayan & Grosir**: Pemisahan harga jual dan stok barang eceran swalayan vs partai grosir.
5. **PDF Laporan Resmi Bertandatangan**: Mencetak dokumen laporan rekapitulasi anggota dan struk transaksi resmi yang siap ditandatangani Pengurus Koperasi.

---

## 7. PANDUAN OPERASIONAL MENJALANKAN APLIKASI

### **Prasyarat Perangkat Lunak:**
- Node.js versi 18.x atau lebih baru.
- MySQL / MariaDB Server.
- Web Browser modern (Google Chrome, Microsoft Edge, Mozilla Firefox).

### **Langkah Menjalankan Server Backend:**
1. Buka terminal / Command Prompt pada direktori backend:
   ```bash
   cd d:\repo\sistem-informasi-manajemen-koperasi-tribuanaIV\backend
   ```
2. Pastikan file `.env` sudah terkonfigurasi dengan kredensial database MySQL yang benar (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
3. Jalankan server backend:
   ```bash
   npm run dev
   ```
   *Backend akan berjalan di URL*: `http://localhost:3000`

### **Langkah Menjalankan Server Frontend:**
1. Buka terminal / Command Prompt pada direktori frontend:
   ```bash
   cd d:\repo\sistem-informasi-manajemen-koperasi-tribuanaIV\frontend
   ```
2. Jalankan server frontend:
   ```bash
   npm run dev
   ```
   *Frontend akan berjalan di URL*: `http://localhost:5173`

### **Akses Login Utama:**
- Buka browser dan akses [http://localhost:5173/login](http://localhost:5173/login)
- **Username default**: `admin`
- **Password default**: `password123` (atau sesuai konfigurasi pengguna)

---
*Dokumentasi ini disusun secara resmi untuk Sistem Informasi Manajemen Koperasi Tribuana IV.*

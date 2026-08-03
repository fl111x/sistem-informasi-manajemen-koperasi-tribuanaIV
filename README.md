# Sistem Informasi Manajemen Koperasi Tribuana IV

Sistem Informasi Manajemen Koperasi ini dibangun dengan menggunakan Vue.js (Frontend) dan Node.js/Express (Backend). Aplikasi ini bertujuan untuk membantu operasional koperasi, mulai dari kasir swalayan, kasir grosir, manajemen barang, hingga laporan transaksi dan akuntansi.

## Struktur Projek

Projek ini dibagi menjadi dua bagian utama:
- `frontend/` - Berisi kode sumber antarmuka pengguna berbasis Vue.js dan Vite.
- `backend/` - Berisi kode sumber server berbasis Node.js dan Express, beserta skema database (pada folder `db/`).

## Cara Menjalankan Aplikasi

Aplikasi ini sudah dikonfigurasi untuk dapat dijalankan secara bersamaan menggunakan paket `concurrently`.

1. Pastikan Anda telah menginstal dependensi dengan menjalankan perintah:
   ```bash
   npm run install:all
   ```
2. Pastikan database MySQL Anda sudah menyala dan telah melakukan impor skema dari folder `db/`.
3. Jalankan aplikasi (frontend dan backend) secara bersamaan:
   ```bash
   npm run dev
   ```

Aplikasi frontend dapat diakses melalui `http://localhost:5173` dan backend API berjalan di `http://localhost:3000`.

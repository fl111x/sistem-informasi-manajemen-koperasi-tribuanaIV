# Project Context: Koperasi Tribuana IV

## Deskripsi Singkat
Project ini adalah **Sistem Informasi Manajemen Koperasi** yang ditujukan untuk Koperasi Tribuana IV (Grup 2 Kopassus). Aplikasi ini bertujuan untuk mendigitalisasi operasional Koperasi, mulai dari transaksi swalayan, grosir, pembelian barang ke supplier, hingga laporan akuntansi.

## Teknologi (Tech Stack)
- **Frontend**: Vue 3 + Vite, Tailwind CSS. Axios digunakan untuk API Call.
- **Backend**: Node.js + Express.
- **Database**: MySQL (diintegrasikan menggunakan `mysql2/promise` tanpa ORM untuk kueri SQL mentah yang optimal).

## Modul & Ruang Lingkup Saat Ini
1. **Autentikasi**: Login dan pembatasan akses (Role).
2. **Master Data**: Kelola Pengguna, Role, Anggota, Barang. *(Catatan: Modul Kelola Supplier dihapus)*
3. **Transaksi**: Kasir Swalayan, Kasir Grosir.
4. **Gudang**: Pembelian / Restok (Menggunakan input manual nama supplier tanpa data relasional).
5. **Laporan**: Dashboard Omzet (dan ke depannya Laporan Akuntansi lengkap).

## Bagaimana Menggunakan Project Ini
Aplikasi bisa dijalankan bersamaan. Pada `package.json` root, terdapat script `npm run dev` yang memanggil package `concurrently` untuk menyalakan frontend (Vite) dan backend (Nodemon) secara simultan.

## Log Aktivitas Terakhir
*(Bisa ditambahkan secara manual oleh developer yang bertugas di sini)*
- Migrasi database dan refactor MVC di Backend.
- Integrasi CRUD Anggota dan perhitungan SHU.
- Penyelesaian antarmuka Laporan & Akuntansi pada Frontend.
- **[HARI INI]** Penghapusan Modul Kelola Supplier dan penyederhanaan fitur Pembelian Gudang (input teks bebas untuk nama supplier).

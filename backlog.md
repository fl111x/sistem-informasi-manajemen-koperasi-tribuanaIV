# Backlog & Project Status

## Log Perubahan Terbaru (Git Commits)
- **[WIP] (2026-08-06)** - refactor: Update backend & DB untuk pemisahan stok gudang/toko, otorisasi void, jurnal akuntansi, dan hutang/piutang supplier
- **0c7449b (2026-08-04)** - docs: Tambahkan dokumentasi struktur frontend
- **05fa7e2 (2026-08-04)** - feat: Menambahkan kolom stok pada tabel keranjang dan dropdown pencarian kasir
- **353df2b (2026-08-04)** - chore: update database exports
- **cc44e94 (2026-08-04)** - feat: optimasi skema db, hapus modul kelola supplier, update form mutasi barang baru, dan perbaikan UI kasir
- **812f727 (2026-07-29)** - feat: backend procedural refactoring, anggota CRUD, SHU integration, and frontend API fixes
- **0e23fd8 (2026-07-29)** - feat: Implementasi Frontend Fase 4 (Gudang & Pembelian) dan Fase 5 (Akuntansi & Laporan)
- **8e99c92 (2026-07-29)** - feat: Implementasi Frontend Fase 1 hingga Fase 3
- **d20dec6 (2026-07-28)** - feat: Refactor backend & implement Pembelian and Supplier modules
- **ce340bd (2026-07-28)** - menambah requirement yang didapatkan
- **7170c83 (2026-07-24)** - update transkrip
- **90e1844 (2026-07-21)** - integrasi : menyelesaikan integrasi dan menambahkan beberapa data dummy untuk testing

---

## Status Pekerjaan (Fungsi dan Fitur)

### ✅ Sudah Dikerjakan (Selesai)
- [x] Fungsi login (autentikasi JWT, cookie-based)
- [x] Tampilan halaman Login
- [x] Fungsi kelola pengguna (CRUD)
- [x] Tampilan kelola user & role (Sisi Admin)
- [x] Fungsi master barang (CRUD Barang)
- [x] Tampilan kelola barang (Admin & Koperasi)
- [x] Pembuatan DB dan dummy seed
- [x] Fungsi transaksi awal (Kasir Swalayan & Grosir)
- [x] Tampilan dashboard koperasi
- [x] Fungsi kelola role
- [x] Fungsi logout
- [x] Integrasi halaman Frontend dan API Backend
- [x] Backend procedural refactoring menjadi MVC
- [x] CRUD Anggota
- [x] Modul Pembelian Gudang (Tanpa Tabel Supplier Terpisah)

### ⏳ Akan Dikerjakan / Sedang Berjalan
- [ ] Revisi fungsi transaksi lanjutan (jika masih diperlukan bugfix)
- [ ] Fitur Laporan Lengkap (Laporan Akuntansi, Generate PDF/Excel dari transaksi dan laba)
- [ ] Validasi dan testing API dengan kondisi real database
- [ ] (UI) Pembaruan Frontend: Fitur Otorisasi Void Kasir (Modal PIN/Password Supervisor)
- [ ] (UI) Pembaruan Frontend: Halaman Mutasi Barang (Gudang Utama ke Toko)
- [ ] (UI) Pembaruan Frontend: Notifikasi/Alert Dashboard untuk Barang Gudang yang Belum Diset Harga
- [ ] (UI) Pembaruan Frontend: Pengembalian Dropdown Supplier dan Input Hutang/Tempo di Pembelian
- [ ] (UI) Pembaruan Frontend: Sembunyikan Menu berdasarkan Role secara ketat
- [x] (Backend & DB) Pembaruan Skema Database dan Endpoint API untuk mendukung fitur-fitur di atas
- [ ] (UI) Implementasi Laporan Harian (Tampilan realtime, pencocokan uang fisik kasir, tabel rincian transaksi)
- [ ] (UI) Implementasi Laporan Bulanan (Filter bulan & tahun, tabel rekapitulasi harian tanggal 1-31)
- [ ] (UI) Implementasi Laporan Tahunan (Filter tahun, tabel rekapitulasi bulanan)
- [ ] (UI) Menambahkan pilihan Cash / Kredit pada form Kasir Swalayan dan Grosir.
- [ ] (Fitur Tertunda) Implementasi Export to Excel beserta embedding Grafik menggunakan library `exceljs` (Ditunda sementara karena kendala koneksi internet server).

## Catatan Tambahan Terkini
- **Pemulihan Modul Kelola Supplier**: Berdasarkan wawancara terbaru (04/08/2026), pengelolaan hutang/tempo sangat penting sehingga tabel supplier akan dihidupkan kembali dan dihubungkan dengan transaksi pembelian.
- **Modul Voucher & Simpanan (08/09/2026)**: Schema DB sudah diupdate (`saldo_voucher`, `simpanan` di `anggota`, `dibayar_voucher` di `transaksi`). Controller & routes voucher sudah dibuat. Sisa tugas yang belum selesai tercantum di bawah.

---

## 🎫 Modul Voucher & Simpanan — Tugas Belum Selesai

> Voucher Rp 100.000/bulan dibagikan per anggota. Hanya bisa digunakan untuk belanja. Jika tidak digunakan, otomatis masuk ke simpanan anggota.

### Backend
- [ ] **(index.js)** Register route voucher baru ke server: `app.use('/api/voucher', voucherRoutes)` di `backend/src/index.js`
- [ ] **(transaksi.controller.js)** Modifikasi proses checkout untuk mendukung pembayaran dengan voucher:
  - Terima `nominal_voucher` dari request body
  - Validasi: anggota harus login (`nrp` harus ada), `nominal_voucher` tidak boleh melebihi `saldo_voucher` anggota, dan tidak boleh melebihi `total_bayar`
  - Kurangi `saldo_voucher` anggota di tabel `anggota`
  - Simpan `dibayar_voucher` ke tabel `transaksi`
- [ ] **(anggota.controller.js)** Pastikan response GET anggota (getAll & getById) mengembalikan field `saldo_voucher` dan `simpanan`

### Frontend: Admin UI
- [ ] **(KelolaAnggota.vue)** Tambahkan kolom **"Saldo Voucher"** dan **"Simpanan"** pada tabel daftar anggota
- [ ] **(KelolaAnggota.vue atau Dashboard)** Tambahkan tombol **"Distribusi Voucher Bulanan"** yang memanggil `POST /api/voucher/distribusi`. Tampilkan konfirmasi sebelum eksekusi dan notifikasi sukses/gagal setelah.

### Frontend: Kasir UI
- [ ] **(KasirSwalayan.vue & KasirGrosir.vue)** Saat anggota dipilih (NRP), tampilkan sisa saldo vouchernya
- [ ] **(KasirSwalayan.vue & KasirGrosir.vue)** Tambahkan input **"Bayar dengan Voucher"** di modal checkout/pembayaran
- [ ] **(KasirSwalayan.vue & KasirGrosir.vue)** Tambahkan validasi: nominal voucher ≤ saldo voucher anggota, dan nominal voucher ≤ total belanja


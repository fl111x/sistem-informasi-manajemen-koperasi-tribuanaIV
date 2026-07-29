# Dokumentasi API - Sistem Koperasi Tribuana IV

Semua API tersedia di bawah *base URL*: `http://localhost:3000/api`

**Autentikasi**: 
- Mayoritas endpoint dilindungi oleh JWT (JSON Web Token).
- Token dapat dikirimkan melalui header `Authorization: Bearer <token>` ATAU melalui *Cookie* `token`.
- Endpoint bertanda `[ADMIN ONLY]` mengharuskan token milik *user* dengan Role yang mengandung kata "admin".

---

## 1. Auth & Profil (`/api/auth`)

### `POST /auth/login`
- **Fungsi**: Mendapatkan token sesi.
- **Request Body**:
  ```json
  {
    "username": "admin",
    "password": "123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Login berhasil",
    "token": "eyJhbGciOiJIUzI1...",
    "user": {
      "id_pengguna": 1,
      "username": "admin",
      "nama_pengguna": "Administrator",
      "id_role": 1
    }
  }
  ```

### `POST /auth/register` `[ADMIN ONLY]`
- **Fungsi**: Mendaftarkan user baru oleh admin.
- **Request Body**:
  ```json
  {
    "username": "kasir_1",
    "password": "password123",
    "nama_pengguna": "Kasir Satu",
    "id_role": 2
  }
  ```
- **Response (201 Created)**: `{ "message": "Pendaftaran berhasil, silahkan login" }`

### `POST /auth/reset-password`
- **Fungsi**: Mengganti password user (membutuhkan konfirmasi password lama jika sudah diimplementasikan).
- **Request Body**:
  ```json
  {
    "username": "kasir_1",
    "new_password": "passwordBaru321"
  }
  ```
- **Response (200 OK)**: `{ "message": "Password berhasil direset" }`

### `POST /auth/logout`
- **Fungsi**: Menghapus token dari cookie.
- **Response (200 OK)**: `{ "message": "Logout berhasil" }`

---

## 2. Supplier (`/api/supplier`)

### `GET /supplier`
- **Fungsi**: Mendapatkan semua daftar supplier aktif.
- **Response (200 OK)**:
  ```json
  [
    {
      "id_supplier": 1,
      "nama_supplier": "PT Pemasok A",
      "kontak": "0812345678",
      "alamat": "Jl. Raya No 1"
    }
  ]
  ```

### `POST /supplier` `[ADMIN ONLY]`
- **Request Body**:
  ```json
  {
    "nama_supplier": "PT Pemasok Baru",
    "kontak": "08111222",
    "alamat": "Jakarta"
  }
  ```
- **Response (201 Created)**: `{ "message": "Supplier berhasil ditambahkan", "id_supplier": 2 }`

### Endpoint Lainnya:
- `GET /supplier/:id` - Mendapatkan detail satu supplier.
- `PUT /supplier/:id` `[ADMIN ONLY]` - Mengubah data supplier.
- `DELETE /supplier/:id` `[ADMIN ONLY]` - Menghapus (soft delete) supplier.

---

## 3. Barang (`/api/barang`)

### `GET /barang`
- **Fungsi**: Melihat semua stok barang aktif.
- **Response (200 OK)**:
  ```json
  [
    {
      "id_barang": 1,
      "nama_barang": "Indomie Goreng",
      "golongan": "Makanan",
      "barcode": "896860123000",
      "harga_beli": 2500,
      "harga_swalayan": 3000,
      "harga_grosir": 2800,
      "stok_swalayan": 100,
      "stok_grosir": 50,
      "stok_minimal": 10,
      "satuan_swalayan": "Pcs",
      "satuan_grosir": "Dus"
    }
  ]
  ```

### `POST /barang` `[ADMIN ONLY]`
- **Request Body**: Data sama seperti struktur respons `GET /barang` tanpa `id_barang`.
- **Response (201 Created)**: `{ "message": "Barang berhasil ditambahkan", "id": 5 }`

### Endpoint Lainnya:
- `GET /barang/:id` - Detail satu barang.
- `PUT /barang/:id` `[ADMIN ONLY]` - Update barang.
- `DELETE /barang/:id` `[ADMIN ONLY]` - Hapus permanen (Hard Delete) barang (Jika belum pernah ditransaksikan/dijadikan foreign key ketat).

---

## 4. Pembelian (Modul Gudang) (`/api/pembelian`)

### `GET /pembelian`
- **Fungsi**: Mendapatkan daftar seluruh PO (Purchase Orders).
- **Response (200 OK)**:
  ```json
  [
    {
      "id_pembelian": 1,
      "kategori": "Swalayan",
      "status": "Menunggu",
      "waktu_pembelian": "2026-07-28T02:00:00.000Z",
      "total_biaya": "500000.00",
      "nama_supplier": "PT Pemasok A",
      "admin_pembelian": "Administrator"
    }
  ]
  ```

### `POST /pembelian` `[ADMIN ONLY]`
- **Fungsi**: Membuat dokumen pembelian baru (Oleh Admin Pembelian). Jika `barang_baru` dikirim, sistem akan otomatis mencatatnya di Master Barang dengan stok 0.
- **Request Body**:
  ```json
  {
    "kategori": "Swalayan",
    "id_supplier": 1,
    "items": [
      {
        "id_barang": 1,
        "jumlah": 50,
        "harga_satuan": 2500
      },
      {
        "barang_baru": {
          "nama_barang": "Barang Belum Pernah Ada",
          "harga_beli": 1000,
          "harga_swalayan": 1500
        },
        "jumlah": 100,
        "harga_satuan": 1000
      }
    ]
  }
  ```
- **Response (201 Created)**: `{ "message": "Pembelian berhasil dibuat", "id_pembelian": 2, "total_biaya": 225000 }`

### `PUT /pembelian/:id/status` `[ADMIN ONLY]`
- **Fungsi**: Untuk alur mutasi Gudang (Oleh Admin Gudang). Saat status berubah jadi `Dimutasi`, stok barang fisik otomatis bertambah.
- **Request Body**:
  ```json
  {
    "status": "Dimutasi" // Pilihan: "Menunggu", "Diterima", "Dimutasi", "Ditunda"
  }
  ```
- **Response (200 OK)**: `{ "message": "Status berhasil diupdate" }`

### `GET /pembelian/:id`
- **Fungsi**: Melihat detail satu PO beserta daftar barang yang dipesan (Detail Pembelian).

---

## 5. Transaksi (Kasir) (`/api/transaksi`)

### `POST /transaksi`
- **Fungsi**: Mencatat transaksi penjualan dari pelanggan.
- **Request Body**:
  ```json
  {
    "jenis_transaksi": "Swalayan",
    "total_bayar": 5000,
    "items": [
      {
        "id_barang": 1,
        "quantity": 2,
        "diskon": 1000
      }
    ]
  }
  ```
- **Response (201 Created)**: `{ "message": "Transaksi berhasil", "id_transaksi": 10, "total_bayar": 4000 }`

### `GET /transaksi/:id`
- **Fungsi**: Mendapatkan detail riwayat satu transaksi. Biarpun master barang dihapus, riwayat tetap memunculkan nama barang menggunakan mekanisme *snapshot*.
- **Response (200 OK)**:
  ```json
  {
    "id_transaksi": 10,
    "waktu_transaksi": "2026-07-28T10:00:00.000Z",
    "total_bayar": "4000.00",
    "jenis_transaksi": "Swalayan",
    "nama_kasir": "Administrator",
    "items": [
      {
        "id_barang": 1,
        "nama_barang": "Indomie Goreng", 
        "quantity_barang": 2,
        "diskon": "1000.00",
        "subtotal": "4000.00"
      }
    ]
  }
  ```

---

## 6. Roles & Users (`/api/roles`, `/api/users`)
Endpoint standar CRUD untuk mengelola hak akses (`Role`) dan Pengguna (`Pengguna`).
- `GET /roles`
- `GET /users`
- `POST /roles`
- dsb.

---

## 7. Anggota Koperasi (`/api/anggota`)

### `GET /anggota`
- **Fungsi**: Mendapatkan semua daftar anggota aktif.
- **Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "nrp": "12345678",
        "nama": "Budi Santoso",
        "pangkat": "Sersan",
        "is_active": 1,
        "created_at": "2026-07-29T01:26:21.000Z",
        "updated_at": "2026-07-29T01:26:21.000Z"
      }
    ]
  }
  ```

### `POST /anggota`
- **Fungsi**: Menambahkan data anggota baru.
- **Request Body**:
  ```json
  {
    "nrp": "12345678",
    "nama": "Budi Santoso",
    "pangkat": "Sersan"
  }
  ```
- **Response (201 Created)**: `{ "message": "Anggota berhasil ditambahkan" }`

### Endpoint Lainnya:
- `GET /anggota/:nrp` - Mendapatkan detail satu anggota berdasarkan NRP.
- `PUT /anggota/:nrp` - Mengubah data anggota.
- `DELETE /anggota/:nrp` - Menghapus (soft delete) anggota berdasarkan NRP.
- `GET /anggota/:nrp/transaksi` - Mendapatkan riwayat pembelanjaan anggota beserta total akumulasi (SHU base).

---

## 8. Dashboard (`/api/dashboard`)

### `GET /dashboard`
- **Fungsi**: Mendapatkan data ringkasan untuk halaman dashboard.
- **Response (200 OK)**:
  ```json
  {
    "ringkasan": {
      "omzetSwalayan": "Rp 5.000.000",
      "omzetGrosir": "Rp 3.000.000",
      "totalOmzet": "Rp 8.000.000",
      "stokKritis": 5
    },
    "dataGrafik": [
      { "hari": "Sen", "swalayan": 500000, "grosir": 300000 },
      ...
    ],
    "transaksiTerbaru": [
      { "nota": "TRX-10", "waktu": "10:00", "sektor": "Swalayan", "kasir": "Admin", "total": "Rp 150.000" }
    ],
    "peringatanStok": [
      { "nama": "Indomie", "kode": "123", "stok_swalayan": 5, "stok_grosir": 10, "min": 10 }
    ]
  }
  ```

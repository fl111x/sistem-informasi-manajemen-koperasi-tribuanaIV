const db = require('../src/config/db');

async function runMigration() {
  const connection = await db.getConnection();
  try {
    console.log("Memulai pembuatan tabel baru...");
    
    // 1. Tabel Supplier
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Supplier (
        id_supplier INT AUTO_INCREMENT PRIMARY KEY,
        nama_supplier VARCHAR(255) NOT NULL,
        kontak VARCHAR(100),
        alamat TEXT,
        is_active TINYINT(1) DEFAULT 1
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("Tabel Supplier berhasil dibuat.");

    // 2. Tabel Pembelian
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Pembelian (
        id_pembelian INT AUTO_INCREMENT PRIMARY KEY,
        kategori ENUM('Swalayan', 'Grosir') NOT NULL,
        status ENUM('Menunggu', 'Diterima', 'Dimutasi', 'Ditunda') DEFAULT 'Menunggu',
        waktu_pembelian DATETIME DEFAULT CURRENT_TIMESTAMP,
        id_supplier INT NOT NULL,
        id_pengguna INT NOT NULL,
        total_biaya DECIMAL(15,2) DEFAULT 0,
        FOREIGN KEY (id_supplier) REFERENCES Supplier(id_supplier) ON DELETE RESTRICT,
        FOREIGN KEY (id_pengguna) REFERENCES Pengguna(id_pengguna) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("Tabel Pembelian berhasil dibuat.");

    // 3. Tabel Detail_Pembelian
    // id_barang bisa NULL jika suatu saat barang di-hard delete (sesuai req sebelumnya)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Detail_Pembelian (
        id_detail INT AUTO_INCREMENT PRIMARY KEY,
        id_pembelian INT NOT NULL,
        id_barang INT NULL,
        snapshot_nama_barang VARCHAR(255) NOT NULL,
        jumlah INT NOT NULL,
        harga_satuan DECIMAL(15,2) NOT NULL,
        subtotal DECIMAL(15,2) NOT NULL,
        FOREIGN KEY (id_pembelian) REFERENCES Pembelian(id_pembelian) ON DELETE CASCADE,
        FOREIGN KEY (id_barang) REFERENCES Barang(id_barang) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("Tabel Detail_Pembelian berhasil dibuat.");

    console.log("Migrasi selesai!");
  } catch (err) {
    console.error("Migrasi gagal:", err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

runMigration();

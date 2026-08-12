const db = require('./src/config/db');

async function updateSchemaV2() {
  const connection = await db.getConnection();
  try {
    console.log("Menjalankan update skema tahap 2...");
    
    try {
      await connection.execute("ALTER TABLE Pembelian ADD COLUMN catatan_gudang TEXT DEFAULT NULL");
      console.log("Added catatan_gudang to Pembelian.");
    } catch(e) { console.log(e.message); }

    try {
      await connection.execute("ALTER TABLE Pembelian ADD COLUMN keterangan_mutasi TEXT DEFAULT NULL");
      console.log("Added keterangan_mutasi to Pembelian.");
    } catch(e) { console.log(e.message); }

    try {
      await connection.execute("ALTER TABLE Detail_Pembelian ADD COLUMN jumlah_dimutasi INT DEFAULT 0");
      console.log("Added jumlah_dimutasi to Detail_Pembelian.");
    } catch(e) { console.log(e.message); }

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Hutang_Supplier (
        id_hutang int NOT NULL AUTO_INCREMENT,
        id_pembelian int NOT NULL,
        id_supplier int NOT NULL,
        total_hutang decimal(15,2) NOT NULL,
        sisa_hutang decimal(15,2) NOT NULL,
        tanggal_jatuh_tempo date NOT NULL,
        status_lunas enum('Belum Lunas','Sebagian','Lunas') DEFAULT 'Belum Lunas',
        waktu_update datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id_hutang),
        FOREIGN KEY (id_pembelian) REFERENCES Pembelian (id_pembelian) ON DELETE CASCADE,
        FOREIGN KEY (id_supplier) REFERENCES Supplier (id_supplier) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("Created table Hutang_Supplier.");

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Riwayat_Cicilan_Hutang (
        id_cicilan int NOT NULL AUTO_INCREMENT,
        id_hutang int NOT NULL,
        nominal_bayar decimal(15,2) NOT NULL,
        tanggal_bayar datetime DEFAULT CURRENT_TIMESTAMP,
        metode_pembayaran varchar(50) DEFAULT 'Transfer',
        keterangan varchar(255) DEFAULT NULL,
        PRIMARY KEY (id_cicilan),
        FOREIGN KEY (id_hutang) REFERENCES Hutang_Supplier (id_hutang) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("Created table Riwayat_Cicilan_Hutang.");

    console.log("Update skema V2 selesai.");
  } catch (err) {
    console.error("Critical error:", err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

updateSchemaV2();

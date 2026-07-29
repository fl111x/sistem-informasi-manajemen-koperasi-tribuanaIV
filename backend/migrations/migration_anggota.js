const db = require('../src/config/db');

async function runMigration() {
  const connection = await db.getConnection();
  try {
    console.log("Memulai pembuatan tabel Anggota...");
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Anggota (
        nrp VARCHAR(50) PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        pangkat VARCHAR(100) NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("Tabel Anggota berhasil dibuat.");
  } catch (err) {
    console.error("Migrasi gagal:", err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

runMigration();

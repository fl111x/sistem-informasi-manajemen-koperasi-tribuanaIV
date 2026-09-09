const pool = require('../config/db');

async function alterAnggota() {
  try {
    console.log("Altering anggota table...");
    await pool.query("ALTER TABLE anggota ADD COLUMN jenis_anggota varchar(50) DEFAULT 'Militer' AFTER pangkat");
    console.log("Database altered successfully!");
  } catch (err) {
    if (err.message.includes("Duplicate column name")) {
      console.log("Column jenis_anggota already exists.");
    } else {
      console.error("Error altering database:", err.message);
    }
  } finally {
    process.exit(0);
  }
}

alterAnggota();

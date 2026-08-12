const db = require('./src/config/db');

async function updateSchema() {
  const connection = await db.getConnection();
  try {
    console.log("Updating schema...");
    
    // Attempt to add missing columns (ignore errors if they already exist)
    try {
      await connection.execute("ALTER TABLE Pembelian ADD COLUMN metode_pembayaran enum('Cash','Tempo') DEFAULT 'Cash'");
      console.log("Added metode_pembayaran.");
    } catch(e) { console.log(e.message); }
    
    try {
      await connection.execute("ALTER TABLE Pembelian ADD COLUMN jatuh_tempo date DEFAULT NULL");
      console.log("Added jatuh_tempo.");
    } catch(e) { console.log(e.message); }
    
    try {
      await connection.execute("ALTER TABLE Pembelian ADD COLUMN status_pembayaran enum('Lunas','Belum Lunas') DEFAULT 'Lunas'");
      console.log("Added status_pembayaran.");
    } catch(e) { console.log(e.message); }
    
    // Update enum for status to include Dipesan and Batal
    try {
      await connection.execute("ALTER TABLE Pembelian MODIFY COLUMN status ENUM('Menunggu', 'Dipesan', 'Diterima', 'Dimutasi', 'Ditunda', 'Batal') DEFAULT 'Menunggu'");
      console.log("Updated status enum.");
    } catch(e) { console.log(e.message); }

    console.log("Schema update complete.");
  } catch (err) {
    console.error("Critical error:", err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

updateSchema();

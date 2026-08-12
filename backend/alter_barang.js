const db = require('./src/config/db');

async function updateBarangSchema() {
  const connection = await db.getConnection();
  try {
    console.log("Updating Barang schema...");
    
    try {
      await connection.execute("ALTER TABLE Barang ADD COLUMN stok_gudang int DEFAULT 0");
      console.log("Added stok_gudang.");
    } catch(e) { console.log(e.message); }
    
    try {
      await connection.execute("ALTER TABLE Barang ADD COLUMN is_konsinyasi tinyint(1) DEFAULT 0");
      console.log("Added is_konsinyasi.");
    } catch(e) { console.log(e.message); }

    console.log("Barang Schema update complete.");
  } catch (err) {
    console.error("Critical error:", err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

updateBarangSchema();

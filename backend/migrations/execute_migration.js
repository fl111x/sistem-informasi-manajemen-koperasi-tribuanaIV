const db = require('../src/config/db');

async function runMigration() {
  const connection = await db.getConnection();
  try {
    console.log("Starting migration (Revised)...");
    
    // We already added snapshot_nama_barang
    
    // Drop foreign key for id_barang
    console.log("Dropping existing foreign key detail_transaksi_ibfk_2...");
    try {
      await connection.query(`ALTER TABLE detail_transaksi DROP FOREIGN KEY detail_transaksi_ibfk_2`);
      console.log("Foreign key dropped successfully.");
    } catch (e) {
      if (e.code === 'ER_DROP_INDEX_FK') {
         // It might be named differently or already dropped
         console.log("FK might already be dropped or named differently:", e.message);
      } else {
         throw e;
      }
    }

    console.log("Migration completed successfully! No need to set ON DELETE SET NULL since we dropped the FK constraint entirely.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

runMigration();

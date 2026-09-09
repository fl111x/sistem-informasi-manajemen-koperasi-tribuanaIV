const pool = require('../config/db');

async function alterDb() {
  try {
    console.log("Altering barang table...");
    await pool.query("ALTER TABLE barang ADD COLUMN id_supplier INT DEFAULT NULL AFTER id_barang");
    await pool.query("ALTER TABLE barang ADD CONSTRAINT fk_barang_supplier FOREIGN KEY (id_supplier) REFERENCES supplier(id_supplier) ON DELETE SET NULL");
    await pool.query("ALTER TABLE barang DROP INDEX barcode");
    await pool.query("ALTER TABLE barang ADD UNIQUE KEY idx_barcode_supplier (barcode, id_supplier)");
    console.log("Database altered successfully!");
  } catch (err) {
    console.error("Error altering database:", err.message);
  } finally {
    process.exit(0);
  }
}

alterDb();

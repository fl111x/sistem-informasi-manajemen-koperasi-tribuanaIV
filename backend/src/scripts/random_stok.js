const pool = require('../config/db');

async function randomizeStokSwalayan() {
  try {
    console.log("Mengacak stok swalayan...");
    const [rows] = await pool.query("SELECT id_barang FROM barang WHERE id_supplier IS NOT NULL");
    
    let count = 0;
    for (const row of rows) {
      // Generate random stock between 10 and 150
      const randomStok = Math.floor(Math.random() * 141) + 10;
      await pool.query("UPDATE barang SET stok_swalayan = ? WHERE id_barang = ?", [randomStok, row.id_barang]);
      count++;
    }
    console.log(`Berhasil mengacak stok swalayan untuk ${count} barang!`);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    process.exit(0);
  }
}

randomizeStokSwalayan();

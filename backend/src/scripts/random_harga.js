const pool = require('../config/db');

const getRandomPrice = (min, max) => Math.floor((Math.random() * (max - min) + min) / 500) * 500;

async function randomizeHarga() {
  try {
    console.log("Mengacak ulang harga barang swalayan...");
    const [rows] = await pool.query("SELECT id_barang FROM barang WHERE id_supplier IS NOT NULL");
    
    let count = 0;
    for (const row of rows) {
      const hargaBeli = getRandomPrice(3000, 30000);
      const hargaJual = hargaBeli + getRandomPrice(1000, 10000);
      
      await pool.query(
        "UPDATE barang SET harga_beli = ?, harga_swalayan = ? WHERE id_barang = ?", 
        [hargaBeli, hargaJual, row.id_barang]
      );
      count++;
    }
    console.log(`Berhasil mengacak ulang harga beli dan swalayan untuk ${count} barang!`);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    process.exit(0);
  }
}

randomizeHarga();

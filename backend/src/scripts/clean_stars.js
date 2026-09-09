const pool = require('../config/db');

async function cleanStars() {
  try {
    console.log("Membersihkan tanda bintang di akhir nama barang...");
    const [rows] = await pool.query("SELECT id_barang, nama_barang FROM barang WHERE nama_barang LIKE '%*'");
    
    let count = 0;
    for (const row of rows) {
      // Menghapus bintang yang ada di AKHIR teks (misal: "OREO VNL CRM 133**")
      const cleanedName = row.nama_barang.replace(/\*+$/, '').trim();
      
      await pool.query(
        "UPDATE barang SET nama_barang = ? WHERE id_barang = ?", 
        [cleanedName, row.id_barang]
      );
      count++;
    }
    console.log(`Berhasil membersihkan nama untuk ${count} barang!`);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    process.exit(0);
  }
}

cleanStars();

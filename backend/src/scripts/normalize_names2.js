const pool = require('../config/db');

async function normalizeNames2() {
  try {
    console.log("Menormalisasi penamaan barang *B (tanpa A)...");
    const [rows] = await pool.query("SELECT id_barang, nama_barang FROM barang WHERE nama_barang LIKE '%*%'");
    
    let count = 0;
    for (const row of rows) {
      let name = row.nama_barang;
      const match = name.match(/(?:\s|^)\*(\d+)/);
      if (match) {
        const B = parseInt(match[1]);
        name = name.replace(/(?:\s|^)\*(\d+)/, ` [Min Beli: 1 | 1 Dus: ${B} Pcs]`);
        
        await pool.query(
          "UPDATE barang SET nama_barang = ? WHERE id_barang = ?", 
          [name, row.id_barang]
        );
        count++;
      }
    }
    console.log(`Berhasil menormalisasi ${count} barang!`);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    process.exit(0);
  }
}

normalizeNames2();

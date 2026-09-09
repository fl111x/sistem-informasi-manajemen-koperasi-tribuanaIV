const pool = require('../config/db');

async function normalizeNames() {
  try {
    console.log("Menormalisasi penamaan barang A*B...");
    const [rows] = await pool.query("SELECT id_barang, nama_barang FROM barang WHERE nama_barang LIKE '%*%'");
    
    let count = 0;
    for (const row of rows) {
      let name = row.nama_barang;
      const match = name.match(/(\d+)\s*\*\s*(\d+)/);
      if (match) {
        const A = parseInt(match[1]);
        const B = parseInt(match[2]);
        const totalDus = A * B;
        name = name.replace(/(\d+)\s*\*\s*(\d+)/, `[Min Beli: ${A} | 1 Dus: ${totalDus} Pcs]`);
        
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

normalizeNames();

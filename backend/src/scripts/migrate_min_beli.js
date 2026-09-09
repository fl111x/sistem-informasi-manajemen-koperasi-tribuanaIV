const pool = require('../config/db');

async function migrateMinBeli() {
  try {
    console.log("Adding min_beli and isi_koli columns...");
    try {
      await pool.query("ALTER TABLE barang ADD COLUMN min_beli INT DEFAULT 1, ADD COLUMN isi_koli INT DEFAULT 1;");
      console.log("Columns added successfully.");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log("Columns already exist.");
      } else {
        throw e;
      }
    }

    console.log("Migrating data...");
    const [rows] = await pool.query("SELECT id_barang, nama_barang FROM barang WHERE nama_barang LIKE '%[Min Beli:%'");
    
    let count = 0;
    for (const row of rows) {
      let name = row.nama_barang;
      const match = name.match(/\[Min Beli: (\d+) \| 1 Dus: (\d+) Pcs\]/);
      
      if (match) {
        const min_beli = parseInt(match[1], 10);
        const isi_koli = parseInt(match[2], 10);
        
        // Remove the tag from the name
        name = name.replace(/\s*\[Min Beli: \d+ \| 1 Dus: \d+ Pcs\]/, '').trim();
        
        await pool.query(
          "UPDATE barang SET nama_barang = ?, min_beli = ?, isi_koli = ? WHERE id_barang = ?", 
          [name, min_beli, isi_koli, row.id_barang]
        );
        count++;
      }
    }
    console.log(`Berhasil migrasi data untuk ${count} barang!`);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    process.exit(0);
  }
}

migrateMinBeli();

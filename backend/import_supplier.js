require('dotenv').config();
const mysql = require('mysql2/promise');
const XLSX = require('../frontend/node_modules/xlsx');

async function importSupplier() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_koperasi',
  });

  try {
    console.log("=== Membersihkan Supplier Dummy Lama ===");
    try {
      const [delSupplier] = await db.query(`DELETE FROM supplier WHERE is_active = 1`);
      console.log(`Berhasil menghapus ${delSupplier.affectedRows} supplier lama.`);
    } catch (e) {
      if (e.code === 'ER_ROW_IS_REFERENCED_2') {
         console.log('Ada supplier yang tidak bisa dihapus karena sudah dipakai transaksi pembelian. Menyetel is_active = 0...');
         const [updSupplier] = await db.query(`UPDATE supplier SET is_active = 0`);
         console.log(`Berhasil menonaktifkan ${updSupplier.affectedRows} supplier lama.`);
      } else {
         throw e;
      }
    }

    console.log("\n=== Membaca Data Supplier dari Excel ===");
    const brgFile = 'D:\\data_koperasi\\Copy of DATA BARANG KELUAR - MASUK 2026.xlsx';
    const brgWb = XLSX.readFile(brgFile);
    const brgData = XLSX.utils.sheet_to_json(brgWb.Sheets[brgWb.SheetNames[0]], { header: 1 });
    
    let suppliers = new Set();
    
    for (let i = 2; i < brgData.length; i++) {
      const row = brgData[i];
      if (!row) continue;
      
      if (row[2] && typeof row[2] === 'string' && row[2].startsWith('(') && row[2].endsWith(')')) {
        let name = row[2].substring(1, row[2].length - 1).trim();
        if (name) suppliers.add(name);
      }
    }

    const uniqueSuppliers = Array.from(suppliers);
    console.log(`Menemukan ${uniqueSuppliers.length} supplier unik. Mulai memasukkan ke database...`);
    
    let successCount = 0;
    for (const supplierName of uniqueSuppliers) {
      try {
        await db.query(
          'INSERT INTO supplier (nama_supplier) VALUES (?)',
          [supplierName]
        );
        successCount++;
      } catch (insertErr) {
        console.error(`Gagal memasukkan supplier ${supplierName}:`, insertErr.message);
      }
    }
    console.log(`\nBerhasil mengimpor ${successCount} supplier ke dalam database.`);
    
  } catch (err) {
    console.error('Terjadi kesalahan utama:', err);
  } finally {
    await db.end();
  }
}

importSupplier();

require('dotenv').config();
const mysql = require('mysql2/promise');

async function deleteDummy() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_koperasi',
  });

  try {
    console.log("=== Menghapus Anggota Dummy ===");
    // Delete explicitly known dummy data or data created before today
    const [delAnggota] = await db.query(`DELETE FROM anggota WHERE nrp = '001' OR nrp = 'TEST-001' OR nama LIKE '%ammar%'`);
    console.log(`Berhasil menghapus ${delAnggota.affectedRows} anggota dummy.`);

    console.log("\n=== Menghapus Barang Dummy ===");
    // Id 1 to 15 are dummy groceries data
    const [delBarang] = await db.query(`DELETE FROM barang WHERE id_barang <= 15`);
    console.log(`Berhasil menghapus ${delBarang.affectedRows} barang dummy.`);

  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
       console.log('Gagal menghapus barang karena masih ada transaksi yang mereferensikan barang dummy ini. Menyetel is_active = 0 saja.');
       await db.query(`UPDATE barang SET is_active = 0 WHERE id_barang <= 15`);
       console.log('Berhasil non-aktifkan barang dummy (is_active = 0).');
    } else {
       console.error(err);
    }
  } finally {
    await db.end();
  }
}
deleteDummy();

require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkDummy() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_koperasi',
  });

  try {
    console.log("=== ANGGOTA DUMMY (NRP pendek atau TEST) ===");
    const [anggota] = await db.query(`SELECT nrp, nama FROM anggota WHERE LENGTH(nrp) < 5 OR nrp LIKE '%TEST%' OR nama LIKE '%ammar%'`);
    console.table(anggota);

    console.log("\n=== BARANG DUMMY (id_barang <= 20) ===");
    // Asumsi: barang sebelum migrasi memiliki id_barang <= 20 (berdasarkan file export)
    // Atau kita bisa cek dari panjang barcode, tapi id lebih aman karena migrasi nambah data baru (id > 20)
    const [barang] = await db.query(`SELECT id_barang, barcode, nama_barang FROM barang WHERE id_barang <= 20`);
    console.table(barang);

  } catch (err) {
    console.error(err);
  } finally {
    await db.end();
  }
}
checkDummy();

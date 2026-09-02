require('dotenv').config();
const mysql = require('mysql2/promise');
const XLSX = require('../frontend/node_modules/xlsx');

async function fixGrosir() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_koperasi',
  });

  try {
    const brgFile = 'D:\\data_koperasi\\Copy of DATA BARANG KELUAR - MASUK 2026.xlsx';
    const brgWb = XLSX.readFile(brgFile);
    const brgData = XLSX.utils.sheet_to_json(brgWb.Sheets[brgWb.SheetNames[0]], { header: 1 });
    
    let toUpdate = 0;
    
    for (let i = 2; i < brgData.length; i++) {
      const row = brgData[i];
      if (!row) continue;
      
      if (row[2] && typeof row[2] === 'string' && row[2].startsWith('(') && row[2].endsWith(')')) {
        continue;
      } else if (row[3] && row[2]) {
        const barcode = row[2].toString().trim();
        
        await db.query(
          'UPDATE barang SET stok_grosir = 0 WHERE barcode = ?',
          [barcode]
        );
        toUpdate++;
      }
    }
    console.log(`Berhasil me-reset stok_grosir menjadi 0 untuk ${toUpdate} jenis barang dari file excel.`);
  } catch (err) {
    console.error('Terjadi kesalahan:', err);
  } finally {
    await db.end();
  }
}
fixGrosir();

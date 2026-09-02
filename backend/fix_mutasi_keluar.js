require('dotenv').config();
const mysql = require('mysql2/promise');
const XLSX = require('../frontend/node_modules/xlsx');

async function fixMutasi() {
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
        const keluar = parseInt(row[5]) || 0;
        
        if (keluar > 0) {
          // Asumsi: barang keluar dimutasi ke swalayan
          await db.query(
            'UPDATE barang SET stok_swalayan = stok_swalayan + ? WHERE barcode = ?',
            [keluar, barcode]
          );
          toUpdate++;
        }
      }
    }
    console.log(`Berhasil memperbarui stok_swalayan untuk ${toUpdate} jenis barang (ditambahkan dari data keluar).`);
  } catch (err) {
    console.error('Terjadi kesalahan:', err);
  } finally {
    await db.end();
  }
}
fixMutasi();

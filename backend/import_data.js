require('dotenv').config();
const mysql = require('mysql2/promise');
const XLSX = require('../frontend/node_modules/xlsx');

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_koperasi',
  });

  try {
    // 1. IMPORT PNS
    console.log('--- Mengimpor Data PNS ---');
    const pnsFile = 'D:\\data_koperasi\\PNS Agustus 2026.xlsx';
    const pnsWb = XLSX.readFile(pnsFile);
    const pnsData = XLSX.utils.sheet_to_json(pnsWb.Sheets[pnsWb.SheetNames[0]], { header: 1 });
    
    let pnsCount = 0;
    // Data starts at row 3 (index 3)
    for (let i = 3; i < pnsData.length; i++) {
      const row = pnsData[i];
      if (!row || !row[1] || !row[2]) continue; // Skip if no NRP or NAMA
      
      const nrp = row[1].toString().trim();
      const nama = row[2].toString().trim();
      const gol = row[3] ? row[3].toString().trim() : 'PNS';
      
      await db.query(
        'INSERT IGNORE INTO anggota (nrp, nama, pangkat) VALUES (?, ?, ?)',
        [nrp, nama, gol]
      );
      pnsCount++;
    }
    console.log(`Berhasil mengimpor ${pnsCount} anggota PNS.`);

    // 2. IMPORT MILITER
    console.log('\n--- Mengimpor Data Militer ---');
    const milFile = 'D:\\data_koperasi\\01. NOM MIL AGUSTUS 2026.xlsx';
    const milWb = XLSX.readFile(milFile);
    const milData = XLSX.utils.sheet_to_json(milWb.Sheets['NOM PUSDIK'], { header: 1 });
    
    let milCount = 0;
    for (let i = 0; i < milData.length; i++) {
      const row = milData[i];
      if (!row) continue;
      
      const nama = row[2] ? row[2].toString().trim() : '';
      const pangkat = row[3] ? row[3].toString().trim() : '';
      const nrp = row[4] ? row[4].toString().replace(/\s/g, '') : '';
      
      if (nrp && nrp.length >= 5 && nama) {
        await db.query(
          'INSERT IGNORE INTO anggota (nrp, nama, pangkat) VALUES (?, ?, ?)',
          [nrp, nama, pangkat]
        );
        milCount++;
      }
    }
    console.log(`Berhasil mengimpor ${milCount} anggota Militer.`);

    // 3. IMPORT BARANG
    console.log('\n--- Mengimpor Data Barang ---');
    const brgFile = 'D:\\data_koperasi\\Copy of DATA BARANG KELUAR - MASUK 2026.xlsx';
    const brgWb = XLSX.readFile(brgFile);
    const brgData = XLSX.utils.sheet_to_json(brgWb.Sheets[brgWb.SheetNames[0]], { header: 1 });
    
    let brgCount = 0;
    
    for (let i = 2; i < brgData.length; i++) {
      const row = brgData[i];
      if (!row) continue;
      
      // Skip if it's a supplier row
      if (row[2] && typeof row[2] === 'string' && row[2].startsWith('(') && row[2].endsWith(')')) {
        continue;
      } else if (row[3] && row[2]) {
        // row[2] is barcode
        // row[3] is nama barang
        const barcode = row[2].toString().trim();
        const namaBarang = row[3].toString().trim();
        const masuk = parseInt(row[4]) || 0;
        const keluar = parseInt(row[5]) || 0;
        let stok = 0;
        if (row[6] && row[6] !== '-') {
          stok = parseInt(row[6]) || 0;
        } else {
          stok = masuk - keluar;
        }
        
        await db.query(
          'INSERT IGNORE INTO barang (barcode, nama_barang, stok_gudang) VALUES (?, ?, ?)',
          [barcode, namaBarang, stok]
        );
        brgCount++;
      }
    }
    console.log(`Berhasil mengimpor ${brgCount} barang.`);

  } catch (error) {
    console.error('Terjadi kesalahan:', error);
  } finally {
    await db.end();
  }
}

run();

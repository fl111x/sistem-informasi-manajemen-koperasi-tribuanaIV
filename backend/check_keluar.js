require('dotenv').config();
const mysql = require('mysql2/promise');
const XLSX = require('../frontend/node_modules/xlsx');

async function check() {
  try {
    const brgFile = 'D:\\data_koperasi\\Copy of DATA BARANG KELUAR - MASUK 2026.xlsx';
    const brgWb = XLSX.readFile(brgFile);
    const brgData = XLSX.utils.sheet_to_json(brgWb.Sheets[brgWb.SheetNames[0]], { header: 1 });
    
    let toUpdate = 0;
    console.log("Sample Data Barang Keluar:");
    
    for (let i = 2; i < brgData.length; i++) {
      const row = brgData[i];
      if (!row) continue;
      
      if (row[2] && typeof row[2] === 'string' && row[2].startsWith('(') && row[2].endsWith(')')) {
        continue;
      } else if (row[3] && row[2]) {
        const barcode = row[2].toString().trim();
        const namaBarang = row[3].toString().trim();
        const keluar = parseInt(row[5]) || 0;
        
        if (keluar > 0) {
          toUpdate++;
          if (toUpdate <= 5) {
             console.log(`- ${namaBarang} (Barcode: ${barcode}) -> Keluar: ${keluar}`);
          }
        }
      }
    }
    console.log(`\nTotal items with 'keluar' > 0: ${toUpdate}`);
  } catch (err) {
    console.error(err);
  }
}
check();

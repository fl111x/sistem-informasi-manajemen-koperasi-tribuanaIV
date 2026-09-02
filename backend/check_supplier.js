require('dotenv').config();
const mysql = require('mysql2/promise');
const XLSX = require('../frontend/node_modules/xlsx');

async function checkSupplier() {
  try {
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
    
    console.log("Daftar Supplier dari Excel:");
    console.log(Array.from(suppliers));
    console.log(`Total Supplier unik: ${suppliers.size}`);
  } catch (err) {
    console.error(err);
  }
}
checkSupplier();

const XLSX = require('xlsx');
const fs = require('fs');

const files = [
  'D:\\data_koperasi\\01. NOM MIL AGUSTUS 2026.xlsx',
  'D:\\data_koperasi\\Copy of DATA BARANG KELUAR - MASUK 2026.xlsx',
  'D:\\data_koperasi\\PNS Agustus 2026.xlsx'
];

files.forEach(file => {
  console.log(`\n--- File: ${file} ---`);
  try {
    const workbook = XLSX.readFile(file);
    const sheetName = workbook.SheetNames[0];
    console.log(`Sheet: ${sheetName}`);
    const sheet = workbook.Sheets[sheetName];
    // Convert to JSON and take first 5 rows to see structure
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(data.slice(0, 10));
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
});

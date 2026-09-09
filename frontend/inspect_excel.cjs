const xlsx = require('xlsx');
const path = require('path');

const filePath = 'D:\\repo\\data_koperasi\\DATA BARANG GROSIR 2026.xls';
const workbook = xlsx.readFile(filePath);

console.log("Sheets:", workbook.SheetNames);

const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log(`Total Rows in sheet 1: ${data.length}`);

console.log("\nFirst 15 rows:");
for (let i = 0; i < 15; i++) {
  if (data[i] && data[i].length > 0) {
    console.log(`Row ${i + 1}:`, data[i]);
  }
}

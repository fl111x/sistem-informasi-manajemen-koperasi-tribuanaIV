const XLSX = require('xlsx');

const fileMil = 'D:\\data_koperasi\\01. NOM MIL AGUSTUS 2026.xlsx';
try {
  const workbook = XLSX.readFile(fileMil);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log("\n--- MIL Data (Rows 10-30) ---");
  console.log(data.slice(10, 30));
} catch (err) {}

const fileBarang = 'D:\\data_koperasi\\Copy of DATA BARANG KELUAR - MASUK 2026.xlsx';
try {
  const workbook = XLSX.readFile(fileBarang);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log("\n--- BARANG Data (Rows 0-25) ---");
  console.log(data.slice(0, 25));
} catch (err) {}

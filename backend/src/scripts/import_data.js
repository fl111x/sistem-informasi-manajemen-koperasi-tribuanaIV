const xlsx = require('xlsx');
const pool = require('../config/db');
const path = require('path');

const getRandomPrice = (min, max) => Math.floor((Math.random() * (max - min) + min) / 500) * 500;

async function importMiliter() {
  const filePath = 'D:\\repo\\data_koperasi\\edited\\01. NOM MIL AGUSTUS 2026.xlsx';
  const wb = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json(wb.Sheets['NOM PUSDIK'], { header: 1 });
  
  let inserted = 0;
  for (let i = 10; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 5 || !row[2] || !row[4]) continue;
    
    const nama = String(row[2]).trim();
    const pangkat = String(row[3]).trim();
    const nrp = String(row[4]).trim();
    
    try {
      await pool.query(
        "INSERT IGNORE INTO anggota (nrp, nama, pangkat, jenis_anggota, simpanan, saldo_voucher) VALUES (?, ?, ?, 'Militer', 0, 0)",
        [nrp, nama, pangkat]
      );
      inserted++;
    } catch (e) {
      console.error(`Error militer ${nrp}:`, e.message);
    }
  }
  console.log(`Imported ${inserted} Militer members.`);
}

async function importPNS() {
  const filePath = 'D:\\repo\\data_koperasi\\edited\\PNS Agustus 2026.xlsx';
  const wb = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  
  let inserted = 0;
  for (let i = 3; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 3 || !row[1] || !row[2]) continue;
    
    const nrp = String(row[1]).trim();
    const nama = String(row[2]).trim();
    const gol = row[3] ? String(row[3]).trim() : '';
    
    try {
      await pool.query(
        "INSERT IGNORE INTO anggota (nrp, nama, pangkat, jenis_anggota, simpanan, saldo_voucher) VALUES (?, ?, ?, 'PNS', 0, 0)",
        [nrp, nama, gol]
      );
      inserted++;
    } catch (e) {
      console.error(`Error PNS ${nrp}:`, e.message);
    }
  }
  console.log(`Imported ${inserted} PNS members.`);
}

async function getOrCreateSupplier(name) {
  const cleanName = name.replace(/[()]/g, '').trim();
  const [rows] = await pool.query("SELECT id_supplier FROM supplier WHERE nama_supplier = ?", [cleanName]);
  if (rows.length > 0) return rows[0].id_supplier;
  
  const [res] = await pool.query("INSERT INTO supplier (nama_supplier, is_active) VALUES (?, 1)", [cleanName]);
  return res.insertId;
}

const extractNumber = (str) => {
  if (!str) return 0;
  const num = parseInt(String(str).replace(/[^0-9]/g, ''));
  return isNaN(num) ? 0 : num;
};

async function importSwalayan() {
  const filePath = 'D:\\repo\\data_koperasi\\edited\\Copy of DATA BARANG KELUAR - MASUK 2026.xlsx';
  const wb = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  
  let currentSupplierId = null;
  let inserted = 0;

  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 3) continue;
    
    const col2 = row[2];
    const col3 = row[3];
    
    if (col3 === undefined && typeof col2 === 'string' && col2.startsWith('(')) {
      currentSupplierId = await getOrCreateSupplier(col2);
      continue; 
    }
    
    const barcode = col2 ? String(col2).trim() : null;
    const name = col3 ? String(col3).trim() : null;
    if (!name || !barcode) continue;

    const stok = extractNumber(row[6]);
    const hargaBeli = getRandomPrice(3000, 30000);
    const hargaJual = hargaBeli + getRandomPrice(1000, 5000);

    try {
      await pool.query(
        "INSERT IGNORE INTO barang (barcode, nama_barang, golongan, id_supplier, stok_swalayan, harga_beli, harga_swalayan, satuan_swalayan) VALUES (?, ?, 'Sembako / Lain-lain', ?, ?, ?, ?, 'PCS')",
        [barcode, name, currentSupplierId, stok, hargaBeli, hargaJual]
      );
      inserted++;
    } catch (e) {
      console.error(`Error Swalayan ${barcode}:`, e.message);
    }
  }
  console.log(`Imported ${inserted} Swalayan items.`);
}

async function importGrosir() {
  const filePath = 'D:\\repo\\data_koperasi\\DATA BARANG GROSIR 2026.xls';
  const wb = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  
  let inserted = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;
    
    let barcode = row[0] ? String(row[0]).trim() : null;
    let name = row[1] ? String(row[1]).trim() : null;
    if (!name || !barcode) continue;

    const qty = extractNumber(row[2]);
    let minBeli = 1;
    let satuan = 'PCS';

    // Parse A*B pattern
    const match = name.match(/(\d+)\s*\*\s*(\d+)/);
    if (match) {
      const A = parseInt(match[1]);
      const B = parseInt(match[2]);
      minBeli = A;
      const totalDus = A * B;
      name = name.replace(/(\d+)\s*\*\s*(\d+)/, `[Min Beli: ${A} | 1 Dus: ${totalDus} Pcs]`);
      satuan = 'Karton';
    }

    const hargaBeli = getRandomPrice(5000, 50000);
    const hargaJual = hargaBeli + getRandomPrice(2000, 10000);

    try {
      await pool.query(
        "INSERT IGNORE INTO barang (barcode, nama_barang, golongan, id_supplier, stok_grosir, harga_beli, harga_grosir, satuan_grosir, stok_minimal) VALUES (?, ?, 'Sembako / Lain-lain', NULL, ?, ?, ?, ?, ?)",
        [barcode, name, qty, hargaBeli, hargaJual, satuan, minBeli]
      );
      inserted++;
    } catch (e) {
      console.error(`Error Grosir ${barcode}:`, e.message);
    }
  }
  console.log(`Imported ${inserted} Grosir items.`);
}

async function main() {
  console.log("Starting data import...");
  await importMiliter();
  await importPNS();
  await importSwalayan();
  await importGrosir();
  console.log("Import completed!");
  process.exit(0);
}

main();

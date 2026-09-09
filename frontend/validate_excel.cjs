const xlsx = require('xlsx');
const path = require('path');

const checkMilitary = () => {
  const filePath = 'D:\\repo\\data_koperasi\\edited\\01. NOM MIL AGUSTUS 2026.xlsx';
  const wb = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json(wb.Sheets['NOM PUSDIK'], { header: 1 });
  
  let totalMembers = 0;
  let missingNrp = 0;
  let missingName = 0;
  const nrpSet = new Set();
  let duplicateNrp = 0;

  for (let i = 10; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 5) continue;
    
    // Some rows are just section headers like [ <2 empty items>, 'LETKOL' ]
    if (!row[0] || String(row[0]).trim() === '') continue; 
    
    // Column 2 = NAMA, 4 = NRP
    const name = row[2];
    const nrp = row[4];
    
    if (name && nrp) {
      totalMembers++;
      if (nrpSet.has(nrp)) duplicateNrp++;
      nrpSet.add(nrp);
    } else {
      // It might be a valid row but missing NRP or Name
      if (name && !nrp) missingNrp++;
      if (!name && nrp) missingName++;
    }
  }
  
  console.log('--- MILITER ---');
  console.log(`Total valid members found: ${totalMembers}`);
  console.log(`Missing NRP for named rows: ${missingNrp}`);
  console.log(`Missing Name for NRP rows: ${missingName}`);
  console.log(`Duplicate NRPs: ${duplicateNrp}`);
};

const checkPNS = () => {
  const filePath = 'D:\\repo\\data_koperasi\\edited\\PNS Agustus 2026.xlsx';
  const wb = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  
  let totalMembers = 0;
  const nrpSet = new Set();

  for (let i = 3; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 3) continue;
    
    const nrp = row[1];
    const name = row[2];
    if (nrp && name) {
      totalMembers++;
      nrpSet.add(nrp);
    }
  }
  
  console.log('\n--- PNS ---');
  console.log(`Total valid members found: ${totalMembers}`);
  console.log(`Duplicate NRPs: ${totalMembers - nrpSet.size}`);
};

const checkSwalayan = () => {
  const filePath = 'D:\\repo\\data_koperasi\\edited\\Copy of DATA BARANG KELUAR - MASUK 2026.xlsx';
  const wb = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  
  let totalItems = 0;
  let emptyBarcode = 0;
  const barcodeSet = new Set();
  let duplicateBarcode = 0;

  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 4) continue;
    
    const barcode = row[2];
    const name = row[3];
    
    // Ignore supplier headers like [ 1, 46179, '(PADJENG)' ]
    if (name === undefined && typeof barcode === 'string' && barcode.startsWith('(')) {
      continue; 
    }
    
    if (name) {
      totalItems++;
      if (barcode) {
        if (barcodeSet.has(barcode)) duplicateBarcode++;
        barcodeSet.add(barcode);
      } else {
        emptyBarcode++;
      }
    }
  }
  console.log('\n--- SWALAYAN BARANG ---');
  console.log(`Total items found: ${totalItems}`);
  console.log(`Missing Barcode: ${emptyBarcode}`);
  console.log(`Duplicate Barcodes: ${duplicateBarcode}`);
};

const checkGrosir = () => {
  const filePath = 'D:\\repo\\data_koperasi\\DATA BARANG GROSIR 2026.xls';
  const wb = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  
  let totalItems = 0;
  let emptyBarcode = 0;
  const barcodeSet = new Set();
  let duplicateBarcode = 0;
  let formatPcsKarton = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;
    
    const barcode = row[0];
    const name = row[1];
    
    if (name) {
      totalItems++;
      if (barcode) {
        if (barcodeSet.has(barcode)) duplicateBarcode++;
        barcodeSet.add(barcode);
      } else {
        emptyBarcode++;
      }
      if (String(name).includes('*')) {
        formatPcsKarton++;
      }
    }
  }
  console.log('\n--- GROSIR BARANG ---');
  console.log(`Total items found: ${totalItems}`);
  console.log(`Missing Kode: ${emptyBarcode}`);
  console.log(`Duplicate Kodes: ${duplicateBarcode}`);
  console.log(`Items with A*B format: ${formatPcsKarton}`);
};

try {
  checkMilitary();
  checkPNS();
  checkSwalayan();
  checkGrosir();
} catch(e) {
  console.error("Validation error:", e);
}

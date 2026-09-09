const xlsx = require('xlsx');

const checkSwalayanDuplicates = () => {
  const filePath = 'D:\\repo\\data_koperasi\\edited\\Copy of DATA BARANG KELUAR - MASUK 2026.xlsx';
  const wb = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  
  const barcodeMap = new Map();
  let currentSupplier = 'UNKNOWN';

  console.log('--- SWALAYAN DUPLICATES ---');
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 3) continue;
    
    const col2 = row[2]; // Barcode or Supplier Name
    const col3 = row[3]; // Item Name
    
    // Check if it's a supplier header row: No item name, but has supplier string in col2
    if (col3 === undefined && typeof col2 === 'string' && col2.startsWith('(')) {
      currentSupplier = col2;
      continue; 
    }
    
    const barcode = col2;
    const name = col3;
    
    if (name && barcode) {
      if (barcodeMap.has(barcode)) {
        const existing = barcodeMap.get(barcode);
        console.log(`\nDuplicate Barcode: ${barcode}`);
        console.log(`1. [${existing.supplier}] ${existing.name}`);
        console.log(`2. [${currentSupplier}] ${name}`);
      } else {
        barcodeMap.set(barcode, { name, supplier: currentSupplier });
      }
    }
  }
};

checkSwalayanDuplicates();

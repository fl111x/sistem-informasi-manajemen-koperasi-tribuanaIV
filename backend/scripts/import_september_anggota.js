const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
const path = require('path');

const milPath = 'D:/repo/data_koperasi/edited/01. NOM MIL SEPTEMBER 2026.xlsx';
const asnPath = 'D:/repo/data_koperasi/edited/02 NOM ASN SEPTEMBER 2026.xls';

function parseMiliter() {
  const wb = XLSX.readFile(milPath);
  const list = [];
  for (let sheetName of ['NOM PUSDIK', 'LF PUSDIK']) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    for (let r of rows) {
      if (!r || r.length < 5) continue;
      const nama = r[2];
      const pangkat = r[3];
      const nrp = String(r[4] || '').trim();
      if (typeof nama === 'string' && nama.trim().length > 2 && nrp && /^\d+$/.test(nrp)) {
        list.push({ nrp, nama: nama.trim(), pangkat: String(pangkat || '-').trim(), jenis_anggota: 'Militer' });
      }
    }
  }
  return list;
}

function parseASN() {
  const wb = XLSX.readFile(asnPath);
  const list = [];
  for (let sheetName of ['NOM PNS', 'NOM LF', 'NOM PPPK']) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    for (let r of rows) {
      if (!r || r.length < 5) continue;
      const nama = r[2];
      const pangkat = r[3];
      const nip = String(r[4] || '').trim();
      if (typeof nama === 'string' && nama.trim().length > 2 && nip && /^\d+$/.test(nip)) {
        list.push({ nrp: nip, nama: nama.trim(), pangkat: String(pangkat || '-').trim(), jenis_anggota: 'PNS' });
      }
    }
  }
  return list;
}

async function importData() {
  let connection;
  try {
    console.log('🔄 Membaca berkas Excel September 2026...');
    const militerList = parseMiliter();
    const asnList = parseASN();
    
    // Deduplicate by NRP
    const mapByNrp = new Map();
    for (let item of [...militerList, ...asnList]) {
      if (!mapByNrp.has(item.nrp)) {
        mapByNrp.set(item.nrp, item);
      }
    }
    const allMembers = Array.from(mapByNrp.values());
    console.log(`📋 Total data nominatif unik September: ${allMembers.length} anggota (${militerList.length} Militer, ${asnList.length} PNS).`);

    connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'db_koperasi'
    });

    // Fetch existing NRPs
    const [existingRows] = await connection.execute('SELECT nrp, saldo_voucher FROM Anggota');
    const existingMap = new Map();
    existingRows.forEach(r => existingMap.set(String(r.nrp), r));

    let insertedCount = 0;
    let updatedCount = 0;

    for (let m of allMembers) {
      if (existingMap.has(m.nrp)) {
        // Update existing member details
        await connection.execute(
          'UPDATE Anggota SET nama = ?, pangkat = ?, jenis_anggota = ?, is_active = 1 WHERE nrp = ?',
          [m.nama, m.pangkat, m.jenis_anggota, m.nrp]
        );
        updatedCount++;
      } else {
        // Insert new member with default 100.000 voucher
        await connection.execute(
          'INSERT INTO Anggota (nrp, nama, pangkat, jenis_anggota, saldo_voucher, is_active) VALUES (?, ?, ?, ?, ?, 1)',
          [m.nrp, m.nama, m.pangkat, m.jenis_anggota, 100000]
        );
        insertedCount++;
      }
    }

    const [totalActiveRows] = await connection.execute('SELECT COUNT(*) as total FROM Anggota WHERE is_active = 1');
    const totalActive = totalActiveRows[0].total;

    console.log(`✅ BERHASIL MENGIMPOR DATA NOMINATIF ANGGOTA SEPTEMBER 2026:`);
    console.log(`   - Anggota Baru Ditambahkan : ${insertedCount}`);
    console.log(`   - Anggota Lama Diperbarui   : ${updatedCount}`);
    console.log(`   - Total Anggota Aktif Sekarang : ${totalActive}`);

  } catch (error) {
    console.error('❌ Terjadi kesalahan saat mengimpor:', error);
  } finally {
    if (connection) await connection.end();
  }
}

importData();

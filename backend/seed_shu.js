const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'koperasi_tribuana',
  });

  try {
    console.log('Menghapus data lama...');
    await db.query('DELETE FROM detail_transaksi');
    await db.query('DELETE FROM transaksi');
    await db.query('DELETE FROM anggota');

    const totalAnggota = 773;
    const totalBelanja = 4357653250;
    
    const pangkats = ['Kopda', 'Koptu', 'Kopka', 'Serda', 'Sertu', 'Serka', 'Serma', 'Pelda', 'Peltu', 'PNS'];

    console.log('Generate transaksi acak...');
    let parts = [];
    let remaining = totalBelanja;
    for (let i = 0; i < totalAnggota - 1; i++) {
        // Average needed for the rest
        let avg = remaining / (totalAnggota - i);
        // Random value between 0.5 avg and 1.5 avg
        let val = Math.floor(avg * (0.5 + Math.random()));
        parts.push(val);
        remaining -= val;
    }
    parts.push(remaining);

    // Shuffle the parts so the last one isn't predictably different
    parts.sort(() => Math.random() - 0.5);

    console.log('Mulai insert Anggota dan Transaksi...');
    for (let i = 0; i < totalAnggota; i++) {
      const nrp = 'NRP' + String(10000 + i);
      const nama = 'Anggota ' + (i + 1);
      const pangkat = pangkats[Math.floor(Math.random() * pangkats.length)];
      
      // Insert anggota
      await db.query(
        'INSERT INTO anggota (nrp, nama, pangkat, is_active) VALUES (?, ?, ?, 1)',
        [nrp, nama, pangkat]
      );

      // Insert transaksi
      const bayar = parts[i];
      await db.query(
        'INSERT INTO transaksi (waktu_transaksi, total_bayar, metode_pembayaran, jenis_transaksi, nrp) VALUES (NOW(), ?, ?, ?, ?)',
        [bayar, 'Cash', 'Swalayan', nrp]
      );
    }

    // Verify
    const [rows] = await db.query('SELECT COUNT(*) as count, SUM(total_bayar) as sum FROM transaksi');
    console.log(`Berhasil! Total Anggota/Transaksi: ${rows[0].count}, Total Belanja: ${rows[0].sum}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.end();
  }
}

run();

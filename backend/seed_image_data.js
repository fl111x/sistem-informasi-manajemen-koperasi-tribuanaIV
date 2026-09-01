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
    console.log('Menghapus data transaksi dan pembelian lama...');
    await db.query('DELETE FROM detail_transaksi');
    await db.query('DELETE FROM transaksi');
    await db.query('DELETE FROM detail_pembelian');
    await db.query('DELETE FROM pembelian');

    const data = [
      { tanggal: '2026-07-28', jualCash: 22606500, jualKredit: 39272800, beliCash: 0, beliKredit: 33821628 },
      { tanggal: '2026-07-29', jualCash: 17785300, jualKredit: 7091700, beliCash: 0, beliKredit: 26474916 },
      { tanggal: '2026-07-30', jualCash: 24457600, jualKredit: 43155000, beliCash: 0, beliKredit: 27399974 },
      { tanggal: '2026-07-31', jualCash: 17404900, jualKredit: 76742300, beliCash: 208956396, beliKredit: 29342821 },
      { tanggal: '2026-08-01', jualCash: 36618300, jualKredit: 1980200, beliCash: 0, beliKredit: 13561000 },
      { tanggal: '2026-08-02', jualCash: 24378800, jualKredit: 665700, beliCash: 0, beliKredit: 0 },
      { tanggal: '2026-08-03', jualCash: 70607500, jualKredit: 3497900, beliCash: 0, beliKredit: 44516030 },
      { tanggal: '2026-08-04', jualCash: 28957600, jualKredit: 7496000, beliCash: 0, beliKredit: 27592485 },
      { tanggal: '2026-08-05', jualCash: 32446100, jualKredit: 1062900, beliCash: 0, beliKredit: 13977486 },
      { tanggal: '2026-08-06', jualCash: 26056900, jualKredit: 5783300, beliCash: 0, beliKredit: 38893972 },
      { tanggal: '2026-08-07', jualCash: 29172500, jualKredit: 1480300, beliCash: 0, beliKredit: 37013586 },
      { tanggal: '2026-08-08', jualCash: 35571500, jualKredit: 2431800, beliCash: 0, beliKredit: 400000 },
      { tanggal: '2026-08-09', jualCash: 22665900, jualKredit: 80800, beliCash: 0, beliKredit: 0 },
      { tanggal: '2026-08-10', jualCash: 21343100, jualKredit: 2671100, beliCash: 90565409, beliKredit: 69759030 },
      { tanggal: '2026-08-11', jualCash: 25399800, jualKredit: 32648200, beliCash: 19478250, beliKredit: 35371708 },
      { tanggal: '2026-08-12', jualCash: 19779500, jualKredit: 3401400, beliCash: 7411026, beliKredit: 30292128 },
      { tanggal: '2026-08-13', jualCash: 16594200, jualKredit: 2326300, beliCash: 35800399, beliKredit: 33729197 },
      { tanggal: '2026-08-14', jualCash: 23140700, jualKredit: 759200, beliCash: 7632000, beliKredit: 63954494 },
      { tanggal: '2026-08-15', jualCash: 20426400, jualKredit: 6959500, beliCash: 0, beliKredit: 87917658 },
      { tanggal: '2026-08-16', jualCash: 23781700, jualKredit: 824700, beliCash: 0, beliKredit: 0 },
      { tanggal: '2026-08-17', jualCash: 20970600, jualKredit: 658900, beliCash: 0, beliKredit: 0 },
      { tanggal: '2026-08-18', jualCash: 55113900, jualKredit: 14785900, beliCash: 23088001, beliKredit: 138189959 },
      { tanggal: '2026-08-19', jualCash: 26020400, jualKredit: 3103800, beliCash: 23422000, beliKredit: 19069860 },
      { tanggal: '2026-08-20', jualCash: 16754200, jualKredit: 11695000, beliCash: 4579501, beliKredit: 130850949 },
      { tanggal: '2026-08-21', jualCash: 25091400, jualKredit: 2398600, beliCash: 1748950, beliKredit: 29280656 },
      { tanggal: '2026-08-22', jualCash: 36175300, jualKredit: 2781700, beliCash: 0, beliKredit: 0 },
      { tanggal: '2026-08-23', jualCash: 31334800, jualKredit: 2305600, beliCash: 0, beliKredit: 0 },
      { tanggal: '2026-08-24', jualCash: 21264800, jualKredit: 12355900, beliCash: 0, beliKredit: 0 },
      { tanggal: '2026-08-25', jualCash: 21405600, jualKredit: 13397500, beliCash: 0, beliKredit: 0 },
      { tanggal: '2026-08-26', jualCash: 15940800, jualKredit: 2248600, beliCash: 0, beliKredit: 0 }
    ];

    console.log('Mulai memasukkan data...');
    
    // Asumsi ada id_supplier = 1, jika tidak ada, kita bikin sementara
    await db.query('INSERT IGNORE INTO supplier (id_supplier, nama_supplier, alamat) VALUES (1, "Supplier Dummy", "-")');

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const datetime = row.tanggal + ' 12:00:00';
      
      // Jual Cash
      if (row.jualCash > 0) {
        await db.query(
          'INSERT INTO transaksi (waktu_transaksi, total_bayar, metode_pembayaran, jenis_transaksi) VALUES (?, ?, "Cash", "Swalayan")',
          [datetime, row.jualCash]
        );
      }
      
      // Jual Kredit
      if (row.jualKredit > 0) {
        await db.query(
          'INSERT INTO transaksi (waktu_transaksi, total_bayar, metode_pembayaran, jenis_transaksi) VALUES (?, ?, "Kredit", "Swalayan")',
          [datetime, row.jualKredit]
        );
      }
      
      // Beli Cash
      if (row.beliCash > 0) {
        await db.query(
          'INSERT INTO pembelian (kategori, id_supplier, id_pengguna, waktu_pembelian, total_biaya, metode_pembayaran, status) VALUES ("Swalayan", 1, 1, ?, ?, "Cash", "Diterima")',
          [datetime, row.beliCash]
        );
      }
      
      // Beli Kredit
      if (row.beliKredit > 0) {
        await db.query(
          'INSERT INTO pembelian (kategori, id_supplier, id_pengguna, waktu_pembelian, total_biaya, metode_pembayaran, status) VALUES ("Swalayan", 1, 1, ?, ?, "Tempo", "Diterima")',
          [datetime, row.beliKredit]
        );
      }
    }

    console.log('Selesai!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.end();
  }
}

run();

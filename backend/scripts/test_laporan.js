const db = require('../src/config/db');

async function test() {
  const bulan = 8;
  const tahun = 2026;
  const [penjualanPerHari] = await db.execute(`
      SELECT 
        DATE_FORMAT(waktu_transaksi, '%Y-%m-%d') as tanggal,
        SUM(total_bayar) as total_omzet,
        SUM(CASE WHEN metode_pembayaran = 'Cash' THEN total_bayar ELSE 0 END) as total_cash,
        SUM(CASE WHEN metode_pembayaran = 'Kredit' THEN total_bayar ELSE 0 END) as total_kredit
      FROM Transaksi
      WHERE MONTH(waktu_transaksi) = ? AND YEAR(waktu_transaksi) = ? AND total_bayar > 0
      GROUP BY tanggal
      ORDER BY tanggal ASC
    `, [bulan, tahun]);

  console.log("Penjualan Per Hari:", JSON.stringify(penjualanPerHari, null, 2));
  process.exit(0);
}

test();

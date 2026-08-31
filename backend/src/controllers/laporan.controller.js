const db = require('../config/db');

// GET /api/laporan/harian?tanggal=YYYY-MM-DD
const getLaporanHarian = async (req, res) => {
  try {
    let { tanggal } = req.query;
    if (!tanggal) {
      // Default to today (YYYY-MM-DD local time)
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      tanggal = now.toISOString().split('T')[0];
    }

    // Omzet Penjualan Kasir (Total, Cash, Kredit, Grosir, Swalayan)
    const [penjualan] = await db.execute(`
      SELECT 
        SUM(total_bayar) as total_omzet,
        SUM(CASE WHEN metode_pembayaran = 'Cash' THEN total_bayar ELSE 0 END) as total_cash,
        SUM(CASE WHEN metode_pembayaran = 'Kredit' THEN total_bayar ELSE 0 END) as total_kredit,
        SUM(CASE WHEN jenis_transaksi = 'Swalayan' THEN total_bayar ELSE 0 END) as total_swalayan,
        SUM(CASE WHEN jenis_transaksi = 'Grosir' THEN total_bayar ELSE 0 END) as total_grosir,
        COUNT(id_transaksi) as total_transaksi
      FROM Transaksi 
      WHERE DATE(waktu_transaksi) = ? AND total_bayar > 0
    `, [tanggal]);

    // Rincian transaksi hari ini
    const [transaksiRows] = await db.execute(`
      SELECT t.id_transaksi, t.waktu_transaksi, t.total_bayar, t.metode_pembayaran, t.jenis_transaksi,
             p.nama_pengguna as nama_kasir, a.nama as nama_anggota
      FROM Transaksi t
      LEFT JOIN Pengguna p ON t.id_pengguna = p.id_pengguna
      LEFT JOIN Anggota a ON t.nrp = a.nrp
      WHERE DATE(t.waktu_transaksi) = ?
      ORDER BY t.waktu_transaksi DESC
    `, [tanggal]);

    // Pengeluaran Pembelian (Belanja Gudang)
    const [pembelian] = await db.execute(`
      SELECT 
        SUM(total_biaya) as total_pengeluaran,
        SUM(CASE WHEN metode_pembayaran = 'Cash' THEN total_biaya ELSE 0 END) as total_beli_cash,
        SUM(CASE WHEN metode_pembayaran = 'Tempo' THEN total_biaya ELSE 0 END) as total_beli_kredit
      FROM pembelian
      WHERE DATE(waktu_pembelian) = ? AND status != 'Batal'
    `, [tanggal]);

    // Uang Fisik Kasir (Omzet Cash hari ini, belum dikurangi pembelian jika kasirnya beda, tapi kita gabung infonya)
    // Asumsi: Balancing fisik kasir fokus ke \`total_cash\` penjualan.

    res.status(200).json({
      tanggal,
      ringkasan: {
        penjualan: penjualan[0],
        pembelian: pembelian[0]
      },
      rincian_transaksi: transaksiRows
    });

  } catch (error) {
    console.error('Error fetching laporan harian:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal' });
  }
};

// GET /api/laporan/bulanan?bulan=MM&tahun=YYYY
const getLaporanBulanan = async (req, res) => {
  try {
    let { bulan, tahun } = req.query;
    if (!bulan || !tahun) {
      const now = new Date();
      bulan = now.getMonth() + 1;
      tahun = now.getFullYear();
    }

    // Rekap Penjualan per hari
    const [penjualanPerHari] = await db.execute(`
      SELECT 
        DATE(waktu_transaksi) as tanggal,
        SUM(total_bayar) as total_omzet,
        SUM(CASE WHEN metode_pembayaran = 'Cash' THEN total_bayar ELSE 0 END) as total_cash,
        SUM(CASE WHEN metode_pembayaran = 'Kredit' THEN total_bayar ELSE 0 END) as total_kredit
      FROM Transaksi
      WHERE MONTH(waktu_transaksi) = ? AND YEAR(waktu_transaksi) = ? AND total_bayar > 0
      GROUP BY DATE(waktu_transaksi)
      ORDER BY tanggal ASC
    `, [bulan, tahun]);

    // Rekap Pembelian per hari
    const [pembelianPerHari] = await db.execute(`
      SELECT 
        DATE(waktu_pembelian) as tanggal,
        SUM(total_biaya) as total_pengeluaran,
        SUM(CASE WHEN metode_pembayaran = 'Cash' THEN total_biaya ELSE 0 END) as total_beli_cash,
        SUM(CASE WHEN metode_pembayaran = 'Tempo' THEN total_biaya ELSE 0 END) as total_beli_kredit
      FROM pembelian
      WHERE MONTH(waktu_pembelian) = ? AND YEAR(waktu_pembelian) = ? AND status != 'Batal'
      GROUP BY DATE(waktu_pembelian)
      ORDER BY tanggal ASC
    `, [bulan, tahun]);

    res.status(200).json({
      periode: { bulan, tahun },
      penjualan: penjualanPerHari,
      pembelian: pembelianPerHari
    });

  } catch (error) {
    console.error('Error fetching laporan bulanan:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal' });
  }
};

// GET /api/laporan/tahunan?tahun=YYYY
const getLaporanTahunan = async (req, res) => {
  try {
    let { tahun } = req.query;
    if (!tahun) {
      tahun = new Date().getFullYear();
    }

    // Rekap Penjualan per bulan
    const [penjualanPerBulan] = await db.execute(`
      SELECT 
        MONTH(waktu_transaksi) as bulan,
        SUM(total_bayar) as total_omzet,
        SUM(total_keuntungan) as total_keuntungan
      FROM Transaksi
      WHERE YEAR(waktu_transaksi) = ? AND total_bayar > 0
      GROUP BY MONTH(waktu_transaksi)
      ORDER BY bulan ASC
    `, [tahun]);

    // Rekap Pembelian per bulan
    const [pembelianPerBulan] = await db.execute(`
      SELECT 
        MONTH(waktu_pembelian) as bulan,
        SUM(total_biaya) as total_pengeluaran
      FROM pembelian
      WHERE YEAR(waktu_pembelian) = ? AND status != 'Batal'
      GROUP BY MONTH(waktu_pembelian)
      ORDER BY bulan ASC
    `, [tahun]);

    res.status(200).json({
      tahun,
      penjualan: penjualanPerBulan,
      pembelian: pembelianPerBulan
    });

  } catch (error) {
    console.error('Error fetching laporan tahunan:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal' });
  }
};

module.exports = {
  getLaporanHarian,
  getLaporanBulanan,
  getLaporanTahunan
};

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

// GET /api/laporan/bulanan?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
const getLaporanBulanan = async (req, res) => {
  try {
    let { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      endDate = now.toISOString().split('T')[0];
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    }

    // Rekap Penjualan per hari
    const [penjualanPerHari] = await db.execute(`
      SELECT 
        DATE_FORMAT(waktu_transaksi, '%Y-%m-%d') as tanggal,
        SUM(total_bayar) as total_omzet,
        SUM(CASE WHEN metode_pembayaran = 'Cash' THEN total_bayar ELSE 0 END) as total_cash,
        SUM(CASE WHEN metode_pembayaran = 'Kredit' THEN total_bayar ELSE 0 END) as total_kredit
      FROM Transaksi
      WHERE DATE(waktu_transaksi) >= ? AND DATE(waktu_transaksi) <= ? AND total_bayar > 0
      GROUP BY tanggal
      ORDER BY tanggal ASC
    `, [startDate, endDate]);

    // Rekap Pembelian per hari
    const [pembelianPerHari] = await db.execute(`
      SELECT 
        DATE_FORMAT(waktu_pembelian, '%Y-%m-%d') as tanggal,
        SUM(total_biaya) as total_pengeluaran,
        SUM(CASE WHEN metode_pembayaran = 'Cash' THEN total_biaya ELSE 0 END) as total_beli_cash,
        SUM(CASE WHEN metode_pembayaran = 'Tempo' THEN total_biaya ELSE 0 END) as total_beli_kredit
      FROM pembelian
      WHERE DATE(waktu_pembelian) >= ? AND DATE(waktu_pembelian) <= ? AND status != 'Batal'
      GROUP BY tanggal
      ORDER BY tanggal ASC
    `, [startDate, endDate]);

    res.status(200).json({
      periode: { startDate, endDate },
      penjualan: penjualanPerHari,
      pembelian: pembelianPerHari
    });

  } catch (error) {
    console.error('Error fetching laporan bulanan:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal' });
  }
};

// GET /api/laporan/tahunan?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
const getLaporanTahunan = async (req, res) => {
  try {
    let { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      endDate = now.toISOString().split('T')[0];
      startDate = `${now.getFullYear()}-01-01`;
    }

    // Rekap Penjualan per bulan
    const [penjualanPerBulan] = await db.execute(`
      SELECT 
        DATE_FORMAT(waktu_transaksi, '%Y-%m') as bulan,
        SUM(total_bayar) as total_omzet,
        SUM(total_keuntungan) as total_keuntungan
      FROM Transaksi
      WHERE DATE(waktu_transaksi) >= ? AND DATE(waktu_transaksi) <= ? AND total_bayar > 0
      GROUP BY DATE_FORMAT(waktu_transaksi, '%Y-%m')
      ORDER BY bulan ASC
    `, [startDate, endDate]);

    // Rekap Pembelian per bulan
    const [pembelianPerBulan] = await db.execute(`
      SELECT 
        DATE_FORMAT(waktu_pembelian, '%Y-%m') as bulan,
        SUM(total_biaya) as total_pengeluaran
      FROM pembelian
      WHERE DATE(waktu_pembelian) >= ? AND DATE(waktu_pembelian) <= ? AND status != 'Batal'
      GROUP BY DATE_FORMAT(waktu_pembelian, '%Y-%m')
      ORDER BY bulan ASC
    `, [startDate, endDate]);

    res.status(200).json({
      periode: { startDate, endDate },
      penjualan: penjualanPerBulan,
      pembelian: pembelianPerBulan
    });

  } catch (error) {
    console.error('Error fetching laporan tahunan:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal' });
  }
};

// POST /api/laporan/shu
const getLaporanSHU = async (req, res) => {
  try {
    const { 
      total_shu = 494582400,
      porsi_simpanan = 50, 
      porsi_belanja = 25, 
      porsi_bagi_rata = 25 
    } = req.body;

    // 1. Fetch Anggota Aktif
    const [anggotaRows] = await db.execute(`
      SELECT nrp, nama, pangkat
      FROM Anggota
      WHERE is_active = 1
    `);

    // 2. Fetch Riwayat Belanja per Anggota
    const [belanjaRows] = await db.execute(`
      SELECT nrp, SUM(total_bayar) as total_belanja
      FROM Transaksi
      WHERE nrp IS NOT NULL AND total_bayar > 0
      GROUP BY nrp
    `);

    // Map total_belanja per NRP
    const mapBelanja = {};
    let jumlahPembelianAnggota = 0;
    belanjaRows.forEach(row => {
      const bayar = parseFloat(row.total_belanja);
      mapBelanja[row.nrp] = bayar;
      jumlahPembelianAnggota += bayar;
    });

    // 3. Hitung Total Alokasi (Jumlah Jasa)
    const totalSHUDistribusi = parseFloat(total_shu) || 494582400;
    
    // Sesuai request, fitur simpanan ditunda sehingga jasa simpanan diset ke 0
    // const jasaSimpananTotal = totalSHUDistribusi * (parseFloat(porsi_simpanan) / 100);
    const jasaBelanjaTotal = totalSHUDistribusi * (parseFloat(porsi_belanja) / 100);
    const jasaBagiRataTotal = totalSHUDistribusi * (parseFloat(porsi_bagi_rata) / 100);

    const jumlahAnggotaKoperasi = anggotaRows.length || 1;

    const jasaBagiRataPerOrang = jasaBagiRataTotal / jumlahAnggotaKoperasi;

    const simulasiAnggota = anggotaRows.map(anggota => {
      const jumlahSimpanan = 0; // Fitur simpanan ditunda
      const jumlahBelanjaan = mapBelanja[anggota.nrp] || 0;
      
      const shuSimpanan = 0; // Fitur simpanan ditunda
        
      const shuBelanja = jumlahPembelianAnggota > 0 
        ? (jumlahBelanjaan * jasaBelanjaTotal) / jumlahPembelianAnggota 
        : 0;
        
      const shuBagiRata = jasaBagiRataPerOrang;
      
      const jumlahJasa = shuSimpanan + shuBelanja + shuBagiRata;

      return {
        nrp: anggota.nrp,
        nama: anggota.nama,
        pangkat: anggota.pangkat || '-',
        simpanan: jumlahSimpanan,
        belanja: jumlahBelanjaan,
        shu_simpanan: shuSimpanan,
        shu_belanja: shuBelanja,
        shu_bagirata: shuBagiRata,
        total_diterima: jumlahJasa
      };
    });

    simulasiAnggota.sort((a, b) => b.total_diterima - a.total_diterima);

    res.status(200).json(simulasiAnggota);

  } catch (error) {
    console.error('Error calculating SHU:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal' });
  }
};

module.exports = {
  getLaporanHarian,
  getLaporanBulanan,
  getLaporanTahunan,
  getLaporanSHU
};

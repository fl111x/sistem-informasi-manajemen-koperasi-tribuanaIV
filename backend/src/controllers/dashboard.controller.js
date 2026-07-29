const db = require('../config/db');

const getDashboardData = async (req, res) => {
  try {
    const queryOmzet = `
      SELECT 
        jenis_transaksi,
        COALESCE(SUM(total_bayar), 0) as total_omzet
      FROM Transaksi 
      WHERE waktu_transaksi >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY jenis_transaksi
    `;
    const [omzetSektor] = await db.execute(queryOmzet);

    const queryGrafik = `
      SELECT 
        DATE(waktu_transaksi) as tanggal,
        SUM(CASE WHEN jenis_transaksi = 'Swalayan' THEN total_bayar ELSE 0 END) as omzet_swalayan,
        SUM(CASE WHEN jenis_transaksi = 'Grosir' THEN total_bayar ELSE 0 END) as omzet_grosir
      FROM Transaksi 
      WHERE waktu_transaksi >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(waktu_transaksi)
      ORDER BY tanggal ASC
    `;
    const [grafik] = await db.execute(queryGrafik);

    const queryTransaksi = `
      SELECT 
        t.id_transaksi as nota,
        t.waktu_transaksi as waktu,
        t.jenis_transaksi as sektor,
        p.nama_pengguna as kasir,
        t.total_bayar as total
      FROM Transaksi t
      LEFT JOIN Pengguna p ON t.id_pengguna = p.id_pengguna
      ORDER BY t.waktu_transaksi DESC
      LIMIT 5
    `;
    const [transaksi] = await db.execute(queryTransaksi);

    const queryStok = `
      SELECT 
        nama_barang as nama,
        barcode as kode,
        stok_swalayan,
        stok_grosir,
        stok_minimal as min
      FROM Barang 
      WHERE stok_swalayan <= stok_minimal OR stok_grosir <= stok_minimal
      ORDER BY nama_barang ASC
    `;
    const [peringatanStok] = await db.execute(queryStok);

    let omzetSwalayan = 0;
    let omzetGrosir = 0;

    omzetSektor.forEach((item) => {
      if (item.jenis_transaksi === 'Swalayan') {
        omzetSwalayan = parseFloat(item.total_omzet);
      } else if (item.jenis_transaksi === 'Grosir') {
        omzetGrosir = parseFloat(item.total_omzet);
      }
    });

    const totalOmzet = omzetSwalayan + omzetGrosir;
    const stokKritis = peringatanStok.length;

    // Helper to format currency
    const formatRp = (angka) => {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    };

    // Mapping grafik data for frontend
    const hariMap = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const dataGrafik = grafik.map((g) => {
      const d = new Date(g.tanggal);
      return {
        hari: hariMap[d.getDay()],
        swalayan: parseFloat(g.omzet_swalayan),
        grosir: parseFloat(g.omzet_grosir)
      };
    });

    // Formatting transactions
    const transaksiTerbaru = transaksi.map((t) => {
      const d = new Date(t.waktu);
      return {
        nota: `TRX-${t.nota}`,
        waktu: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        sektor: t.sektor,
        kasir: t.kasir || 'Sistem',
        total: formatRp(t.total)
      };
    });

    res.status(200).json({
      ringkasan: {
        omzetSwalayan: formatRp(omzetSwalayan),
        omzetGrosir: formatRp(omzetGrosir),
        totalOmzet: formatRp(totalOmzet),
        stokKritis: stokKritis
      },
      dataGrafik,
      transaksiTerbaru,
      peringatanStok
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal saat memuat dashboard' });
  }
};

module.exports = {
  getDashboardData
};

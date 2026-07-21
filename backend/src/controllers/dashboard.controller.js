const DashboardModel = require('../models/DashboardModel');

const getDashboardData = async (req, res) => {
  try {
    const omzetSektor = await DashboardModel.getOmzet7Hari();
    const grafik = await DashboardModel.getGrafik7Hari();
    const transaksi = await DashboardModel.getTransaksiTerbaru();
    const peringatanStok = await DashboardModel.getStokKritis();

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

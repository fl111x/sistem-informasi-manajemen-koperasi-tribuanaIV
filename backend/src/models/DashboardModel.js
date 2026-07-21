const db = require('../config/db');

class DashboardModel {
  static async getOmzet7Hari() {
    const query = `
      SELECT 
        jenis_transaksi,
        COALESCE(SUM(total_bayar), 0) as total_omzet
      FROM Transaksi 
      WHERE waktu_transaksi >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY jenis_transaksi
    `;
    const [rows] = await db.execute(query);
    return rows;
  }

  static async getGrafik7Hari() {
    const query = `
      SELECT 
        DATE(waktu_transaksi) as tanggal,
        SUM(CASE WHEN jenis_transaksi = 'Swalayan' THEN total_bayar ELSE 0 END) as omzet_swalayan,
        SUM(CASE WHEN jenis_transaksi = 'Grosir' THEN total_bayar ELSE 0 END) as omzet_grosir
      FROM Transaksi 
      WHERE waktu_transaksi >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(waktu_transaksi)
      ORDER BY tanggal ASC
    `;
    const [rows] = await db.execute(query);
    return rows;
  }

  static async getTransaksiTerbaru() {
    const query = `
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
    const [rows] = await db.execute(query);
    return rows;
  }

  static async getStokKritis() {
    // A item is critical if its swalayan stock OR grosir stock is <= stok_minimal
    const query = `
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
    const [rows] = await db.execute(query);
    return rows;
  }
}

module.exports = DashboardModel;

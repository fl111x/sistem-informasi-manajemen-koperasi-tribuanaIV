const db = require('../config/db');

class TransaksiModel {
  static async findAll() {
    const [transaksi] = await db.execute(`
      SELECT t.*, p.nama_pengguna as nama_kasir 
      FROM Transaksi t 
      LEFT JOIN Pengguna p ON t.id_pengguna = p.id_pengguna
      ORDER BY t.waktu_transaksi DESC
    `);
    return transaksi;
  }

  static async findById(id) {
    // Get header
    const [transaksi] = await db.execute(`
      SELECT t.*, p.nama_pengguna as nama_kasir 
      FROM Transaksi t 
      LEFT JOIN Pengguna p ON t.id_pengguna = p.id_pengguna
      WHERE t.id_transaksi = ?
    `, [id]);

    if (transaksi.length === 0) return null;

    // Get details
    const [details] = await db.execute(`
      SELECT dt.*, b.nama_barang, b.barcode, b.satuan_swalayan, b.satuan_grosir 
      FROM detail_transaksi dt
      JOIN Barang b ON dt.id_barang = b.id_barang
      WHERE dt.id_transaksi = ?
    `, [id]);

    return {
      ...transaksi[0],
      items: details
    };
  }

  static async createTransaction(data) {
    const { jenis_transaksi, total_bayar, items, id_pengguna } = data;
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const waktu_transaksi = new Date();

      const [transaksiResult] = await connection.execute(
        'INSERT INTO Transaksi (waktu_transaksi, total_bayar, jenis_transaksi, id_pengguna) VALUES (?, ?, ?, ?)',
        [waktu_transaksi, total_bayar || 0, jenis_transaksi, id_pengguna]
      );

      const id_transaksi = transaksiResult.insertId;
      let calculatedTotal = 0;

      for (const item of items) {
        const { id_barang, quantity, diskon } = item;
        const discount = diskon || 0;

        const [barangRows] = await connection.execute('SELECT * FROM Barang WHERE id_barang = ? FOR UPDATE', [id_barang]);
        if (barangRows.length === 0) {
          throw new Error(`Barang with ID ${id_barang} not found`);
        }

        const barang = barangRows[0];
        let subtotal = 0;

        if (jenis_transaksi === 'Swalayan') {
          if (barang.stok_swalayan < quantity) {
            throw new Error(`Stok Swalayan insufficient for ${barang.nama_barang}`);
          }
          subtotal = (barang.harga_swalayan * quantity) - discount;
          calculatedTotal += subtotal;

          await connection.execute(
            'UPDATE Barang SET stok_swalayan = stok_swalayan - ? WHERE id_barang = ?',
            [quantity, id_barang]
          );
        } else if (jenis_transaksi === 'Grosir') {
          if (barang.stok_grosir < quantity) {
            throw new Error(`Stok Grosir insufficient for ${barang.nama_barang}`);
          }
          subtotal = (barang.harga_grosir * quantity) - discount;
          calculatedTotal += subtotal;

          await connection.execute(
            'UPDATE Barang SET stok_grosir = stok_grosir - ? WHERE id_barang = ?',
            [quantity, id_barang]
          );
        }

        await connection.execute(
          'INSERT INTO detail_transaksi (id_transaksi, id_barang, quantity_barang, diskon, subtotal) VALUES (?, ?, ?, ?, ?)',
          [id_transaksi, id_barang, quantity, discount, subtotal]
        );
      }

      await connection.execute(
        'UPDATE Transaksi SET total_bayar = ? WHERE id_transaksi = ?',
        [calculatedTotal, id_transaksi]
      );

      await connection.commit();

      return {
        id_transaksi,
        total_bayar: calculatedTotal
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = TransaksiModel;

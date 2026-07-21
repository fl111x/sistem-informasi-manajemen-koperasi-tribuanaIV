const db = require('../config/db');

class BarangModel {
  static async findAll() {
    const [rows] = await db.execute('SELECT * FROM Barang');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM Barang WHERE id_barang = ?', [id]);
    return rows[0];
  }

  static async findByBarcode(barcode) {
    const [rows] = await db.execute('SELECT * FROM Barang WHERE barcode = ?', [barcode]);
    return rows[0];
  }

  static async findByBarcodeExceptId(barcode, idToExclude) {
    const [rows] = await db.execute('SELECT id_barang FROM Barang WHERE barcode = ? AND id_barang != ?', [barcode, idToExclude]);
    return rows[0];
  }

  static async create(data) {
    const { 
      nama_barang, golongan, barcode, 
      harga_beli, harga_swalayan, harga_grosir, 
      stok_swalayan, stok_grosir, 
      satuan_swalayan, satuan_grosir 
    } = data;

    const [result] = await db.execute(
      `INSERT INTO Barang (
        nama_barang, golongan, barcode, 
        harga_beli, harga_swalayan, harga_grosir, 
        stok_swalayan, stok_grosir, 
        satuan_swalayan, satuan_grosir
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nama_barang, golongan || null, barcode || null,
        harga_beli || 0, harga_swalayan || 0, harga_grosir || 0,
        stok_swalayan || 0, stok_grosir || 0,
        satuan_swalayan || null, satuan_grosir || null
      ]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const { 
      nama_barang, golongan, barcode, 
      harga_beli, harga_swalayan, harga_grosir, 
      stok_swalayan, stok_grosir, 
      satuan_swalayan, satuan_grosir 
    } = data;

    const [result] = await db.execute(
      `UPDATE Barang SET 
        nama_barang = ?, golongan = ?, barcode = ?, 
        harga_beli = ?, harga_swalayan = ?, harga_grosir = ?, 
        stok_swalayan = ?, stok_grosir = ?, 
        satuan_swalayan = ?, satuan_grosir = ?
       WHERE id_barang = ?`,
      [
        nama_barang, golongan || null, barcode || null,
        harga_beli || 0, harga_swalayan || 0, harga_grosir || 0,
        stok_swalayan || 0, stok_grosir || 0,
        satuan_swalayan || null, satuan_grosir || null,
        id
      ]
    );
    return result.affectedRows;
  }

  static async delete(id) {
    const [result] = await db.execute('DELETE FROM Barang WHERE id_barang = ?', [id]);
    return result.affectedRows;
  }
}

module.exports = BarangModel;

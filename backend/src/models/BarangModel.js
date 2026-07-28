const db = require('../config/db');


  const findAll = async () => {
    const [rows] = await db.execute('SELECT * FROM Barang WHERE is_active = 1');
    return rows;
  }

  const findById = async (id) => {
    const [rows] = await db.execute('SELECT * FROM Barang WHERE id_barang = ? AND is_active = 1', [id]);
    return rows[0];
  }

  const findByBarcode = async (barcode) => {
    const [rows] = await db.execute('SELECT * FROM Barang WHERE barcode = ? AND is_active = 1', [barcode]);
    return rows[0];
  }

  const findByBarcodeExceptId = async (barcode, idToExclude) => {
    const [rows] = await db.execute('SELECT id_barang FROM Barang WHERE barcode = ? AND id_barang != ? AND is_active = 1', [barcode, idToExclude]);
    return rows[0];
  }

  const create = async (data) => {
    const { 
      nama_barang, golongan, barcode, 
      harga_beli, harga_swalayan, harga_grosir, 
      stok_swalayan, stok_grosir, stok_minimal, 
      satuan_swalayan, satuan_grosir 
    } = data;

    const [result] = await db.execute(
      `INSERT INTO Barang (
        nama_barang, golongan, barcode, 
        harga_beli, harga_swalayan, harga_grosir, 
        stok_swalayan, stok_grosir, stok_minimal, 
        satuan_swalayan, satuan_grosir
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nama_barang, golongan || null, barcode || null,
        harga_beli || 0, harga_swalayan || 0, harga_grosir || 0,
        stok_swalayan || 0, stok_grosir || 0, stok_minimal || 10,
        satuan_swalayan || null, satuan_grosir || null
      ]
    );
    return result.insertId;
  }

  const update = async (id, data) => {
    const { 
      nama_barang, golongan, barcode, 
      harga_beli, harga_swalayan, harga_grosir, 
      stok_swalayan, stok_grosir, stok_minimal, 
      satuan_swalayan, satuan_grosir 
    } = data;

    const [result] = await db.execute(
      `UPDATE Barang SET 
        nama_barang = ?, golongan = ?, barcode = ?, 
        harga_beli = ?, harga_swalayan = ?, harga_grosir = ?, 
        stok_swalayan = ?, stok_grosir = ?, stok_minimal = ?, 
        satuan_swalayan = ?, satuan_grosir = ?
       WHERE id_barang = ?`,
      [
        nama_barang, golongan || null, barcode || null,
        harga_beli || 0, harga_swalayan || 0, harga_grosir || 0,
        stok_swalayan || 0, stok_grosir || 0, stok_minimal || 10,
        satuan_swalayan || null, satuan_grosir || null,
        id
      ]
    );
    return result.affectedRows;
  }

  const deleteData = async (id) => {
    const [result] = await db.execute('DELETE FROM Barang WHERE id_barang = ?', [id]);
    return result.affectedRows;
  }

module.exports = {
  findAll,
  findById,
  findByBarcode,
  findByBarcodeExceptId,
  create,
  update,
  delete: deleteData
};

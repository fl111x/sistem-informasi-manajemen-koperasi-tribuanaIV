const db = require('../config/db');

// Get all barang
const getAllBarang = async (req, res) => {
  try {
    const [barang] = await db.execute('SELECT * FROM Barang WHERE is_active = 1');
    res.status(200).json(barang);
  } catch (error) {
    console.error('Error fetching barang:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal' });
  }
};

// Get barang by ID
const getBarangById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute('SELECT * FROM Barang WHERE id_barang = ? AND is_active = 1', [id]);
    const barang = rows[0];

    if (!barang) {
      return res.status(404).json({ message: 'Barang tidak ditemukan' });
    }

    res.status(200).json(barang);
  } catch (error) {
    console.error('Error fetching barang by ID:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal' });
  }
};

// Create new barang
const createBarang = async (req, res) => {
  try {
    const { 
      barcode, 
      nama_barang, 
      golongan,
      harga_beli,
      harga_swalayan, 
      harga_grosir,
      stok_swalayan, 
      satuan_swalayan, 
      stok_grosir, 
      satuan_grosir,
      stok_minimal
    } = req.body;

    // Basic validation
    if (!nama_barang) {
      return res.status(400).json({ message: 'Nama barang wajib diisi' });
    }

    // Check if barcode already exists (if provided)
    if (barcode) {
      const [existingRows] = await db.execute('SELECT * FROM Barang WHERE barcode = ? AND is_active = 1', [barcode]);
      if (existingRows.length > 0) {
        return res.status(400).json({ message: 'Barcode sudah terdaftar' });
      }
    }

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

    res.status(201).json({
      message: 'Barang created successfully',
      id_barang: result.insertId
    });
  } catch (error) {
    console.error('Error creating barang:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal: ' + error.message });
  }
};

// Update barang
const updateBarang = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      barcode, 
      nama_barang, 
      golongan,
      harga_beli,
      harga_swalayan, 
      harga_grosir,
      stok_swalayan, 
      satuan_swalayan, 
      stok_grosir, 
      satuan_grosir,
      stok_minimal
    } = req.body;

    if (!nama_barang) {
      return res.status(400).json({ message: 'Nama barang wajib diisi' });
    }

    // Check if new barcode clashes with another existing record
    if (barcode) {
      const [existingRows] = await db.execute('SELECT id_barang FROM Barang WHERE barcode = ? AND id_barang != ? AND is_active = 1', [barcode, id]);
      if (existingRows.length > 0) {
        return res.status(400).json({ message: 'Barcode sudah digunakan oleh barang lain' });
      }
    }

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

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Barang tidak ditemukan' });
    }

    res.status(200).json({ message: 'Barang berhasil diperbarui' });
  } catch (error) {
    console.error('Error updating barang:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal: ' + error.message });
  }
};

// Delete barang
const deleteBarang = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute('DELETE FROM Barang WHERE id_barang = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Barang tidak ditemukan' });
    }

    res.status(200).json({ message: 'Barang berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting barang:', error);
    res.status(500).json({ message: 'Gagal menghapus barang. Pastikan tidak ada transaksi terkait.' });
  }
};

module.exports = {
  getAllBarang,
  getBarangById,
  createBarang,
  updateBarang,
  deleteBarang
};

const BarangModel = require('../models/BarangModel');

// Get all barang
const getAllBarang = async (req, res) => {
  try {
    const barang = await BarangModel.findAll();
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
    const barang = await BarangModel.findById(id);

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
    if (!barcode || !nama_barang || !harga_swalayan) {
      return res.status(400).json({ message: 'Barcode, nama barang, dan harga swalayan wajib diisi' });
    }

    // Check if barcode already exists
    const existing = await BarangModel.findByBarcode(barcode);
    if (existing) {
      return res.status(400).json({ message: 'Barcode sudah terdaftar' });
    }

    const insertId = await BarangModel.create({
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
    });

    res.status(201).json({
      message: 'Barang created successfully',
      id_barang: insertId
    });
  } catch (error) {
    console.error('Error creating barang:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal' });
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

    if (!barcode || !nama_barang || !harga_swalayan) {
      return res.status(400).json({ message: 'Barcode, nama barang, dan harga swalayan wajib diisi' });
    }

    // Check if new barcode clashes with another existing record
    const existing = await BarangModel.findByBarcodeExceptId(barcode, id);
    if (existing) {
      return res.status(400).json({ message: 'Barcode sudah digunakan oleh barang lain' });
    }

    const affectedRows = await BarangModel.update(id, {
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
    });

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Barang tidak ditemukan' });
    }

    res.status(200).json({ message: 'Barang berhasil diperbarui' });
  } catch (error) {
    console.error('Error updating barang:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal' });
  }
};

// Delete barang
const deleteBarang = async (req, res) => {
  try {
    const { id } = req.params;

    const affectedRows = await BarangModel.delete(id);

    if (affectedRows === 0) {
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

const db = require('../config/db');

// Get all barang
const getAllBarang = async (req, res) => {
  try {
    const [barang] = await db.execute('SELECT * FROM Barang');
    res.status(200).json(barang);
  } catch (error) {
    console.error('Error fetching barang:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get barang by ID
const getBarangById = async (req, res) => {
  try {
    const { id } = req.params;
    const [barang] = await db.execute('SELECT * FROM Barang WHERE id_barang = ?', [id]);

    if (barang.length === 0) {
      return res.status(404).json({ message: 'Barang not found' });
    }

    res.status(200).json(barang[0]);
  } catch (error) {
    console.error('Error fetching barang by ID:', error);
    res.status(500).json({ message: 'Internal server error' });
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
      satuan_grosir 
    } = req.body;

    // Basic validation
    if (!barcode || !nama_barang || !harga_swalayan) {
      return res.status(400).json({ message: 'barcode, nama_barang, and harga_swalayan are required' });
    }

    // Check if barcode already exists
    const [existing] = await db.execute('SELECT * FROM Barang WHERE barcode = ?', [barcode]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Barcode already exists' });
    }

    const [result] = await db.execute(
      `INSERT INTO Barang (
        barcode, nama_barang, golongan, harga_beli, harga_swalayan, harga_grosir,
        stok_swalayan, satuan_swalayan, stok_grosir, satuan_grosir
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        barcode, 
        nama_barang, 
        golongan || null,
        harga_beli || 0,
        harga_swalayan, 
        harga_grosir || 0,
        stok_swalayan || 0, 
        satuan_swalayan || null, 
        stok_grosir || 0, 
        satuan_grosir || null
      ]
    );

    res.status(201).json({
      message: 'Barang created successfully',
      id_barang: result.insertId
    });
  } catch (error) {
    console.error('Error creating barang:', error);
    res.status(500).json({ message: 'Internal server error' });
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
      satuan_grosir
    } = req.body;

    if (!barcode || !nama_barang || !harga_swalayan) {
      return res.status(400).json({ message: 'barcode, nama_barang, and harga_swalayan are required' });
    }

    // Check if new barcode clashes with another existing record
    const [existing] = await db.execute('SELECT id_barang FROM Barang WHERE barcode = ? AND id_barang != ?', [barcode, id]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Barcode is already taken by another item' });
    }

    const [result] = await db.execute(
      `UPDATE Barang SET 
        barcode = ?, 
        nama_barang = ?, 
        golongan = ?,
        harga_beli = ?,
        harga_swalayan = ?, 
        harga_grosir = ?,
        stok_swalayan = ?, 
        satuan_swalayan = ?, 
        stok_grosir = ?, 
        satuan_grosir = ? 
      WHERE id_barang = ?`,
      [
        barcode, 
        nama_barang, 
        golongan || null,
        harga_beli || 0,
        harga_swalayan, 
        harga_grosir || 0,
        stok_swalayan || 0, 
        satuan_swalayan || null, 
        stok_grosir || 0, 
        satuan_grosir || null, 
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Barang not found' });
    }

    res.status(200).json({ message: 'Barang updated successfully' });
  } catch (error) {
    console.error('Error updating barang:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete barang
const deleteBarang = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute('DELETE FROM Barang WHERE id_barang = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Barang not found' });
    }

    res.status(200).json({ message: 'Barang deleted successfully' });
  } catch (error) {
    console.error('Error deleting barang:', error);
    res.status(500).json({ message: 'Error deleting barang. Make sure there are no related transactions.' });
  }
};

module.exports = {
  getAllBarang,
  getBarangById,
  createBarang,
  updateBarang,
  deleteBarang
};

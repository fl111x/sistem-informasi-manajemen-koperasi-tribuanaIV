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
      stok_minimal,
      stok_gudang,
      is_konsinyasi
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
        satuan_swalayan, satuan_grosir, stok_gudang, is_konsinyasi
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nama_barang, golongan || null, barcode || null,
        harga_beli || 0, harga_swalayan || 0, harga_grosir || 0,
        stok_swalayan || 0, stok_grosir || 0, stok_minimal || 10,
        satuan_swalayan || null, satuan_grosir || null, stok_gudang || 0, is_konsinyasi || 0
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

// Update barang (Berfungsi seperti PATCH)
const updateBarang = async (req, res) => {
  try {
    const { id } = req.params;

    // Get existing data
    const [existing] = await db.execute('SELECT * FROM Barang WHERE id_barang = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Barang tidak ditemukan' });
    }
    const curr = existing[0];

    const nama_barang = req.body.nama_barang !== undefined ? req.body.nama_barang : curr.nama_barang;
    const golongan = req.body.golongan !== undefined ? req.body.golongan : curr.golongan;
    const barcode = req.body.barcode !== undefined ? req.body.barcode : curr.barcode;
    const harga_beli = req.body.harga_beli !== undefined ? req.body.harga_beli : curr.harga_beli;
    const harga_swalayan = req.body.harga_swalayan !== undefined ? req.body.harga_swalayan : curr.harga_swalayan;
    const harga_grosir = req.body.harga_grosir !== undefined ? req.body.harga_grosir : curr.harga_grosir;
    const stok_swalayan = req.body.stok_swalayan !== undefined ? req.body.stok_swalayan : curr.stok_swalayan;
    const stok_grosir = req.body.stok_grosir !== undefined ? req.body.stok_grosir : curr.stok_grosir;
    const stok_minimal = req.body.stok_minimal !== undefined ? req.body.stok_minimal : curr.stok_minimal;
    const satuan_swalayan = req.body.satuan_swalayan !== undefined ? req.body.satuan_swalayan : curr.satuan_swalayan;
    const satuan_grosir = req.body.satuan_grosir !== undefined ? req.body.satuan_grosir : curr.satuan_grosir;
    const stok_gudang = req.body.stok_gudang !== undefined ? req.body.stok_gudang : curr.stok_gudang;
    const is_konsinyasi = req.body.is_konsinyasi !== undefined ? req.body.is_konsinyasi : curr.is_konsinyasi;

    if (!nama_barang) {
      return res.status(400).json({ message: 'Nama barang wajib diisi' });
    }

    // Check if new barcode clashes with another existing record
    if (barcode && barcode !== curr.barcode) {
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
        satuan_swalayan = ?, satuan_grosir = ?, stok_gudang = ?, is_konsinyasi = ?
       WHERE id_barang = ?`,
      [
        nama_barang, golongan || null, barcode || null,
        harga_beli || 0, harga_swalayan || 0, harga_grosir || 0,
        stok_swalayan || 0, stok_grosir || 0, stok_minimal || 10,
        satuan_swalayan || null, satuan_grosir || null, stok_gudang || 0, is_konsinyasi || 0,
        id
      ]
    );

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

const mutasiBarang = async (req, res) => {
  try {
    const { id_barang, jumlah, tujuan } = req.body; // tujuan: 'Swalayan' or 'Grosir'
    if (!id_barang || !jumlah || !tujuan) {
      return res.status(400).json({ message: 'Data mutasi tidak lengkap' });
    }

    const [rows] = await db.execute('SELECT stok_gudang FROM Barang WHERE id_barang = ?', [id_barang]);
    if (rows.length === 0) return res.status(404).json({ message: 'Barang tidak ditemukan' });

    if (rows[0].stok_gudang < jumlah) {
      return res.status(400).json({ message: 'Stok gudang tidak mencukupi untuk mutasi' });
    }

    const kolomTujuan = tujuan === 'Swalayan' ? 'stok_swalayan' : 'stok_grosir';
    await db.execute(
      `UPDATE Barang SET stok_gudang = stok_gudang - ?, ${kolomTujuan} = ${kolomTujuan} + ? WHERE id_barang = ?`,
      [jumlah, jumlah, id_barang]
    );

    res.status(200).json({ message: 'Mutasi berhasil' });
  } catch (error) {
    console.error('Error mutasi barang:', error);
    res.status(500).json({ message: 'Terjadi kesalahan internal' });
  }
};

const getBarangBelumDiset = async (req, res) => {
  try {
    // Barang yang ada di gudang tapi belum diset harga swalayan atau barcode
    const [rows] = await db.execute('SELECT * FROM Barang WHERE stok_gudang > 0 AND (harga_swalayan = 0 OR barcode IS NULL)');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching barang belum diset:', error);
    res.status(500).json({ message: 'Terjadi kesalahan internal' });
  }
};

module.exports = {
  getAllBarang,
  getBarangById,
  createBarang,
  updateBarang,
  deleteBarang,
  mutasiBarang,
  getBarangBelumDiset
};

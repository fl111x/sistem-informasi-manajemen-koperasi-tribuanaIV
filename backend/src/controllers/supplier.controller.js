const db = require('../config/db');

exports.getAllSuppliers = async (req, res) => {
  try {
    const [suppliers] = await db.execute('SELECT * FROM Supplier WHERE is_active = 1');
    res.status(200).json(suppliers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan internal server' });
  }
};

exports.getSupplierById = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Supplier WHERE id_supplier = ? AND is_active = 1', [req.params.id]);
    const supplier = rows[0];
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier tidak ditemukan' });
    }
    res.status(200).json(supplier);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan internal server' });
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const { nama_supplier, kontak, alamat } = req.body;
    if (!nama_supplier) {
      return res.status(400).json({ message: 'Nama supplier wajib diisi' });
    }
    
    const [result] = await db.execute(
      'INSERT INTO Supplier (nama_supplier, kontak, alamat) VALUES (?, ?, ?)',
      [nama_supplier, kontak || null, alamat || null]
    );
    
    res.status(201).json({ message: 'Supplier berhasil ditambahkan', id_supplier: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan saat menambah data supplier' });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const { nama_supplier, kontak, alamat } = req.body;
    
    const [result] = await db.execute(
      'UPDATE Supplier SET nama_supplier = ?, kontak = ?, alamat = ? WHERE id_supplier = ?',
      [nama_supplier, kontak || null, alamat || null, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Supplier tidak ditemukan' });
    }
    res.status(200).json({ message: 'Supplier berhasil diupdate' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengupdate data supplier' });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    // Soft delete
    const [result] = await db.execute('UPDATE Supplier SET is_active = 0 WHERE id_supplier = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Supplier tidak ditemukan' });
    }
    res.status(200).json({ message: 'Supplier berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan saat menghapus data supplier' });
  }
};

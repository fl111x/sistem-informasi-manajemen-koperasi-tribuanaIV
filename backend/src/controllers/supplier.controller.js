const db = require('../config/db');

exports.getAllSuppliers = async (req, res) => {
  try {
    const [results] = await db.execute('SELECT * FROM supplier WHERE is_active = 1');
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.execute('SELECT * FROM supplier WHERE id_supplier = ?', [id]);
    if (results.length === 0) return res.status(404).json({ message: 'Supplier tidak ditemukan' });
    res.json(results[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const { nama_supplier, kontak, alamat } = req.body;
    if (!nama_supplier) return res.status(400).json({ message: 'Nama supplier wajib diisi' });

    const [result] = await db.execute(
      'INSERT INTO supplier (nama_supplier, kontak, alamat, is_active) VALUES (?, ?, ?, 1)',
      [nama_supplier, kontak || null, alamat || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Supplier berhasil ditambahkan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_supplier, kontak, alamat, is_active } = req.body;

    const [result] = await db.execute(
      'UPDATE supplier SET nama_supplier = ?, kontak = ?, alamat = ?, is_active = ? WHERE id_supplier = ?',
      [nama_supplier, kontak || null, alamat || null, is_active !== undefined ? is_active : 1, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Supplier tidak ditemukan' });
    res.json({ message: 'Supplier berhasil diupdate' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.execute('UPDATE supplier SET is_active = 0 WHERE id_supplier = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Supplier tidak ditemukan' });
    res.json({ message: 'Supplier berhasil dinonaktifkan (soft delete)' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

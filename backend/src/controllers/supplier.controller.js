const db = require('../config/db');

exports.getAllSuppliers = (req, res) => {
  db.query('SELECT * FROM supplier WHERE is_active = 1', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getSupplierById = (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM supplier WHERE id_supplier = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Supplier tidak ditemukan' });
    res.json(results[0]);
  });
};

exports.createSupplier = (req, res) => {
  const { nama_supplier, kontak, alamat } = req.body;
  if (!nama_supplier) return res.status(400).json({ message: 'Nama supplier wajib diisi' });

  db.query(
    'INSERT INTO supplier (nama_supplier, kontak, alamat, is_active) VALUES (?, ?, ?, 1)',
    [nama_supplier, kontak, alamat],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId, message: 'Supplier berhasil ditambahkan' });
    }
  );
};

exports.updateSupplier = (req, res) => {
  const { id } = req.params;
  const { nama_supplier, kontak, alamat, is_active } = req.body;

  db.query(
    'UPDATE supplier SET nama_supplier = ?, kontak = ?, alamat = ?, is_active = ? WHERE id_supplier = ?',
    [nama_supplier, kontak, alamat, is_active !== undefined ? is_active : 1, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Supplier tidak ditemukan' });
      res.json({ message: 'Supplier berhasil diupdate' });
    }
  );
};

exports.deleteSupplier = (req, res) => {
  const { id } = req.params;
  db.query('UPDATE supplier SET is_active = 0 WHERE id_supplier = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Supplier tidak ditemukan' });
    res.json({ message: 'Supplier berhasil dinonaktifkan (soft delete)' });
  });
};

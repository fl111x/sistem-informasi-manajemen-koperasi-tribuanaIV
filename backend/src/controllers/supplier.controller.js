const db = require('../config/db');

exports.getAllSuppliers = async (req, res) => {
  try {
    const { page, limit, search } = req.query;

    // Fallback if no pagination provided
    if (!page && !limit && !search) {
      const [results] = await db.execute('SELECT * FROM supplier WHERE is_active = 1 ORDER BY nama_supplier ASC');
      return res.json(results);
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 30;
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT * FROM supplier WHERE is_active = 1';
    let countQuery = 'SELECT COUNT(*) as total FROM supplier WHERE is_active = 1';
    const queryParams = [];

    if (search) {
      query += ' AND nama_supplier LIKE ?';
      countQuery += ' AND nama_supplier LIKE ?';
      queryParams.push(`%${search}%`);
    }

    query += ' ORDER BY nama_supplier ASC LIMIT ? OFFSET ?';
    
    const [countRows] = await db.execute(countQuery, queryParams);
    const totalItems = countRows[0].total;
    const totalPages = Math.ceil(totalItems / limitNum);

    const [results] = await db.execute(query, [...queryParams, limitNum.toString(), offset.toString()]);
    
    res.json({
      data: results,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        limit: limitNum
      }
    });
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

exports.getRiwayatBarangSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.execute(`
      SELECT DISTINCT dp.id_barang 
      FROM detail_pembelian dp 
      JOIN pembelian p ON dp.id_pembelian = p.id_pembelian 
      WHERE p.id_supplier = ? AND dp.id_barang IS NOT NULL
    `, [id]);
    const ids = results.map(r => r.id_barang);
    res.json(ids);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};


const db = require('../config/db');


  const findAll = async () => {
    const [rows] = await db.execute('SELECT * FROM Supplier WHERE is_active = 1');
    return rows;
  }

  const findById = async (id) => {
    const [rows] = await db.execute('SELECT * FROM Supplier WHERE id_supplier = ? AND is_active = 1', [id]);
    return rows[0];
  }

  const create = async (data) => {
    const { nama_supplier, kontak, alamat } = data;
    const [result] = await db.execute(
      'INSERT INTO Supplier (nama_supplier, kontak, alamat) VALUES (?, ?, ?)',
      [nama_supplier, kontak || null, alamat || null]
    );
    return result.insertId;
  }

  const update = async (id, data) => {
    const { nama_supplier, kontak, alamat } = data;
    const [result] = await db.execute(
      'UPDATE Supplier SET nama_supplier = ?, kontak = ?, alamat = ? WHERE id_supplier = ?',
      [nama_supplier, kontak || null, alamat || null, id]
    );
    return result.affectedRows;
  }

  const deleteData = async (id) => {
    // Soft delete
    const [result] = await db.execute('UPDATE Supplier SET is_active = 0 WHERE id_supplier = ?', [id]);
    return result.affectedRows;
  }

module.exports = {
  findAll,
  findById,
  create,
  update,
  delete: deleteData
};

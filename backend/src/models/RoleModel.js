const db = require('../config/db');


  const findAll = async () => {
    const [rows] = await db.execute('SELECT * FROM Role');
    return rows;
  }

  const findById = async (id) => {
    const [rows] = await db.execute('SELECT * FROM Role WHERE id_role = ?', [id]);
    return rows[0];
  }

  const create = async (data) => {
    const { nama_role, deskripsi } = data;
    const [result] = await db.execute(
      'INSERT INTO Role (nama_role, deskripsi) VALUES (?, ?)',
      [nama_role, deskripsi]
    );
    return result.insertId;
  }

  const update = async (id, data) => {
    const { nama_role, deskripsi } = data;
    const [result] = await db.execute(
      'UPDATE Role SET nama_role = ?, deskripsi = ? WHERE id_role = ?',
      [nama_role, deskripsi, id]
    );
    return result.affectedRows;
  }

  const deleteData = async (id) => {
    const [result] = await db.execute('DELETE FROM Role WHERE id_role = ?', [id]);
    return result.affectedRows;
  }

module.exports = {
  findAll,
  findById,
  create,
  update,
  delete: deleteData
};

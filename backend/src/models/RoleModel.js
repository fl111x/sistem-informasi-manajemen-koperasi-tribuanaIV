const db = require('../config/db');

class RoleModel {
  static async findAll() {
    const [rows] = await db.execute('SELECT * FROM Role');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM Role WHERE id_role = ?', [id]);
    return rows[0];
  }

  static async create(data) {
    const { nama_role, deskripsi } = data;
    const [result] = await db.execute(
      'INSERT INTO Role (nama_role, deskripsi) VALUES (?, ?)',
      [nama_role, deskripsi]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const { nama_role, deskripsi } = data;
    const [result] = await db.execute(
      'UPDATE Role SET nama_role = ?, deskripsi = ? WHERE id_role = ?',
      [nama_role, deskripsi, id]
    );
    return result.affectedRows;
  }

  static async delete(id) {
    const [result] = await db.execute('DELETE FROM Role WHERE id_role = ?', [id]);
    return result.affectedRows;
  }
}

module.exports = RoleModel;

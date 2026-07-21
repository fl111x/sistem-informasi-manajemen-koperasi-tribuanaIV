const db = require('../config/db');

class UserModel {
  static async findAll() {
    const [rows] = await db.execute(`
      SELECT p.id_pengguna, p.username, p.nama_pengguna, p.id_role, r.nama_role 
      FROM Pengguna p 
      LEFT JOIN Role r ON p.id_role = r.id_role
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute(`
      SELECT p.id_pengguna, p.username, p.nama_pengguna, p.id_role, r.nama_role 
      FROM Pengguna p 
      LEFT JOIN Role r ON p.id_role = r.id_role 
      WHERE p.id_pengguna = ?
    `, [id]);
    return rows[0];
  }

  static async findByUsername(username) {
    const [rows] = await db.execute(`
      SELECT p.*, r.nama_role 
      FROM Pengguna p 
      LEFT JOIN Role r ON p.id_role = r.id_role 
      WHERE p.username = ?
    `, [username]);
    return rows[0];
  }

  static async findByUsernameExceptId(username, idToExclude) {
    const [rows] = await db.execute('SELECT id_pengguna FROM Pengguna WHERE username = ? AND id_pengguna != ?', [username, idToExclude]);
    return rows[0];
  }

  static async create(data) {
    const { username, password, nama_pengguna, id_role } = data;
    const [result] = await db.execute(
      'INSERT INTO Pengguna (username, password, nama_pengguna, id_role) VALUES (?, ?, ?, ?)',
      [username, password, nama_pengguna, id_role]
    );
    return result.insertId;
  }

  static async updateWithPassword(id, data) {
    const { username, password, nama_pengguna, id_role } = data;
    const [result] = await db.execute(
      'UPDATE Pengguna SET username = ?, password = ?, nama_pengguna = ?, id_role = ? WHERE id_pengguna = ?',
      [username, password, nama_pengguna, id_role, id]
    );
    return result.affectedRows;
  }

  static async updateWithoutPassword(id, data) {
    const { username, nama_pengguna, id_role } = data;
    const [result] = await db.execute(
      'UPDATE Pengguna SET username = ?, nama_pengguna = ?, id_role = ? WHERE id_pengguna = ?',
      [username, nama_pengguna, id_role, id]
    );
    return result.affectedRows;
  }

  static async updatePassword(username, hashedPassword) {
    const [result] = await db.execute('UPDATE Pengguna SET password = ? WHERE username = ?', [hashedPassword, username]);
    return result.affectedRows;
  }

  static async delete(id) {
    const [result] = await db.execute('DELETE FROM Pengguna WHERE id_pengguna = ?', [id]);
    return result.affectedRows;
  }
}

module.exports = UserModel;

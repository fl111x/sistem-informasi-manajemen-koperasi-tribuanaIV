const bcrypt = require('bcrypt');
const db = require('../config/db');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.execute(`
      SELECT p.id_pengguna, p.username, p.nama_pengguna, p.id_role, r.nama_role 
      FROM Pengguna p 
      LEFT JOIN Role r ON p.id_role = r.id_role
    `);
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal' });
  }
};

// Get user by id
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute(`
      SELECT p.id_pengguna, p.username, p.nama_pengguna, p.id_role, r.nama_role 
      FROM Pengguna p 
      LEFT JOIN Role r ON p.id_role = r.id_role 
      WHERE p.id_pengguna = ?
    `, [id]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user by id:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, nama_pengguna, id_role, password } = req.body;

    if (!username || !nama_pengguna || !id_role) {
      return res.status(400).json({ message: 'Username, nama pengguna, dan role wajib diisi' });
    }

    // Check if another user has the same username
    const [existingRows] = await db.execute('SELECT id_pengguna FROM Pengguna WHERE username = ? AND id_pengguna != ?', [username, id]);
    if (existingRows.length > 0) {
      return res.status(400).json({ message: 'Username sudah digunakan oleh pengguna lain' });
    }

    let affectedRows = 0;
    if (password) {
      // Update with new password
      const hashedPassword = await bcrypt.hash(password, 10);
      const [result] = await db.execute(
        'UPDATE Pengguna SET username = ?, password = ?, nama_pengguna = ?, id_role = ? WHERE id_pengguna = ?',
        [username, hashedPassword, nama_pengguna, id_role, id]
      );
      affectedRows = result.affectedRows;
    } else {
      // Update without changing password
      const [result] = await db.execute(
        'UPDATE Pengguna SET username = ?, nama_pengguna = ?, id_role = ? WHERE id_pengguna = ?',
        [username, nama_pengguna, id_role, id]
      );
      affectedRows = result.affectedRows;
    }

    if (affectedRows === 0) return res.status(404).json({ message: 'Pengguna tidak ditemukan' });

    res.status(200).json({ message: 'Pengguna berhasil diperbarui' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Optional: Prevent admin from deleting themselves
    if (req.user && req.user.id_pengguna == id) {
      return res.status(400).json({ message: 'Tidak dapat menghapus akun Anda sendiri' });
    }

    const [result] = await db.execute('DELETE FROM Pengguna WHERE id_pengguna = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    res.status(200).json({ message: 'Pengguna berhasil dihapus' });
  } catch (error) {
    // If user has related transactions, this will fail due to foreign key constraints
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Gagal menghapus pengguna. Make sure user has no related transactions.' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};

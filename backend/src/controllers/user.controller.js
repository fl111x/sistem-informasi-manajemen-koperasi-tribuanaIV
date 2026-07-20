const db = require('../config/db');
const bcrypt = require('bcrypt');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT p.id_pengguna, p.username, p.nama_pengguna, p.id_role, r.nama_role FROM Pengguna p LEFT JOIN Role r ON p.id_role = r.id_role'
    );
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user by id
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [users] = await db.execute(
      'SELECT p.id_pengguna, p.username, p.nama_pengguna, p.id_role, r.nama_role FROM Pengguna p LEFT JOIN Role r ON p.id_role = r.id_role WHERE p.id_pengguna = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(users[0]);
  } catch (error) {
    console.error('Error fetching user by id:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, nama_pengguna, id_role, password } = req.body;

    if (!username || !nama_pengguna || !id_role) {
      return res.status(400).json({ message: 'Username, nama_pengguna, and id_role are required' });
    }

    // Check if another user has the same username
    const [existing] = await db.execute('SELECT id_pengguna FROM Pengguna WHERE username = ? AND id_pengguna != ?', [username, id]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username is already taken by another user' });
    }

    if (password) {
      // Update with new password
      const hashedPassword = await bcrypt.hash(password, 10);
      const [result] = await db.execute(
        'UPDATE Pengguna SET username = ?, nama_pengguna = ?, id_role = ?, password = ? WHERE id_pengguna = ?',
        [username, nama_pengguna, id_role, hashedPassword, id]
      );
      if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
    } else {
      // Update without changing password
      const [result] = await db.execute(
        'UPDATE Pengguna SET username = ?, nama_pengguna = ?, id_role = ? WHERE id_pengguna = ?',
        [username, nama_pengguna, id_role, id]
      );
      if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Optional: Prevent admin from deleting themselves
    if (req.user && req.user.id_pengguna == id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const [result] = await db.execute('DELETE FROM Pengguna WHERE id_pengguna = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    // If user has related transactions, this will fail due to foreign key constraints
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user. Make sure user has no related transactions.' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};

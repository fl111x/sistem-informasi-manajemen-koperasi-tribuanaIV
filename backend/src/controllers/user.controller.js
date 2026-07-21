const UserModel = require('../models/UserModel');
const bcrypt = require('bcrypt');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.findAll();
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
    const user = await UserModel.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
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
    const existing = await UserModel.findByUsernameExceptId(username, id);
    if (existing) {
      return res.status(400).json({ message: 'Username is already taken by another user' });
    }

    let affectedRows = 0;
    if (password) {
      // Update with new password
      const hashedPassword = await bcrypt.hash(password, 10);
      affectedRows = await UserModel.updateWithPassword(id, {
        username,
        password: hashedPassword,
        nama_pengguna,
        id_role
      });
    } else {
      // Update without changing password
      affectedRows = await UserModel.updateWithoutPassword(id, {
        username,
        nama_pengguna,
        id_role
      });
    }

    if (affectedRows === 0) return res.status(404).json({ message: 'User not found' });

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

    const affectedRows = await UserModel.delete(id);

    if (affectedRows === 0) {
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

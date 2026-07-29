const db = require('../config/db');

// Get all roles
const getAllRoles = async (req, res) => {
  try {
    const [roles] = await db.execute('SELECT * FROM Role');
    res.status(200).json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal' });
  }
};

// Get role by id
const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute('SELECT * FROM Role WHERE id_role = ?', [id]);
    const role = rows[0];
    
    if (!role) {
      return res.status(404).json({ message: 'Role (peran) tidak ditemukan' });
    }
    
    res.status(200).json(role);
  } catch (error) {
    console.error('Error fetching role by id:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal' });
  }
};

// Create new role
const createRole = async (req, res) => {
  try {
    const { nama_role, deskripsi } = req.body;

    if (!nama_role) {
      return res.status(400).json({ message: 'Nama role wajib diisi' });
    }

    const [result] = await db.execute(
      'INSERT INTO Role (nama_role, deskripsi) VALUES (?, ?)',
      [nama_role, deskripsi || null]
    );

    res.status(201).json({
      message: 'Role created successfully',
      id_role: result.insertId
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal' });
  }
};

// Update role
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_role, deskripsi } = req.body;

    if (!nama_role) {
      return res.status(400).json({ message: 'Nama role wajib diisi' });
    }

    const [result] = await db.execute(
      'UPDATE Role SET nama_role = ?, deskripsi = ? WHERE id_role = ?',
      [nama_role, deskripsi || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Role (peran) tidak ditemukan' });
    }

    res.status(200).json({ message: 'Role berhasil diperbarui' });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal' });
  }
};

// Delete role
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute('DELETE FROM Role WHERE id_role = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Role (peran) tidak ditemukan' });
    }

    res.status(200).json({ message: 'Role berhasil dihapus' });
  } catch (error) {
    // Usually fails if there's a foreign key constraint
    console.error('Error deleting role:', error);
    res.status(500).json({ message: 'Gagal menghapus role. Pastikan tidak ada pengguna dengan role ini.' });
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
};

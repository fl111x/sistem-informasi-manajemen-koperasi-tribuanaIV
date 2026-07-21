const RoleModel = require('../models/RoleModel');

// Get all roles
const getAllRoles = async (req, res) => {
  try {
    const roles = await RoleModel.findAll();
    res.status(200).json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get role by id
const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await RoleModel.findById(id);
    
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    res.status(200).json(role);
  } catch (error) {
    console.error('Error fetching role by id:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new role
const createRole = async (req, res) => {
  try {
    const { nama_role, deskripsi } = req.body;

    if (!nama_role) {
      return res.status(400).json({ message: 'nama_role is required' });
    }

    const insertId = await RoleModel.create({
      nama_role,
      deskripsi: deskripsi || null
    });

    res.status(201).json({
      message: 'Role created successfully',
      id_role: insertId
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update role
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_role, deskripsi } = req.body;

    if (!nama_role) {
      return res.status(400).json({ message: 'nama_role is required' });
    }

    const affectedRows = await RoleModel.update(id, {
      nama_role,
      deskripsi: deskripsi || null
    });

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.status(200).json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete role
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const affectedRows = await RoleModel.delete(id);

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.status(200).json({ message: 'Role deleted successfully' });
  } catch (error) {
    // Usually fails if there's a foreign key constraint
    console.error('Error deleting role:', error);
    res.status(500).json({ message: 'Error deleting role. Make sure no users are assigned to this role.' });
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
};

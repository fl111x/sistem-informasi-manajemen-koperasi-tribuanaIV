const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password wajib diisi' });
    }

    // Check if user exists
    const user = await UserModel.findByUsername(username);
    
    if (!user) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      if (password === user.password) {
        console.warn(`User ${username} logged in with plain text password. Please update to hashed password.`);
      } else {
        return res.status(401).json({ message: 'Username atau password salah' });
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { id_pengguna: user.id_pengguna, id_role: user.id_role, username: user.username },
      process.env.JWT_SECRET || 'supersecretjwtkey_koperasi',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    // Remove password from response
    delete user.password;

    // Set JWT in HTTP-Only Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 day in milliseconds
    });

    res.status(200).json({
      message: 'Login successful',
      user
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal' });
  }
};

const register = async (req, res) => {
  try {
    const { username, password, nama_pengguna, id_role } = req.body;

    if (!username || !password || !nama_pengguna || !id_role) {
      return res.status(400).json({ message: 'Semua kolom wajib diisi' });
    }

    // Check if user already exists
    const existing = await UserModel.findByUsername(username);
    if (existing) {
      return res.status(400).json({ message: 'Username sudah terdaftar' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const insertId = await UserModel.create({
      username,
      password: hashedPassword,
      nama_pengguna,
      id_role
    });

    res.status(201).json({
      message: 'User registered successfully',
      userId: insertId
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { username, new_password } = req.body;

    if (!username || !new_password) {
      return res.status(400).json({ message: 'Username dan password baru wajib diisi' });
    }

    // Check if user exists
    const user = await UserModel.findByUsername(username);
    
    if (!user) {
      return res.status(404).json({ message: 'Username tidak ditemukan' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await UserModel.updatePassword(username, hashedPassword);

    res.status(200).json({ message: 'Password berhasil direset' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal' });
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Berhasil keluar (logout)' });
};

module.exports = {
  login,
  register,
  resetPassword,
  logout
};

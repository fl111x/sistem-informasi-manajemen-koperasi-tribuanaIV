const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password wajib diisi' });
    }

    const [rows] = await db.execute(`
      SELECT p.*, r.nama_role 
      FROM Pengguna p 
      LEFT JOIN Role r ON p.id_role = r.id_role 
      WHERE p.username = ?
    `, [username]);
    const user = rows[0];
    
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

    const token = jwt.sign(
      { id_pengguna: user.id_pengguna, id_role: user.id_role, username: user.username },
      process.env.JWT_SECRET || 'supersecretjwtkey_koperasi',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    delete user.password;

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
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

    const [existingRows] = await db.execute('SELECT username FROM Pengguna WHERE username = ?', [username]);
    if (existingRows.length > 0) {
      return res.status(400).json({ message: 'Username sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      'INSERT INTO Pengguna (username, password, nama_pengguna, id_role) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, nama_pengguna, id_role]
    );

    res.status(201).json({
      message: 'User registered successfully',
      userId: result.insertId
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

    const [rows] = await db.execute('SELECT username FROM Pengguna WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Username tidak ditemukan' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await db.execute('UPDATE Pengguna SET password = ? WHERE username = ?', [hashedPassword, username]);

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

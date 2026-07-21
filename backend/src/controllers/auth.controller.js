const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check if user exists
    const user = await UserModel.findByUsername(username);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      if (password === user.password) {
        console.warn(`User ${username} logged in with plain text password. Please update to hashed password.`);
      } else {
        return res.status(401).json({ message: 'Invalid credentials' });
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
    res.status(500).json({ message: 'Internal server error' });
  }
};

const register = async (req, res) => {
  try {
    const { username, password, nama_pengguna, id_role } = req.body;

    if (!username || !password || !nama_pengguna || !id_role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existing = await UserModel.findByUsername(username);
    if (existing) {
      return res.status(400).json({ message: 'Username already exists' });
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
    res.status(500).json({ message: 'Internal server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { username, new_password } = req.body;

    if (!username || !new_password) {
      return res.status(400).json({ message: 'Username and new_password are required' });
    }

    // Check if user exists
    const user = await UserModel.findByUsername(username);
    
    if (!user) {
      return res.status(404).json({ message: 'Username not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await UserModel.updatePassword(username, hashedPassword);

    res.status(200).json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logout successful' });
};

module.exports = {
  login,
  register,
  resetPassword,
  logout
};

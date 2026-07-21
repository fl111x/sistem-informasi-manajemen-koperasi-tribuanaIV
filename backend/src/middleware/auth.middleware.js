const jwt = require('jsonwebtoken');
const db = require('../config/db');

const verifyToken = (req, res, next) => {
  // Prioritize token from cookie, fallback to Authorization header for flexibility
  let token = req.cookies?.token;
  
  if (!token) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(403).json({ message: 'Token tidak ditemukan. Silakan login kembali.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey_koperasi', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Akses ditolak, token tidak valid atau kadaluarsa.' });
    }
    
    req.user = decoded;
    next();
  });
};

const verifyAdmin = async (req, res, next) => {
  try {
    const id_role = req.user.id_role;

    const [roles] = await db.execute('SELECT * FROM Role WHERE id_role = ?', [id_role]);

    if (roles.length === 0) {
      return res.status(403).json({ message: 'Role (peran) tidak ditemukan' });
    }

    const roleName = roles[0].nama_role.toLowerCase();

    if (roleName.includes('admin')) {
      next();
    } else {
      return res.status(403).json({ message: 'Akses khusus Admin. Anda tidak diizinkan.' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Terjadi kesalahan saat memeriksa hak akses' });
  }
};

module.exports = {
  verifyToken,
  verifyAdmin
};

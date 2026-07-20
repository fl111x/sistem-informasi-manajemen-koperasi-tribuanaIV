const jwt = require('jsonwebtoken');
const db = require('../config/db');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(403).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Format: "Bearer <token>"

  if (!token) {
    return res.status(403).json({ message: 'Invalid token format' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey_koperasi', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized, token failed' });
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
      return res.status(403).json({ message: 'Role not found' });
    }

    const roleName = roles[0].nama_role.toLowerCase();

    if (roleName.includes('admin')) {
      next();
    } else {
      return res.status(403).json({ message: 'Require Admin Role' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Error checking admin role' });
  }
};

module.exports = {
  verifyToken,
  verifyAdmin
};

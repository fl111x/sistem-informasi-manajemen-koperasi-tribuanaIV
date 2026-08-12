const bcrypt = require('bcrypt');
const db = require('./src/config/db');

async function insertAdmin() {
  const connection = await db.getConnection();
  try {
    const hashedPassword = await bcrypt.hash('123', 10);
    const [existing] = await connection.execute('SELECT * FROM Pengguna WHERE username = ?', ['admin_sistem']);
    
    if (existing.length === 0) {
      await connection.execute(
        'INSERT INTO Pengguna (id_pengguna, username, password, nama_pengguna, id_role) VALUES (1, ?, ?, ?, ?)',
        ['admin_sistem', hashedPassword, 'Admin Sistem Utama', 1]
      );
      console.log("Berhasil menambahkan admin_sistem.");
    } else {
      console.log("admin_sistem sudah ada.");
    }
  } catch (err) {
    console.error(err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

insertAdmin();

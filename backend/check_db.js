const pool = require('./src/config/db');
const bcrypt = require('bcrypt');

async function createAdmin() {
  try {
    const plainPw = '123';
    const hashedPw = await bcrypt.hash(plainPw, 10);
    const username = 'admin_sistem';
    const nama = 'Admin Sistem';
    const idRole = 1; // 1 adalah role untuk admin sistem
    
    // Cek apakah user sudah ada
    const [existing] = await pool.execute('SELECT * FROM pengguna WHERE username = ?', [username]);
    
    if (existing.length > 0) {
      await pool.execute('UPDATE pengguna SET password = ?, id_role = ? WHERE username = ?', [hashedPw, idRole, username]);
      console.log(`Akun ${username} sudah ada, password direset menjadi '123' dan role diset ke Admin Sistem (id_role 1).`);
    } else {
      await pool.execute('INSERT INTO pengguna (username, password, nama_pengguna, id_role) VALUES (?, ?, ?, ?)', [username, hashedPw, nama, idRole]);
      console.log(`Akun baru berhasil dibuat: Username: ${username}, Password: 123, Role: Admin Sistem.`);
    }
  } catch (err) {
    console.error('Terjadi kesalahan:', err);
  } finally {
    process.exit(0);
  }
}

createAdmin();

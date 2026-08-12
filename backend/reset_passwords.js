const bcrypt = require('bcrypt');
const db = require('./src/config/db');

async function resetPasswords() {
  const connection = await db.getConnection();
  try {
    const hashedPassword = await bcrypt.hash('123', 10);
    console.log("Hashed password for '123':", hashedPassword);
    await connection.execute('UPDATE Pengguna SET password = ?', [hashedPassword]);
    console.log("Semua password telah direset ke '123'");
  } catch (err) {
    console.error(err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

resetPasswords();

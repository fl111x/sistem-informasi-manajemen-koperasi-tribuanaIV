const db = require('./src/config/db');

async function checkUsers() {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.execute('SELECT id_pengguna, username, password FROM Pengguna');
    console.log("Daftar Pengguna di Database:");
    console.table(rows);
  } catch (err) {
    console.error(err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

checkUsers();

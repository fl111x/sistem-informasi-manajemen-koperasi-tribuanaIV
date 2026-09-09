const pool = require('./src/config/db');

async function checkRole() {
  try {
    const [rows] = await pool.execute(`
      SELECT p.*, r.nama_role 
      FROM pengguna p 
      LEFT JOIN role r ON p.id_role = r.id_role 
      WHERE p.username = 'admin_sistem'
    `);
    console.log(rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkRole();

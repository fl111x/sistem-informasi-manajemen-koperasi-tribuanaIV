const pool = require('./src/config/db');

async function fixRole() {
  try {
    await pool.execute("UPDATE role SET nama_role = 'Admin Sistem' WHERE id_role = 1");
    console.log("Role name fixed to 'Admin Sistem'");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

fixRole();

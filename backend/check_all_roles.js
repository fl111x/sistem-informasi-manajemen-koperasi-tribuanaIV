const pool = require('./src/config/db');

async function checkAllRoles() {
  try {
    const [roles] = await pool.execute('SELECT * FROM role');
    console.log("Roles in DB:");
    console.table(roles);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkAllRoles();

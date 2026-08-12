const db = require('./src/config/db');

async function checkRoles() {
  const connection = await db.getConnection();
  try {
    const [roles] = await connection.execute('SELECT * FROM Role');
    console.log(roles);
  } catch (err) {
    console.error(err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

checkRoles();

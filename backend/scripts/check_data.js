const db = require('../src/config/db');

async function checkData() {
  try {
    const [roles] = await db.execute('SELECT * FROM role');
    const [users] = await db.execute('SELECT * FROM pengguna');
    console.log(`Roles count: ${roles.length}`);
    console.log(`Users count: ${users.length}`);
    
    if (roles.length > 0) {
        console.log('Roles data:', roles);
    }
    if (users.length > 0) {
        console.log('Users data:', users);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error connecting to DB:', err);
    process.exit(1);
  }
}
checkData();

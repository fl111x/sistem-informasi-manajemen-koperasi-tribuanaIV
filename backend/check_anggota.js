const pool = require('./src/config/db');

async function checkAnggota() {
  try {
    const [columns] = await pool.execute("SHOW COLUMNS FROM anggota");
    console.log("Anggota columns:");
    columns.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkAnggota();

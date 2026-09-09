const pool = require('./src/config/db');

async function checkTransaksi() {
  try {
    const [columns] = await pool.execute("SHOW COLUMNS FROM transaksi");
    console.log("Transaksi columns:");
    columns.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkTransaksi();

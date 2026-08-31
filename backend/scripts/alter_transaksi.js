const pool = require('../src/config/db');

async function run() {
  try {
    console.log('Altering transaksi table...');
    await pool.query("ALTER TABLE transaksi ADD COLUMN metode_pembayaran ENUM('Cash', 'Kredit') DEFAULT 'Cash' AFTER total_bayar;");
    console.log('Table altered successfully.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists.');
    } else {
      console.error('Error:', err);
    }
  } finally {
    process.exit();
  }
}

run();

const pool = require('../src/config/db');

async function run() {
  try {
    console.log('Altering tables for Voucher & Simpanan module...');
    
    // Alter anggota table
    try {
      await pool.query("ALTER TABLE anggota ADD COLUMN saldo_voucher DECIMAL(15,2) DEFAULT '0.00' AFTER is_active;");
      console.log('Added saldo_voucher to anggota.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log('saldo_voucher already exists.');
      else throw err;
    }

    try {
      await pool.query("ALTER TABLE anggota ADD COLUMN simpanan DECIMAL(15,2) DEFAULT '0.00' AFTER saldo_voucher;");
      console.log('Added simpanan to anggota.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log('simpanan already exists.');
      else throw err;
    }

    // Alter transaksi table
    try {
      await pool.query("ALTER TABLE transaksi ADD COLUMN dibayar_voucher DECIMAL(15,2) DEFAULT '0.00' AFTER total_bayar;");
      console.log('Added dibayar_voucher to transaksi.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log('dibayar_voucher already exists.');
      else throw err;
    }

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    process.exit();
  }
}

run();

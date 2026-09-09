const pool = require('./src/config/db');

async function fixDbColumns() {
  try {
    // Check and add to Anggota
    try {
      await pool.execute("ALTER TABLE anggota ADD COLUMN saldo_voucher DECIMAL(15,2) DEFAULT 0.00");
      console.log("Added saldo_voucher to anggota");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("saldo_voucher already exists");
      else throw e;
    }
    
    try {
      await pool.execute("ALTER TABLE anggota ADD COLUMN simpanan DECIMAL(15,2) DEFAULT 0.00");
      console.log("Added simpanan to anggota");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("simpanan already exists");
      else throw e;
    }

    // Check and add to Transaksi
    try {
      await pool.execute("ALTER TABLE transaksi ADD COLUMN total_keuntungan DECIMAL(15,2) DEFAULT 0.00");
      console.log("Added total_keuntungan to transaksi");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("total_keuntungan already exists");
      else throw e;
    }
    
    try {
      await pool.execute("ALTER TABLE transaksi ADD COLUMN dibayar_voucher DECIMAL(15,2) DEFAULT 0.00");
      console.log("Added dibayar_voucher to transaksi");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("dibayar_voucher already exists");
      else throw e;
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

fixDbColumns();

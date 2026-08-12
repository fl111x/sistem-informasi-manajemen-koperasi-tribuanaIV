const db = require('../src/config/db');

async function alterTable() {
  try {
    const connection = await db.getConnection();
    
    // Add snapshot_harga_beli to detail_transaksi
    await connection.execute(`
      ALTER TABLE detail_transaksi 
      ADD COLUMN snapshot_harga_beli DECIMAL(15,2) DEFAULT 0 AFTER subtotal;
    `);
    
    // Also add total_keuntungan to Transaksi table just to make reporting faster
    await connection.execute(`
      ALTER TABLE Transaksi 
      ADD COLUMN total_keuntungan DECIMAL(15,2) DEFAULT 0 AFTER total_bayar;
    `);

    console.log("Database altered successfully.");
    connection.release();
    process.exit(0);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("Column already exists.");
    } else {
      console.error("Error:", err);
    }
    process.exit(0);
  }
}

alterTable();

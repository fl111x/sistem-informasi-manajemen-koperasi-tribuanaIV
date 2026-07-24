const db = require('./src/config/db');

async function migrate() {
  try {
    console.log('Adding is_active column to Barang...');
    // We use TINYINT(1) for BOOLEAN in MySQL
    await db.execute('ALTER TABLE Barang ADD COLUMN is_active TINYINT(1) DEFAULT 1;');
    console.log('Migration successful.');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column is_active already exists.');
    } else {
      console.error('Migration failed:', error);
    }
  } finally {
    process.exit();
  }
}

migrate();

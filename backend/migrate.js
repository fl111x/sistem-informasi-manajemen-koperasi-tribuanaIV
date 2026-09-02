const db = require('./src/config/db');

async function migrate() {
  try {
    console.log('Adding jenis_anggota column...');
    try {
      await db.execute("ALTER TABLE anggota ADD COLUMN jenis_anggota ENUM('PNS', 'Militer') NOT NULL DEFAULT 'Militer'");
      console.log('Column added successfully.');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Column jenis_anggota already exists, skipping ADD COLUMN.');
      } else {
        throw e;
      }
    }

    console.log('Updating existing data for PNS based on pangkat...');
    const [result] = await db.execute(`
      UPDATE anggota 
      SET jenis_anggota = 'PNS' 
      WHERE pangkat LIKE '%I/%' 
         OR pangkat LIKE '%II/%' 
         OR pangkat LIKE '%III/%' 
         OR pangkat LIKE '%IV/%'
    `);
    
    console.log(`Update complete. Affected rows: ${result.affectedRows}`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();

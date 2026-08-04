const db = require('../src/config/db');

async function checkTables() {
  try {
    const [tables] = await db.execute('SHOW TABLES');
    console.log('--- TABLES IN DB ---');
    for (const t of tables) {
        const tableName = Object.values(t)[0];
        console.log(`\nTable: ${tableName}`);
        const [columns] = await db.execute(`DESCRIBE ${tableName}`);
        columns.forEach(c => {
            console.log(`  - ${c.Field} | ${c.Type} | Null: ${c.Null} | Key: ${c.Key} | Default: ${c.Default} | Extra: ${c.Extra}`);
        });
    }
    process.exit(0);
  } catch (err) {
    console.error('Error connecting to DB:', err);
    process.exit(1);
  }
}
checkTables();

const fs = require('fs');
const path = require('path');
const db = require('./src/config/db');

async function importSqlFile(connection, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const statement of statements) {
    if (statement.startsWith('--') || statement.startsWith('/*')) continue;
    try {
      await connection.query(statement);
    } catch (e) {
      console.error(`Error executing: ${statement.substring(0, 50)}...`, e.message);
    }
  }
}

async function run() {
  const connection = await db.getConnection();
  try {
    await connection.query('SET FOREIGN_KEY_CHECKS=0');
    // Drop all referencing tables first
    await connection.query('DROP TABLE IF EXISTS pengguna');
    await connection.query('DROP TABLE IF EXISTS role');

    console.log("Importing role.sql...");
    await importSqlFile(connection, path.join(__dirname, '../db/role.sql'));
    console.log("Importing pengguna.sql...");
    await importSqlFile(connection, path.join(__dirname, '../db/pengguna.sql'));
    
    await connection.query('SET FOREIGN_KEY_CHECKS=1');
    console.log("Done.");
  } catch (e) {
    console.error(e);
  } finally {
    connection.release();
    process.exit(0);
  }
}

run();

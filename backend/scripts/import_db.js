const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function importDb() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_koperasi',
    multipleStatements: true
  });

  try {
    const schemaPath = path.join(__dirname, '../../db/db_koperasi_export.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Importing db_koperasi_export.sql...');
    await connection.query(sql);
    console.log('Database imported successfully!');
    
    process.exit(0);
  } catch (err) {
    console.error('Error importing database:', err);
    process.exit(1);
  }
}

importDb();

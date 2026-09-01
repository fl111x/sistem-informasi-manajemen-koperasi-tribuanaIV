const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'koperasi_tribuana',
  });

  const [tables] = await db.query('SHOW TABLES');
  console.log('Tables:', tables);

  const [colsAnggota] = await db.query('DESCRIBE Anggota');
  console.log('Anggota columns:', colsAnggota);
  
  const [colsTransaksi] = await db.query('DESCRIBE Transaksi');
  console.log('Transaksi columns:', colsTransaksi);
  
  await db.end();
}
run();

const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'koperasi_tribuana',
  });

  try {
    console.log('Menyebar tanggal transaksi dari Januari 2026 sampai hari ini...');
    
    // Rentang waktu: 1 Januari 2026 sampai sekarang (sekitar 1 September 2026)
    // Kita gunakan TIMESTAMPADD dan RAND() untuk mendapatkan tanggal acak
    const query = `
      UPDATE transaksi 
      SET waktu_transaksi = TIMESTAMPADD(
        SECOND, 
        FLOOR(RAND() * TIMESTAMPDIFF(SECOND, '2026-01-01 00:00:00', NOW())), 
        '2026-01-01 00:00:00'
      )
    `;
    
    const [result] = await db.query(query);
    console.log(`Berhasil mengubah ${result.affectedRows} baris transaksi.`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.end();
  }
}

run();

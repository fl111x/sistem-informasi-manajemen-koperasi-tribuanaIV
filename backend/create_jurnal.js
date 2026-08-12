const db = require('./src/config/db');

async function createJurnalTable() {
  const connection = await db.getConnection();
  try {
    console.log("Creating Jurnal_Akuntansi table...");
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`Jurnal_Akuntansi\` (
        \`id_jurnal\` int NOT NULL AUTO_INCREMENT,
        \`keterangan\` varchar(255) NOT NULL,
        \`akun_debit\` varchar(100) NOT NULL,
        \`akun_kredit\` varchar(100) NOT NULL,
        \`nominal\` decimal(15,2) NOT NULL,
        \`id_transaksi_referensi\` int DEFAULT NULL,
        \`jenis_referensi\` varchar(50) DEFAULT NULL,
        \`waktu_jurnal\` datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id_jurnal\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log("Jurnal_Akuntansi table created.");
  } catch (err) {
    console.error("Critical error:", err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

createJurnalTable();

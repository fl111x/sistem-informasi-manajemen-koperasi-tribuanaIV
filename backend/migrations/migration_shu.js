const db = require('../src/config/db');

async function migrateSHU() {
  const connection = await db.getConnection();
  try {
    console.log("Starting SHU migration...");
    
    // Add nrp column to Transaksi
    try {
      await connection.query(`ALTER TABLE Transaksi ADD COLUMN nrp VARCHAR(50) NULL`);
      console.log("Column nrp added to Transaksi.");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log("Column nrp already exists.");
      } else {
        throw e;
      }
    }

    // Add Foreign Key from Transaksi(nrp) to Anggota(nrp)
    try {
      await connection.query(`
        ALTER TABLE Transaksi
        ADD CONSTRAINT fk_transaksi_anggota
        FOREIGN KEY (nrp) REFERENCES Anggota(nrp)
        ON DELETE SET NULL
      `);
      console.log("Foreign key fk_transaksi_anggota added.");
    } catch (e) {
      // ER_DUP_KEY or similar means it already exists
      if (e.code === 'ER_DUP_KEY' || e.message.includes('already exists')) {
        console.log("Foreign key fk_transaksi_anggota already exists.");
      } else {
         // ignore if it already exists, usually ER_FK_DUP_NAME in some mysql versions
         console.log("Foreign key might already exist:", e.message);
      }
    }

    console.log("Migration SHU completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

migrateSHU();

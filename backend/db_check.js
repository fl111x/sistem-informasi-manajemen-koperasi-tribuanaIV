const db = require('./src/config/db');

async function check() {
  try {
    const [transaksi] = await db.execute('DESCRIBE Transaksi');
    console.log('--- Tabel Transaksi ---');
    console.table(transaksi);

    const [riwayat] = await db.execute('DESCRIBE riwayat_transaksi');
    console.log('--- Tabel Riwayat Transaksi ---');
    console.table(riwayat);

    const [barang] = await db.execute('DESCRIBE Barang');
    console.log('--- Tabel Barang ---');
    console.table(barang);
  } catch (error) {
    console.error(error);
  }
  process.exit();
}

check();

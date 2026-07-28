const db = require('../src/config/db');

async function showDb() {
  try {
    const [barang] = await db.execute('SHOW CREATE TABLE Barang');
    console.log(barang[0]['Create Table']);

    const [detail] = await db.execute('SHOW CREATE TABLE detail_transaksi');
    console.log(detail[0]['Create Table']);

    const [transaksi] = await db.execute('SHOW CREATE TABLE Transaksi');
    console.log(transaksi[0]['Create Table']);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

showDb();

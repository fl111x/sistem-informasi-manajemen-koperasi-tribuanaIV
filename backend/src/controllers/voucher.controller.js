const pool = require('../config/db');

exports.distribusiVoucher = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Tambah jatah voucher Rp 100.000 ke saldo_voucher seluruh anggota aktif (sistem akumulasi/penumpukan)
    await connection.query(`
      UPDATE anggota 
      SET saldo_voucher = saldo_voucher + 100000.00 
      WHERE is_active = 1
    `);

    await connection.commit();
    res.status(200).json({ message: 'Voucher bulanan (Rp 100.000) berhasil didistribusikan dan diakumulasikan ke seluruh anggota aktif.' });
  } catch (error) {
    await connection.rollback();
    console.error('Error in distribusiVoucher:', error);
    res.status(500).json({ error: 'Gagal mendistribusikan voucher' });
  } finally {
    connection.release();
  }
};

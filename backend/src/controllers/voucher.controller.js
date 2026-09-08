const pool = require('../config/db');

exports.distribusiVoucher = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Move current saldo_voucher to simpanan for all active members
    await connection.query(`
      UPDATE anggota 
      SET simpanan = simpanan + saldo_voucher 
      WHERE is_active = 1
    `);

    // 2. Set new saldo_voucher to 100000 for all active members
    await connection.query(`
      UPDATE anggota 
      SET saldo_voucher = 100000.00 
      WHERE is_active = 1
    `);

    await connection.commit();
    res.status(200).json({ message: 'Voucher berhasil didistribusikan. Sisa voucher bulan sebelumnya telah dimasukkan ke simpanan.' });
  } catch (error) {
    await connection.rollback();
    console.error('Error in distribusiVoucher:', error);
    res.status(500).json({ error: 'Gagal mendistribusikan voucher' });
  } finally {
    connection.release();
  }
};

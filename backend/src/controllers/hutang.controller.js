const db = require('../config/db');

exports.getAllHutang = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT h.*, p.waktu_pembelian, p.total_biaya as po_total_biaya, s.nama_supplier 
      FROM Hutang_Supplier h
      JOIN Pembelian p ON h.id_pembelian = p.id_pembelian
      JOIN Supplier s ON h.id_supplier = s.id_supplier
      ORDER BY h.tanggal_jatuh_tempo ASC
    `);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data hutang' });
  }
};

exports.bayarHutang = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const { nominal_bayar, keterangan, metode_pembayaran } = req.body;

    if (!nominal_bayar || nominal_bayar <= 0) {
      return res.status(400).json({ message: 'Nominal bayar tidak valid' });
    }

    await connection.beginTransaction();

    const [hutangRows] = await connection.execute('SELECT * FROM Hutang_Supplier WHERE id_hutang = ? FOR UPDATE', [id]);
    if (hutangRows.length === 0) throw new Error("Hutang tidak ditemukan");
    
    const hutang = hutangRows[0];
    
    if (hutang.sisa_hutang < nominal_bayar) {
      throw new Error("Nominal bayar melebihi sisa hutang");
    }

    const newSisa = hutang.sisa_hutang - nominal_bayar;
    let newStatus = 'Sebagian';
    if (newSisa === 0) newStatus = 'Lunas';

    await connection.execute(
      'UPDATE Hutang_Supplier SET sisa_hutang = ?, status_lunas = ? WHERE id_hutang = ?',
      [newSisa, newStatus, id]
    );

    await connection.execute(
      'INSERT INTO Riwayat_Cicilan_Hutang (id_hutang, nominal_bayar, metode_pembayaran, keterangan) VALUES (?, ?, ?, ?)',
      [id, nominal_bayar, metode_pembayaran || 'Transfer', keterangan || null]
    );

    // Jurnal Akuntansi Pelunasan Hutang
    await connection.execute(
      `INSERT INTO Jurnal_Akuntansi (keterangan, akun_debit, akun_kredit, nominal, id_transaksi_referensi, jenis_referensi) 
       VALUES (?, 'Hutang Dagang', 'Kas', ?, ?, 'Pelunasan Hutang')`,
      [`Pelunasan Hutang ID ${id}`, nominal_bayar, id]
    );

    // Update status pembayaran di Pembelian jika lunas
    if (newStatus === 'Lunas') {
      await connection.execute(
        'UPDATE Pembelian SET status_pembayaran = ? WHERE id_pembelian = ?',
        ['Lunas', hutang.id_pembelian]
      );
    }

    await connection.commit();
    res.status(200).json({ message: 'Pembayaran hutang berhasil dicatat', sisa_hutang: newSisa });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    if (error.message === "Hutang tidak ditemukan" || error.message === "Nominal bayar melebihi sisa hutang") {
       return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Terjadi kesalahan saat memproses pembayaran hutang' });
  } finally {
    connection.release();
  }
};

exports.getRiwayatCicilan = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute('SELECT * FROM Riwayat_Cicilan_Hutang WHERE id_hutang = ? ORDER BY tanggal_bayar DESC', [id]);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil riwayat cicilan' });
  }
};

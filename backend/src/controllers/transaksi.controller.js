const db = require('../config/db');

// Create new transaction (Kasir)
const createTransaksi = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { jenis_transaksi, total_bayar, items, nrp } = req.body;
    
    if (!jenis_transaksi || !items || items.length === 0) {
      return res.status(400).json({ message: 'Jenis transaksi dan item wajib diisi' });
    }

    if (jenis_transaksi !== 'Swalayan' && jenis_transaksi !== 'Grosir') {
      return res.status(400).json({ message: 'Jenis transaksi harus Swalayan atau Grosir' });
    }

    const id_pengguna = req.user ? req.user.id_pengguna : null;

    await connection.beginTransaction();

    const waktu_transaksi = new Date();

    const [transaksiResult] = await connection.execute(
      'INSERT INTO Transaksi (waktu_transaksi, total_bayar, jenis_transaksi, id_pengguna, nrp) VALUES (?, ?, ?, ?, ?)',
      [waktu_transaksi, total_bayar || 0, jenis_transaksi, id_pengguna, nrp || null]
    );

    const id_transaksi = transaksiResult.insertId;
    let calculatedTotal = 0;

    for (const item of items) {
      const { id_barang, quantity, diskon } = item;
      const discount = diskon || 0;

      const [barangRows] = await connection.execute('SELECT * FROM Barang WHERE id_barang = ? FOR UPDATE', [id_barang]);
      if (barangRows.length === 0) {
        throw new Error(`Barang dengan ID ${id_barang} tidak ditemukan`);
      }

      const barang = barangRows[0];
      let subtotal = 0;

      if (jenis_transaksi === 'Swalayan') {
        if (barang.stok_swalayan < quantity) {
          throw new Error(`Stok Swalayan tidak mencukupi untuk ${barang.nama_barang}`);
        }
        subtotal = (barang.harga_swalayan * quantity) - discount;
        calculatedTotal += subtotal;

        await connection.execute(
          'UPDATE Barang SET stok_swalayan = stok_swalayan - ? WHERE id_barang = ?',
          [quantity, id_barang]
        );
      } else if (jenis_transaksi === 'Grosir') {
        if (barang.stok_grosir < quantity) {
          throw new Error(`Stok Grosir tidak mencukupi untuk ${barang.nama_barang}`);
        }
        subtotal = (barang.harga_grosir * quantity) - discount;
        calculatedTotal += subtotal;

        await connection.execute(
          'UPDATE Barang SET stok_grosir = stok_grosir - ? WHERE id_barang = ?',
          [quantity, id_barang]
        );
      }

      await connection.execute(
        'INSERT INTO detail_transaksi (id_transaksi, id_barang, quantity_barang, diskon, subtotal, snapshot_nama_barang) VALUES (?, ?, ?, ?, ?, ?)',
        [id_transaksi, id_barang, quantity, discount, subtotal, barang.nama_barang]
      );
    }

    await connection.execute(
      'UPDATE Transaksi SET total_bayar = ? WHERE id_transaksi = ?',
      [calculatedTotal, id_transaksi]
    );

    await connection.execute(
      `INSERT INTO Jurnal_Akuntansi (keterangan, akun_debit, akun_kredit, nominal, id_transaksi_referensi, jenis_referensi) 
       VALUES (?, 'Kas', 'Penjualan', ?, ?, 'Penjualan')`,
      [`Penjualan ${jenis_transaksi} ID ${id_transaksi}`, calculatedTotal, id_transaksi]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Transaksi berhasil',
      id_transaksi: id_transaksi,
      total_bayar: calculatedTotal
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error creating transaksi:', error);
    res.status(500).json({ message: error.message || 'Terjadi kesalahan pada server internal' });
  } finally {
    if (connection) connection.release();
  }
};

// Get all transactions
const getTransaksi = async (req, res) => {
  try {
    const [transaksi] = await db.execute(`
      SELECT t.*, p.nama_pengguna as nama_kasir, a.nama as nama_anggota 
      FROM Transaksi t 
      LEFT JOIN Pengguna p ON t.id_pengguna = p.id_pengguna
      LEFT JOIN Anggota a ON t.nrp = a.nrp
      ORDER BY t.waktu_transaksi DESC
    `);
    res.status(200).json(transaksi);
  } catch (error) {
    console.error('Error fetching transaksi:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal' });
  }
};

// Get transaction by ID (with details)
const getTransaksiById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get header
    const [transaksiRows] = await db.execute(`
      SELECT t.*, p.nama_pengguna as nama_kasir, a.nama as nama_anggota 
      FROM Transaksi t 
      LEFT JOIN Pengguna p ON t.id_pengguna = p.id_pengguna
      LEFT JOIN Anggota a ON t.nrp = a.nrp
      WHERE t.id_transaksi = ?
    `, [id]);

    if (transaksiRows.length === 0) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    }

    // Get details
    const [details] = await db.execute(`
      SELECT dt.*, COALESCE(b.nama_barang, dt.snapshot_nama_barang) as nama_barang, b.barcode, b.satuan_swalayan, b.satuan_grosir 
      FROM detail_transaksi dt
      LEFT JOIN Barang b ON dt.id_barang = b.id_barang
      WHERE dt.id_transaksi = ?
    `, [id]);

    const result = {
      ...transaksiRows[0],
      items: details
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching transaksi by ID:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal' });
  }
};

const voidTransaksi = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const otorisatorId = req.user ? req.user.id_pengguna : 1; // Fallback jika tidak ada
    const alasan = 'Dihapus oleh Admin';

    await connection.beginTransaction();

    const [transaksiRows] = await connection.execute('SELECT * FROM Transaksi WHERE id_transaksi = ? FOR UPDATE', [id]);
    if (transaksiRows.length === 0) {
      throw new Error('Transaksi tidak ditemukan');
    }
    const transaksi = transaksiRows[0];

    if (transaksi.total_bayar == 0) {
       throw new Error('Transaksi ini sudah dibatalkan sebelumnya');
    }

    // Catat log void
    await connection.execute(
      'INSERT INTO void_log (id_kasir, id_otorisator, alasan, nominal_batal) VALUES (?, ?, ?, ?)',
      [transaksi.id_pengguna, otorisator.id_pengguna, alasan, transaksi.total_bayar]
    );

    // Kembalikan stok
    const [details] = await connection.execute('SELECT * FROM detail_transaksi WHERE id_transaksi = ?', [id]);
    for (const item of details) {
       if (transaksi.jenis_transaksi === 'Swalayan') {
          await connection.execute('UPDATE Barang SET stok_swalayan = stok_swalayan + ? WHERE id_barang = ?', [item.quantity_barang, item.id_barang]);
       } else if (transaksi.jenis_transaksi === 'Grosir') {
          await connection.execute('UPDATE Barang SET stok_grosir = stok_grosir + ? WHERE id_barang = ?', [item.quantity_barang, item.id_barang]);
       }
    }

    // Nolkan transaksi
    await connection.execute('UPDATE Transaksi SET total_bayar = 0 WHERE id_transaksi = ?', [id]);
    
    // Jurnal pembalik
    await connection.execute(
      `INSERT INTO Jurnal_Akuntansi (keterangan, akun_debit, akun_kredit, nominal, id_transaksi_referensi, jenis_referensi) 
       VALUES (?, 'Retur Penjualan', 'Kas', ?, ?, 'Penjualan')`,
      [`Void Penjualan ID ${id}`, transaksi.total_bayar, id]
    );

    await connection.commit();
    res.status(200).json({ message: 'Transaksi berhasil dibatalkan (void)' });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error void transaksi:', error);
    res.status(500).json({ message: error.message || 'Terjadi kesalahan internal' });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  createTransaksi,
  getTransaksi,
  getTransaksiById,
  voidTransaksi
};

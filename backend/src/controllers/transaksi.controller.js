const db = require('../config/db');

// Create new transaction (Kasir)
const createTransaksi = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { jenis_transaksi, total_bayar, items } = req.body;
    
    // items should be an array of: { id_barang, quantity, diskon }
    if (!jenis_transaksi || !items || items.length === 0) {
      return res.status(400).json({ message: 'jenis_transaksi and items are required' });
    }

    if (jenis_transaksi !== 'Swalayan' && jenis_transaksi !== 'Grosir') {
      return res.status(400).json({ message: 'jenis_transaksi must be Swalayan or Grosir' });
    }

    // Start DB Transaction
    await connection.beginTransaction();

    // 1. Insert into Transaksi table
    const id_pengguna = req.user ? req.user.id_pengguna : null;
    const waktu_transaksi = new Date(); // Current timestamp

    const [transaksiResult] = await connection.execute(
      'INSERT INTO Transaksi (waktu_transaksi, total_bayar, jenis_transaksi, id_pengguna) VALUES (?, ?, ?, ?)',
      [waktu_transaksi, total_bayar || 0, jenis_transaksi, id_pengguna]
    );

    const id_transaksi = transaksiResult.insertId;
    let calculatedTotal = 0;

    // 2. Loop through items, insert into riwayat_transaksi and deduct stock
    for (const item of items) {
      const { id_barang, quantity, diskon } = item;
      const discount = diskon || 0;

      // Check barang stock and price
      const [barangRows] = await connection.execute('SELECT * FROM Barang WHERE id_barang = ? FOR UPDATE', [id_barang]);
      if (barangRows.length === 0) {
        throw new Error(`Barang with ID ${id_barang} not found`);
      }

      const barang = barangRows[0];
      let subtotal = 0;

      if (jenis_transaksi === 'Swalayan') {
        if (barang.stok_swalayan < quantity) {
          throw new Error(`Stok Swalayan insufficient for ${barang.nama_barang}`);
        }
        
        // Calculate subtotal
        subtotal = (barang.harga_swalayan * quantity) - discount;
        calculatedTotal += subtotal;

        // Deduct stok swalayan
        await connection.execute(
          'UPDATE Barang SET stok_swalayan = stok_swalayan - ? WHERE id_barang = ?',
          [quantity, id_barang]
        );
      } else if (jenis_transaksi === 'Grosir') {
        if (barang.stok_grosir < quantity) {
          throw new Error(`Stok Grosir insufficient for ${barang.nama_barang}`);
        }
        
        // Calculate subtotal
        subtotal = (barang.harga_grosir * quantity) - discount;
        calculatedTotal += subtotal;

        // Deduct stok grosir
        await connection.execute(
          'UPDATE Barang SET stok_grosir = stok_grosir - ? WHERE id_barang = ?',
          [quantity, id_barang]
        );
      }

      // Insert into detail_transaksi
      await connection.execute(
        'INSERT INTO detail_transaksi (id_transaksi, id_barang, quantity_barang, diskon, subtotal) VALUES (?, ?, ?, ?, ?)',
        [id_transaksi, id_barang, quantity, discount, subtotal]
      );
    }

    // If total_bayar wasn't provided, or if we want to ensure exact calculation, we can update it
    // In many POS, total_bayar is the amount the customer gave, but here it might mean grand total.
    // We'll update the Transaksi record with the calculated total just to be safe.
    await connection.execute(
      'UPDATE Transaksi SET total_bayar = ? WHERE id_transaksi = ?',
      [calculatedTotal, id_transaksi]
    );

    // Commit Transaction
    await connection.commit();

    res.status(201).json({
      message: 'Transaksi berhasil',
      id_transaksi,
      total_bayar: calculatedTotal
    });

  } catch (error) {
    // Rollback if any error occurs (e.g. out of stock, invalid ID)
    await connection.rollback();
    console.error('Error creating transaksi:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Get all transactions
const getTransaksi = async (req, res) => {
  try {
    const [transaksi] = await db.execute(`
      SELECT t.*, p.nama_pengguna as nama_kasir 
      FROM Transaksi t 
      LEFT JOIN Pengguna p ON t.id_pengguna = p.id_pengguna
      ORDER BY t.waktu_transaksi DESC
    `);
    res.status(200).json(transaksi);
  } catch (error) {
    console.error('Error fetching transaksi:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get transaction by ID (with details)
const getTransaksiById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get header
    const [transaksi] = await db.execute(`
      SELECT t.*, p.nama_pengguna as nama_kasir 
      FROM Transaksi t 
      LEFT JOIN Pengguna p ON t.id_pengguna = p.id_pengguna
      WHERE t.id_transaksi = ?
    `, [id]);

    if (transaksi.length === 0) {
      return res.status(404).json({ message: 'Transaksi not found' });
    }

    // Get details (detail_transaksi)
    const [details] = await db.execute(`
      SELECT dt.*, b.nama_barang, b.barcode, b.satuan_swalayan, b.satuan_grosir 
      FROM detail_transaksi dt
      JOIN Barang b ON dt.id_barang = b.id_barang
      WHERE dt.id_transaksi = ?
    `, [id]);

    const result = {
      ...transaksi[0],
      items: details
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching transaksi by ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createTransaksi,
  getTransaksi,
  getTransaksiById
};

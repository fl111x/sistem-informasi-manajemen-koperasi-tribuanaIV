const TransaksiModel = require('../models/TransaksiModel');

// Create new transaction (Kasir)
const createTransaksi = async (req, res) => {
  try {
    const { jenis_transaksi, total_bayar, items } = req.body;
    
    // items should be an array of: { id_barang, quantity, diskon }
    if (!jenis_transaksi || !items || items.length === 0) {
      return res.status(400).json({ message: 'Jenis transaksi dan item wajib diisi' });
    }

    if (jenis_transaksi !== 'Swalayan' && jenis_transaksi !== 'Grosir') {
      return res.status(400).json({ message: 'Jenis transaksi harus Swalayan atau Grosir' });
    }

    const id_pengguna = req.user ? req.user.id_pengguna : null;

    const result = await TransaksiModel.createTransaction({
      jenis_transaksi,
      total_bayar,
      items,
      id_pengguna
    });

    res.status(201).json({
      message: 'Transaksi berhasil',
      id_transaksi: result.id_transaksi,
      total_bayar: result.total_bayar
    });

  } catch (error) {
    console.error('Error creating transaksi:', error);
    res.status(500).json({ message: error.message || 'Terjadi kesalahan pada server internal' });
  }
};

// Get all transactions
const getTransaksi = async (req, res) => {
  try {
    const transaksi = await TransaksiModel.findAll();
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
    
    const result = await TransaksiModel.findById(id);

    if (!result) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching transaksi by ID:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal' });
  }
};

module.exports = {
  createTransaksi,
  getTransaksi,
  getTransaksiById
};

const PembelianModel = require('../models/PembelianModel');

exports.getAllPembelian = async (req, res) => {
  try {
    const pembelian = await PembelianModel.findAll();
    res.status(200).json(pembelian);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan internal server' });
  }
};

exports.getPembelianById = async (req, res) => {
  try {
    const pembelian = await PembelianModel.findById(req.params.id);
    if (!pembelian) {
      return res.status(404).json({ message: 'Data pembelian tidak ditemukan' });
    }
    res.status(200).json(pembelian);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan internal server' });
  }
};

exports.createPembelian = async (req, res) => {
  try {
    const { kategori, id_supplier, items } = req.body;
    
    // Asumsi id_pengguna didapatkan dari token middleware
    const id_pengguna = req.user.id_pengguna;

    if (!kategori || !id_supplier || !items || items.length === 0) {
      return res.status(400).json({ message: 'Data tidak lengkap (kategori, id_supplier, items wajib diisi)' });
    }

    const result = await PembelianModel.createPembelian({
       kategori,
       id_supplier,
       id_pengguna,
       items
    });

    res.status(201).json({ 
       message: 'Pembelian berhasil dibuat', 
       id_pembelian: result.id_pembelian,
       total_biaya: result.total_biaya
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan saat membuat data pembelian' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Menunggu', 'Diterima', 'Dimutasi', 'Ditunda'].includes(status)) {
       return res.status(400).json({ message: 'Status tidak valid' });
    }

    const result = await PembelianModel.updateStatus(req.params.id, status);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengupdate status' });
  }
};

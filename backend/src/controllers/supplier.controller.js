const SupplierModel = require('../models/SupplierModel');

exports.getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await SupplierModel.findAll();
    res.status(200).json(suppliers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan internal server' });
  }
};

exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await SupplierModel.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier tidak ditemukan' });
    }
    res.status(200).json(supplier);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan internal server' });
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const { nama_supplier } = req.body;
    if (!nama_supplier) {
      return res.status(400).json({ message: 'Nama supplier wajib diisi' });
    }
    const id = await SupplierModel.create(req.body);
    res.status(201).json({ message: 'Supplier berhasil ditambahkan', id_supplier: id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan saat menambah data supplier' });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const affected = await SupplierModel.update(req.params.id, req.body);
    if (affected === 0) {
      return res.status(404).json({ message: 'Supplier tidak ditemukan' });
    }
    res.status(200).json({ message: 'Supplier berhasil diupdate' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengupdate data supplier' });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const affected = await SupplierModel.delete(req.params.id);
    if (affected === 0) {
      return res.status(404).json({ message: 'Supplier tidak ditemukan' });
    }
    res.status(200).json({ message: 'Supplier berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan saat menghapus data supplier' });
  }
};

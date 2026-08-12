const express = require('express');
const router = express.Router();
const pembelianController = require('../controllers/pembelian.controller');
const { verifyToken, verifyAdmin, authorizeRole } = require('../middleware/auth.middleware');

// GET all pembelian (bisa diakses admin pembelian & gudang)
router.get('/', verifyToken, pembelianController.getAllPembelian);

// GET pembelian by ID
router.get('/:id', verifyToken, pembelianController.getPembelianById);

// POST pembelian baru (idealnya oleh admin pembelian)
router.post('/', verifyToken, authorizeRole(['Admin Sistem', 'Admin Pembelian']), pembelianController.createPembelian);

// PUT status pembelian (idealnya oleh admin gudang)
// Disini dikasih pengecekan role lebih spesifik
router.put('/:id/status', verifyToken, authorizeRole(['Admin Sistem', 'Admin Order', 'Admin Gudang', 'Admin Penjualan']), pembelianController.updateStatus);

// PUT edit PO (hanya Admin Pembelian)
router.put('/:id/edit', verifyToken, authorizeRole(['Admin Sistem', 'Admin Pembelian']), pembelianController.editPO);

// POST mutasi PO parsial (hanya Admin Penjualan)
router.post('/:id/mutasi', verifyToken, authorizeRole(['Admin Sistem', 'Admin Penjualan']), pembelianController.mutasiPO);

module.exports = router;

const express = require('express');
const router = express.Router();
const pembelianController = require('../controllers/pembelian.controller');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

// GET all pembelian (bisa diakses admin pembelian & gudang)
router.get('/', verifyToken, pembelianController.getAllPembelian);

// GET pembelian by ID
router.get('/:id', verifyToken, pembelianController.getPembelianById);

// POST pembelian baru (idealnya oleh admin pembelian)
router.post('/', verifyToken, verifyAdmin, pembelianController.createPembelian);

// PUT status pembelian (idealnya oleh admin gudang)
// Disini bisa dikasih pengecekan role lebih spesifik nanti
router.put('/:id/status', verifyToken, verifyAdmin, pembelianController.updateStatus);

module.exports = router;

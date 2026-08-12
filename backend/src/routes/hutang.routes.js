const express = require('express');
const router = express.Router();
const hutangController = require('../controllers/hutang.controller');
const { verifyToken, authorizeRole } = require('../middleware/auth.middleware');

// GET all hutang (Admin Pembelian, Keuangan, Sistem)
router.get('/', verifyToken, authorizeRole(['Admin Sistem', 'Admin Pembelian']), hutangController.getAllHutang);

// POST bayar hutang (Admin Pembelian / Sistem)
router.post('/:id/bayar', verifyToken, authorizeRole(['Admin Sistem', 'Admin Pembelian']), hutangController.bayarHutang);

// GET riwayat cicilan hutang
router.get('/:id/riwayat', verifyToken, authorizeRole(['Admin Sistem', 'Admin Pembelian']), hutangController.getRiwayatCicilan);

module.exports = router;

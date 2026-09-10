const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucher.controller');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

// GET pengaturan & statistik voucher
router.get('/pengaturan', verifyToken, verifyAdmin, voucherController.getPengaturanVoucher);

// PUT update pengaturan voucher
router.put('/pengaturan', verifyToken, verifyAdmin, voucherController.updatePengaturanVoucher);

// GET riwayat/log distribusi voucher
router.get('/riwayat', verifyToken, verifyAdmin, voucherController.getRiwayatDistribusi);

// POST eksekusi distribusi voucher
router.post('/distribusi', verifyToken, verifyAdmin, voucherController.distribusiVoucher);

module.exports = router;

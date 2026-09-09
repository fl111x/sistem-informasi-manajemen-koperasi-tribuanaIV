const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucher.controller');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

// Endpoint to distribute vouchers (Only Admin can do this)
router.post('/distribusi', verifyToken, verifyAdmin, voucherController.distribusiVoucher);

module.exports = router;

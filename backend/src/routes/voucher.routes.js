const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucher.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Endpoint to distribute vouchers (Only Admin can do this)
router.post('/distribusi', verifyToken, isAdmin, voucherController.distribusiVoucher);

module.exports = router;

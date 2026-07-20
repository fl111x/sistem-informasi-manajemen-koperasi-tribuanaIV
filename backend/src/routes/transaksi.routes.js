const express = require('express');
const router = express.Router();
const transaksiController = require('../controllers/transaksi.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Protect all transaction routes (Any logged-in user / Kasir can access)
router.use(verifyToken);

router.post('/', transaksiController.createTransaksi);
router.get('/', transaksiController.getTransaksi);
router.get('/:id', transaksiController.getTransaksiById);

module.exports = router;

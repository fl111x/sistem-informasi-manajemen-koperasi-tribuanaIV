const express = require('express');
const router = express.Router();
const transaksiController = require('../controllers/transaksi.controller');
const { verifyToken, authorizeRole } = require('../middleware/auth.middleware');

// Protect all transaction routes (Any logged-in user / Kasir can access)
router.use(verifyToken);

router.post('/', transaksiController.createTransaksi);
router.get('/', transaksiController.getTransaksi);
router.get('/:id', transaksiController.getTransaksiById);
router.post('/:id/void', authorizeRole(['Admin Sistem']), transaksiController.voidTransaksi);

module.exports = router;

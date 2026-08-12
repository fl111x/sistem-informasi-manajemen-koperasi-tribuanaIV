const express = require('express');
const router = express.Router();
const barangController = require('../controllers/barang.controller');
const { verifyToken, verifyAdmin, authorizeRole } = require('../middleware/auth.middleware');

// Protect routes with token
router.use(verifyToken);

router.get('/alert-belum-diset', verifyAdmin, barangController.getBarangBelumDiset);
router.get('/', barangController.getAllBarang); // Semua role yang login (termasuk kasir) bisa melihat daftar barang
router.get('/:id', barangController.getBarangById);

router.post('/mutasi', authorizeRole(['Admin Sistem', 'Admin Penjualan']), barangController.mutasiBarang);
router.post('/', verifyAdmin, barangController.createBarang);
router.put('/:id', verifyAdmin, barangController.updateBarang);
router.delete('/:id', verifyAdmin, barangController.deleteBarang);

module.exports = router;

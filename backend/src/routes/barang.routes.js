const express = require('express');
const router = express.Router();
const barangController = require('../controllers/barang.controller');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

// Protect all barang management routes with admin verification (for now)
router.use(verifyToken, verifyAdmin);

router.get('/', barangController.getAllBarang);
router.get('/:id', barangController.getBarangById);
router.post('/', barangController.createBarang);
router.put('/:id', barangController.updateBarang);
router.delete('/:id', barangController.deleteBarang);

module.exports = router;

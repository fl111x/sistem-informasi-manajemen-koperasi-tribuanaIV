const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const { verifyToken, authorizeRole } = require('../middleware/auth.middleware');

router.use(verifyToken);
// Anggap saja semua admin bisa melihat supplier, tapi idealnya dibatasi
router.get('/', supplierController.getAllSuppliers);
router.get('/:id', supplierController.getSupplierById);
router.post('/', authorizeRole(['Admin Pembelian', 'Super Admin', 'Admin']), supplierController.createSupplier);
router.put('/:id', authorizeRole(['Admin Pembelian', 'Super Admin', 'Admin']), supplierController.updateSupplier);
router.delete('/:id', authorizeRole(['Admin Pembelian', 'Super Admin', 'Admin']), supplierController.deleteSupplier);

module.exports = router;

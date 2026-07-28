const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

router.get('/', verifyToken, supplierController.getAllSuppliers);
router.get('/:id', verifyToken, supplierController.getSupplierById);
router.post('/', verifyToken, verifyAdmin, supplierController.createSupplier);
router.put('/:id', verifyToken, verifyAdmin, supplierController.updateSupplier);
router.delete('/:id', verifyToken, verifyAdmin, supplierController.deleteSupplier);

module.exports = router;

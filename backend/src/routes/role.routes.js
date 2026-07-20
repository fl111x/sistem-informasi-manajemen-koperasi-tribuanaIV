const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

// Protect all role routes with admin verification
router.use(verifyToken, verifyAdmin);

router.get('/', roleController.getAllRoles);
router.get('/:id', roleController.getRoleById);
router.post('/', roleController.createRole);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

module.exports = router;

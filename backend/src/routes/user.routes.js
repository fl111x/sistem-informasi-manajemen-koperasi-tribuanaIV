const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

// Protect all user management routes with admin verification
router.use(verifyToken, verifyAdmin);

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;

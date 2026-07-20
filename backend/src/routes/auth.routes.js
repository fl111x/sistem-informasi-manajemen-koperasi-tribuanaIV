const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

router.post('/login', authController.login);
router.post('/logout', verifyToken, authController.logout);
router.post('/reset-password', authController.resetPassword);

// Only admin can register new users
router.post('/register', [verifyToken, verifyAdmin], authController.register);

module.exports = router;

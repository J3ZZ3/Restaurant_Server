const express = require('express');
const router = express.Router();
const { register, login, getUserProfile, updateUserProfile } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// User registration and login routes
router.post('/register', register);
router.post('/login', login); // Regular login route

// Admin login route
router.post('/admin/login', login); // Admin login route

// Protected routes
router.get('/me', authMiddleware, getUserProfile);
router.put('/me', authMiddleware, updateUserProfile);

module.exports = router;

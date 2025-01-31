const express = require('express');
const router = express.Router();
const { register, login, getUserProfile, updateUserProfile } = require('../controllers/authController');

// User registration and login routes
router.post('/register', register);
router.post('/login', login); // Regular login route

// Admin login route
router.post('/admin/login', login); // Admin login route

router.get('/me', getUserProfile);
router.put('/me', updateUserProfile);

module.exports = router;

const express = require('express');
const router = express.Router();
const { register, login, getUserProfile, updateUserProfile } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', getUserProfile);
router.put('/me', updateUserProfile);

module.exports = router;

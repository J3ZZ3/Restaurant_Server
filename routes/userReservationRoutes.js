const express = require('express');
const router = express.Router();
const { getUserReservations } = require('../controllers/reservationController');
const authMiddleware = require('../middleware/authMiddleware');

// Get reservations for the logged-in user
router.get('/', authMiddleware, getUserReservations);

module.exports = router; 
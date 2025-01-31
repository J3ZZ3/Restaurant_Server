const express = require('express');
const router = express.Router();
const { createPayment, getUserPayments, getAllPayments, createPayFastPayment } = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

// Create a new payment
router.post('/', authMiddleware, createPayment);

// Get payments for the logged-in user
router.get('/me', authMiddleware, getUserPayments);

// Get all payments (admin only)
router.get('/', authMiddleware, getAllPayments);

// Create a new payment with PayFast
router.post('/payfast', authMiddleware, createPayFastPayment);

module.exports = router; 
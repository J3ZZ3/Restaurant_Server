const express = require('express');
const router = express.Router();
const { createPaymentIntent, handleWebhook } = require('../controllers/PaymentController');
const authMiddleware = require('../middleware/authMiddleware');

// Define your routes
router.post('/create-payment-intent', authMiddleware, createPaymentIntent);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router; 
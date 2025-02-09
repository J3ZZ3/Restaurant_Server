const express = require('express');
const router = express.Router();
const { createPaymentIntent } = require('../controllers/stripePaymentController');
const authMiddleware = require('../middleware/authMiddleware');

// Define your routes
router.post('/create-payment-intent', authMiddleware, createPaymentIntent);

module.exports = router; 
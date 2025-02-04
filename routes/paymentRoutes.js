const express = require('express');
const router = express.Router();
const { 
  createPayfastPayment, 
  handlePayfastNotification,
  createPaymentIntent,
  handleStripeWebhook
} = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

// Stripe routes
router.post('/create-payment-intent', authMiddleware, createPaymentIntent);
router.post('/webhook', express.raw({type: 'application/json'}), handleStripeWebhook);

// PayFast routes (existing)
router.post('/create-payfast', authMiddleware, createPayfastPayment);
router.post('/notify', handlePayfastNotification); // PayFast ITN (Instant Transaction Notification)

module.exports = router; 
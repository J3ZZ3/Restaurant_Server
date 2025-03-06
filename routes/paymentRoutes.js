const express = require('express');
const router = express.Router();
const { createPaypalOrder, capturePaypalOrder, requestRefund } = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

// Define PayPal routes
router.post('/create-order', authMiddleware, createPaypalOrder);
router.post('/capture-order', authMiddleware, capturePaypalOrder);
router.post('/request-refund', authMiddleware, requestRefund);

module.exports = router; 
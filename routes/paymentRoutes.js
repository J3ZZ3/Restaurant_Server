const express = require('express');
const router = express.Router();
const { createPayment } = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');


// Define your routes
router.post('/create-payment', authMiddleware, createPayment);

module.exports = router; 
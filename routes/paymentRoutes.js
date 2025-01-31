const express = require('express');
const router = express.Router();
const { createPayfastPayment, handlePayfastNotification } = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create-payfast', authMiddleware, createPayfastPayment);
router.post('/notify', handlePayfastNotification); // PayFast ITN (Instant Transaction Notification)

module.exports = router; 
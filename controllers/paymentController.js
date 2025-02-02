const Payment = require('../models/paymentModel');
const Reservation = require('../models/reservationModel');
const axios = require('axios');
const md5 = require('md5');

// Create a new payment
exports.createPayment = async (req, res) => {
  const { reservationId, amount } = req.body;
  try {
    const payment = await Payment.create({
      userId: req.user.id, // Ensure userId is set
      reservationId,
      amount,
      status: 'pending', // Set initial status
    });
    res.status(201).json({ message: 'Payment created successfully', payment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get payments for the logged-in user
exports.getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id }).populate('reservationId');
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all payments (admin only)
exports.getAllPayments = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  try {
    const payments = await Payment.find().populate('reservationId');
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createPayment = async (reservationId, amount) => {
  try {
    const response = await axios.post('https://restaurant-server-4-ydyp.onrender.com/api/payments', {
      reservationId,
      amount,
    }, {
      headers: {
        Authorization: `Bearer ${token}`, // Ensure you include the token
      },
    });
    console.log('Payment created:', response.data);
  } catch (error) {
    console.error('Payment creation error:', error.response?.data || error.message);
  }
};

// Create a new payment with PayFast
exports.createPayFastPayment = async (req, res) => {
    const { amount } = req.body; // Get amount from request
    const payfastUrl = 'https://sandbox.payfast.co.za/eng/process'; // Use sandbox for testing
    const payfastMerchantId = process.env.PAYFAST_MERCHANT_ID;
    const payfastMerchantKey = process.env.PAYFAST_MERCHANT_KEY;
    const payfastReturnUrl = 'http://yourdomain.com/payment-success'; // Update with your return URL
    const payfastCancelUrl = 'http://yourdomain.com/payment-cancel'; // Update with your cancel URL

    const params = {
        merchant_id: payfastMerchantId,
        merchant_key: payfastMerchantKey,
        amount: amount,
        item_name: 'Restaurant Reservation',
        return_url: payfastReturnUrl,
        cancel_url: payfastCancelUrl,
    };

    // Generate the signature
    const signature = generatePayFastSignature(params);
    params.signature = signature;

    // Return the payment URL
    const paymentUrl = `${payfastUrl}?${new URLSearchParams(params).toString()}`;
    res.status(200).json({ paymentUrl }); // Send payment URL back to client
};

// Function to generate PayFast signature
const generatePayFastSignature = (params) => {
    const sortedParams = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
    return md5(sortedParams + process.env.PAYFAST_SECRET); // Use your secret key
};

exports.updatePaymentStatus = async (req, res) => {
  const { paymentId, status } = req.body; // Expect paymentId and new status in the request body
  try {
    const payment = await Payment.findByIdAndUpdate(paymentId, { status }, { new: true });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 
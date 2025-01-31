const crypto = require('crypto');
const Payment = require('../models/paymentModel');
const Reservation = require('../models/reservationModel');

exports.createPayfastPayment = async (req, res) => {
  try {
    const { amount, reservationId } = req.body;
    
    // Generate PayFast payment data
    const data = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY,
      return_url: `${process.env.CLIENT_URL}/payment-success`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancelled`,
      notify_url: `${process.env.SERVER_URL}/api/payments/notify`,
      amount: amount.toFixed(2),
      item_name: `Reservation #${reservationId}`,
      custom_str1: reservationId,
    };

    // Generate signature
    const signature = generatePayfastSignature(data);
    data.signature = signature;

    // For testing
    const paymentUrl = process.env.PAYFAST_TEST_MODE === 'true' 
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';

    res.json({ paymentUrl, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.handlePayfastNotification = async (req, res) => {
  try {
    // Verify ITN data
    const isValid = await validatePayfastITN(req);
    if (!isValid) {
      return res.status(400).send('Invalid ITN');
    }

    const { payment_status, custom_str1: reservationId } = req.body;

    // Update reservation payment status
    await Reservation.findByIdAndUpdate(reservationId, {
      paymentStatus: payment_status === 'COMPLETE' ? 'completed' : 'failed'
    });

    res.status(200).send('ITN Processed');
  } catch (error) {
    res.status(500).send('ITN Processing Failed');
  }
};

// Helper functions for signature generation and ITN validation
function generatePayfastSignature(data) {
  // Implementation of PayFast signature generation
}

async function validatePayfastITN(req) {
  // Implementation of PayFast ITN validation
} 
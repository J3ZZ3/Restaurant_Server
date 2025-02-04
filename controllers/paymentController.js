const crypto = require('crypto');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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

// Add this new function for Stripe payments
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, reservationId } = req.body;
    
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // amount in cents
      currency: 'zar',
      payment_method_types: ['card', 'google_pay'],
      metadata: {
        reservationId: reservationId
      }
    });

    // Send the client secret to the client
    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add webhook handler for Stripe events
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful payment
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const reservationId = paymentIntent.metadata.reservationId;

    try {
      await Reservation.findByIdAndUpdate(reservationId, {
        paymentStatus: 'completed'
      });
    } catch (error) {
      console.error('Error updating reservation:', error);
      return res.status(500).send('Error updating reservation status');
    }
  }

  res.json({ received: true });
};

// Helper functions for signature generation and ITN validation
function generatePayfastSignature(data) {
  // Implementation of PayFast signature generation
}

async function validatePayfastITN(req) {
  // Implementation of PayFast ITN validation
} 
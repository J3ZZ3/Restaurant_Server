const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Initialize Stripe
const Payment = require('../models/paymentModel');
const Reservation = require('../models/reservationModel');

// Create a payment intent
const createPaymentIntent = async (req, res) => {
    const { amount, reservationId } = req.body;

    if (!amount || !reservationId) {
        return res.status(400).json({ error: 'Amount and reservationId are required' });
    }

    try {
        // Create the payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            metadata: {
                reservationId: reservationId,
                userId: req.user._id.toString()
            }
        });

        // Create a payment record in our database
        const payment = new Payment({
            reservationId: reservationId,
            amount: amount,
            status: 'pending',
            transactionId: paymentIntent.id
        });
        await payment.save();

        // Update reservation payment status
        await Reservation.findByIdAndUpdate(reservationId, {
            paymentStatus: 'processing',
            paymentIntentId: paymentIntent.id
        });

        res.status(200).json({ 
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: error.message });
    }
};

// Export the function
module.exports = { createPaymentIntent }; 
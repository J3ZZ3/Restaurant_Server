const Payment = require('../models/paymentModel');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Initialize Stripe

// Create payment
const createPayment = async (req, res) => {
    const { amount, reservationId } = req.body;

    if (!amount || !reservationId) {
        return res.status(400).json({ error: 'Amount and reservationId are required' });
    }

    console.log('Creating payment with amount:', amount);

    try {
        // Create a payment intent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // Amount in cents
            currency: 'usd',
            metadata: { reservationId: reservationId }, // Attach reservation ID for reference
        });

        // Save payment details to the database
        const payment = new Payment({
            reservationId,
            amount,
            status: 'pending',
            transactionId: paymentIntent.id,
        });
        await payment.save();

        res.status(200).json({ clientSecret: paymentIntent.client_secret }); // Return client secret for the frontend
    } catch (err) {
        console.error('Payment creation error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Export the function
module.exports = { createPayment };



const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Initialize Stripe
const Payment = require('../models/paymentModel');
const Reservation = require('../models/reservationModel');

// Create a payment intent
const createPaymentIntent = async (req, res) => {
    try {
        const { amount, reservationId } = req.body;

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            metadata: {
                reservationId,
                userId: req.user._id.toString()
            }
        });

        // Create payment record
        await Payment.create({
            reservationId,
            amount: amount / 100, // Convert back to dollars for our records
            status: 'pending',
            transactionId: paymentIntent.id
        });

        // Update reservation status
        await Reservation.findByIdAndUpdate(reservationId, {
            paymentStatus: 'processing'
        });

        res.json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        console.error('Payment intent error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Export the function
module.exports = { createPaymentIntent };

exports.handleWebhook = async (req, res) => {
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
        const { reservationId } = paymentIntent.metadata;

        await Promise.all([
            Payment.findOneAndUpdate(
                { transactionId: paymentIntent.id },
                { status: 'completed' }
            ),
            Reservation.findByIdAndUpdate(reservationId, {
                paymentStatus: 'completed'
            })
        ]);
    }

    res.json({ received: true });
}; 
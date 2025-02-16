const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Initialize Stripe
const Payment = require('../models/paymentModel');
const Reservation = require('../models/reservationModel');

// Create a payment intent
exports.createPaymentIntent = async (req, res) => {
    try {
        const { amount, reservationId } = req.body;

        // Create a payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert to cents
            currency: 'usd',
            metadata: { reservationId }
        });

        // Create a payment record in our database
        await Payment.create({
            reservationId,
            amount,
            status: 'pending',
            transactionId: paymentIntent.id
        });

        res.status(200).json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        console.error('Payment intent error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Handle Stripe webhook events
exports.handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                
                // Update payment status in database
                await Payment.findOneAndUpdate(
                    { transactionId: paymentIntent.id },
                    { 
                        status: 'completed',
                        updatedAt: Date.now()
                    }
                );

                // Update reservation payment status
                if (paymentIntent.metadata.reservationId) {
                    await Reservation.findByIdAndUpdate(
                        paymentIntent.metadata.reservationId,
                        { 
                            paymentStatus: 'completed',
                            status: 'confirmed',
                            updatedAt: Date.now()
                        }
                    );
                }
                break;

            case 'payment_intent.payment_failed':
                const failedPayment = event.data.object;
                
                // Update payment status in database
                await Payment.findOneAndUpdate(
                    { transactionId: failedPayment.id },
                    { 
                        status: 'failed',
                        updatedAt: Date.now()
                    }
                );

                // Update reservation payment status
                if (failedPayment.metadata.reservationId) {
                    await Reservation.findByIdAndUpdate(
                        failedPayment.metadata.reservationId,
                        { 
                            paymentStatus: 'failed',
                            updatedAt: Date.now()
                        }
                    );
                }
                break;
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).json({ error: error.message });
    }
}; 
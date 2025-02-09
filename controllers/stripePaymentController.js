const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Initialize Stripe

// Create a payment intent
const createPaymentIntent = async (req, res) => {
    const { amount } = req.body;

    if (!amount) {
        return res.status(400).json({ error: 'Amount is required' });
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // Amount in cents
            currency: 'usd',
        });

        res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: error.message });
    }
};

// Export the function
module.exports = { createPaymentIntent }; 
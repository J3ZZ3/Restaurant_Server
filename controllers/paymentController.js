const Payment = require('../models/paymentModel');
const paypal = require('@paypal/checkout-server-sdk');

// Create PayPal client
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const environment = process.env.PAYPAL_MODE === 'live' 
    ? new paypal.core.LiveEnvironment(clientId, clientSecret) 
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);

// Create payment
const createPayment = async (req, res) => {
    const { amount, reservationId } = req.body;

    console.log('Creating payment with amount:', amount);

    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: 'USD',
                value: amount,
            },
        }],
    });

    try {
        const order = await client.execute(request);
        res.status(200).json({ approvalUrl: order.result.links.find(link => link.rel === 'approve').href });
    } catch (err) {
        console.error('Payment creation error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Export the function
module.exports = { createPayment };



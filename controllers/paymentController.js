const paypal = require('@paypal/checkout-server-sdk');
const Payment = require('../models/paymentModel');
const Reservation = require('../models/reservationModel');

// Configure PayPal environment
let environment = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
);
let client = new paypal.core.PayPalHttpClient(environment);

// Create PayPal order
exports.createPaypalOrder = async (req, res) => {
    try {
        const { amount, reservationId } = req.body;

        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: amount.toString()
                },
                description: `Reservation ID: ${reservationId}`
            }]
        });

        const order = await client.execute(request);

        // Create a payment record in our database
        await Payment.create({
            reservationId,
            amount,
            status: 'pending',
            transactionId: order.result.id
        });

        res.status(200).json({
            orderId: order.result.id,
            approvalUrl: order.result.links.find(link => link.rel === 'approve').href
        });
    } catch (error) {
        console.error('PayPal order creation error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Capture PayPal payment
exports.capturePaypalOrder = async (req, res) => {
    try {
        const { orderId, payerId, reservationId } = req.body;

        if (!orderId || !payerId) {
            throw new Error('Missing required payment parameters');
        }

        // First, verify the order exists and is pending
        const payment = await Payment.findOne({ transactionId: orderId });
        if (!payment) {
            throw new Error('Payment record not found');
        }

        // Create capture request
        const request = new paypal.orders.OrdersCaptureRequest(orderId);
        const capture = await client.execute(request);

        if (capture.result.status === 'COMPLETED') {
            // Update payment status in database
            await Payment.findOneAndUpdate(
                { transactionId: orderId },
                { 
                    status: 'completed',
                    updatedAt: Date.now(),
                    payerId: payerId
                }
            );

            // Update reservation status
            await Reservation.findByIdAndUpdate(
                reservationId,
                { 
                    paymentStatus: 'completed',
                    status: 'confirmed',
                    updatedAt: Date.now()
                }
            );

            res.status(200).json({
                status: 'success',
                orderId: capture.result.id
            });
        } else {
            throw new Error('Payment capture failed');
        }
    } catch (error) {
        console.error('PayPal capture error:', error);
        
        // Update payment status to failed
        if (req.body.orderId) {
            await Payment.findOneAndUpdate(
                { transactionId: req.body.orderId },
                { 
                    status: 'failed',
                    updatedAt: Date.now(),
                    error: error.message
                }
            );
        }

        // Update reservation status
        if (req.body.reservationId) {
            await Reservation.findByIdAndUpdate(
                req.body.reservationId,
                { 
                    paymentStatus: 'failed',
                    updatedAt: Date.now()
                }
            );
        }

        res.status(500).json({ 
            error: error.message,
            details: error.details || 'No additional details available'
        });
    }
}; 
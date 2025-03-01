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

        if (!amount || !reservationId) {
            return res.status(400).json({ 
                message: 'Amount and reservation ID are required' 
            });
        }

        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: amount.toFixed(2) // Ensure proper decimal formatting
                },
                description: `Reservation ID: ${reservationId}`
            }]
        });

        const order = await client.execute(request);

        // Create a payment record in our database
        const payment = await Payment.create({
            reservationId,
            amount,
            status: 'pending',
            transactionId: order.result.id
        });

        res.status(200).json({
            orderId: order.result.id,
            paymentId: payment._id
        });
    } catch (error) {
        console.error('PayPal order creation error:', error);
        res.status(500).json({ 
            message: 'Failed to create payment order',
            error: error.message 
        });
    }
};

// Capture PayPal payment
exports.capturePaypalOrder = async (req, res) => {
    try {
        const { orderId, reservationId } = req.body;

        if (!orderId || !reservationId) {
            return res.status(400).json({ 
                message: 'Order ID and reservation ID are required' 
            });
        }

        const request = new paypal.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});

        const capture = await client.execute(request);

        if (capture.result.status === 'COMPLETED') {
            // Update payment status in database
            await Payment.findOneAndUpdate(
                { transactionId: orderId },
                { 
                    status: 'completed',
                    updatedAt: Date.now()
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
            throw new Error('Payment not completed');
        }
    } catch (error) {
        console.error('PayPal capture error:', error);
        
        // Update payment and reservation status to failed
        try {
            if (req.body.orderId) {
                await Payment.findOneAndUpdate(
                    { transactionId: req.body.orderId },
                    { 
                        status: 'failed',
                        updatedAt: Date.now()
                    }
                );
            }

            if (req.body.reservationId) {
                await Reservation.findByIdAndUpdate(
                    req.body.reservationId,
                    { 
                        paymentStatus: 'failed',
                        updatedAt: Date.now()
                    }
                );
            }
        } catch (updateError) {
            console.error('Error updating status:', updateError);
        }

        res.status(500).json({ 
            message: 'Payment capture failed',
            error: error.message 
        });
    }
}; 
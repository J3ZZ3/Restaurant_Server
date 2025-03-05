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
            }],
            application_context: {
                return_url: 'https://priority-i4dq.onrender.com/payment/success',
                cancel_url: 'https://priority-i4dq.onrender.com/payment/cancel',
                user_action: 'PAY_NOW',
                shipping_preference: 'NO_SHIPPING'
            }
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

        if (!orderId || !payerId || !reservationId) {
            return res.status(400).json({ 
                error: 'Missing required parameters',
                required: ['orderId', 'payerId', 'reservationId'],
                received: { orderId, payerId, reservationId }
            });
        }

        // Find the payment record
        const payment = await Payment.findOne({ transactionId: orderId });
        if (!payment) {
            return res.status(404).json({ 
                error: 'Payment record not found',
                orderId 
            });
        }

        // Create capture request
        const request = new paypal.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});  // PayPal requires an empty request body
        
        const capture = await client.execute(request);

        if (capture.result.status === 'COMPLETED') {
            // Update payment status
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

            return res.status(200).json({
                status: 'success',
                orderId: capture.result.id,
                paymentId: payment._id,
                reservationId
            });
        } else {
            throw new Error(`Payment capture failed: ${capture.result.status}`);
        }
    } catch (error) {
        console.error('PayPal capture error:', error);
        
        // Update payment status to failed
        if (req.body.orderId) {
            try {
                await Payment.findOneAndUpdate(
                    { transactionId: req.body.orderId },
                    { 
                        status: 'failed',
                        updatedAt: Date.now(),
                        error: error.message
                    }
                );
            } catch (updateError) {
                console.error('Error updating payment status:', updateError);
            }
        }

        // Update reservation status
        if (req.body.reservationId) {
            try {
                await Reservation.findByIdAndUpdate(
                    req.body.reservationId,
                    { 
                        paymentStatus: 'failed',
                        updatedAt: Date.now()
                    }
                );
            } catch (updateError) {
                console.error('Error updating reservation status:', updateError);
            }
        }

        return res.status(500).json({ 
            error: 'Payment capture failed',
            message: error.message,
            details: error.details || 'No additional details available'
        });
    }
}; 
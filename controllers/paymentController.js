const paypal = require('@paypal/checkout-server-sdk');
const Payment = require('../models/paymentModel');
const Reservation = require('../models/reservationModel');
const io = require('../server');

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
        console.log('Received capture request:', { orderId, payerId, reservationId });

        if (!orderId || !payerId || !reservationId) {
            return res.status(400).json({ 
                error: 'Missing required parameters',
                required: ['orderId', 'payerId', 'reservationId'],
                received: { orderId, payerId, reservationId }
            });
        }

        // Find the payment record first
        const payment = await Payment.findOne({ transactionId: orderId });
        if (!payment) {
            return res.status(404).json({ 
                error: 'Payment record not found',
                orderId 
            });
        }

        // Check if payment is already completed
        if (payment.status === 'completed') {
            // Update reservation status if not already done
            await Reservation.findByIdAndUpdate(
                reservationId,
                { 
                    paymentStatus: 'completed',
                    status: 'confirmed',
                    updatedAt: Date.now()
                },
                { new: true }
            );

            return res.status(200).json({
                status: 'success',
                message: 'Payment already completed',
                orderId: payment.transactionId,
                paymentId: payment._id,
                reservationId
            });
        }

        // Create capture request
        const request = new paypal.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});
        
        console.log('Executing PayPal capture request...');
        const capture = await client.execute(request);
        console.log('PayPal capture response:', capture.result);

        if (capture.result.status === 'COMPLETED') {
            // Update payment status
            const updatedPayment = await Payment.findOneAndUpdate(
                { transactionId: orderId },
                { 
                    status: 'completed',
                    updatedAt: Date.now(),
                    payerId: payerId,
                    captureDetails: capture.result
                },
                { new: true }
            );

            // Update reservation status
            const updatedReservation = await Reservation.findByIdAndUpdate(
                reservationId,
                { 
                    paymentStatus: 'completed',
                    status: 'confirmed',
                    updatedAt: Date.now()
                },
                { new: true }
            );

            return res.status(200).json({
                status: 'success',
                orderId: capture.result.id,
                paymentId: updatedPayment._id,
                reservationId,
                reservation: updatedReservation
            });
        } else {
            throw new Error(`Payment capture failed: ${capture.result.status}`);
        }
    } catch (error) {
        console.error('PayPal capture error:', error);
        
        // Update payment status to failed if we have the orderId
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

        return res.status(500).json({ 
            error: 'Payment capture failed',
            message: error.message,
            details: error.details || 'No additional details available'
        });
    }
};

// Add this new function
exports.requestRefund = async (req, res) => {
    try {
        const { reservationId, reason } = req.body;

        // Find the payment record
        const payment = await Payment.findOne({ reservationId });
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        // Check if payment is eligible for refund
        if (payment.status !== 'completed') {
            return res.status(400).json({ 
                error: 'Payment not eligible for refund',
                status: payment.status 
            });
        }

        // Check if refund already requested
        if (payment.refundDetails && payment.refundDetails.status) {
            return res.status(400).json({ 
                error: 'Refund already requested',
                status: payment.refundDetails.status 
            });
        }

        // Create refund request using PayPal SDK
        const request = new paypal.payments.RefundsPostRequest(payment.transactionId);
        request.requestBody({
            amount: {
                currency_code: 'USD',
                value: payment.amount.toString()
            },
            note_to_payer: 'Refund for cancelled reservation'
        });

        const refund = await client.execute(request);

        // Update payment record
        const updatedPayment = await Payment.findByIdAndUpdate(
            payment._id,
            {
                status: 'refund_pending',
                refundDetails: {
                    requestedAt: new Date(),
                    reason: reason,
                    status: 'pending',
                    refundId: refund.result.id,
                    amount: payment.amount
                },
                updatedAt: Date.now()
            },
            { new: true }
        );

        // Update reservation status
        await Reservation.findByIdAndUpdate(
            reservationId,
            { 
                status: 'refund_pending',
                updatedAt: Date.now()
            }
        );

        // Emit event for real-time updates
        io.emit('refundRequested', updatedPayment);

        return res.status(200).json({
            status: 'success',
            message: 'Refund request processed successfully',
            refundId: refund.result.id,
            payment: updatedPayment
        });

    } catch (error) {
        console.error('Refund request error:', error);
        return res.status(500).json({ 
            error: 'Refund request failed',
            message: error.message,
            details: error.details || 'No additional details available'
        });
    }
}; 
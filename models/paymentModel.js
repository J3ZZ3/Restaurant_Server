const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  reservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', required: true },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded', 'refund_pending'], 
    default: 'pending' 
  },
  refundDetails: {
    requestedAt: Date,
    processedAt: Date,
    reason: String,
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected', 'completed'],
    },
    refundId: String,
    amount: Number
  },
  transactionId: { type: String },
  payerId: { type: String },
  error: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment; 
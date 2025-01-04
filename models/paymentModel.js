const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  reservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  transactionId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment; 
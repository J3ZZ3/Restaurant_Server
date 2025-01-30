const Payment = require('../models/paymentModel');
const Reservation = require('../models/reservationModel');

// Create a new payment
exports.createPayment = async (req, res) => {
  const { reservationId, amount } = req.body;
  try {
    const payment = await Payment.create({
      reservationId,
      amount,
      status: 'pending', // Set initial status
    });
    res.status(201).json({ message: 'Payment created successfully', payment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get payments for the logged-in user
exports.getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id }).populate('reservationId');
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all payments (admin only)
exports.getAllPayments = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  try {
    const payments = await Payment.find().populate('reservationId');
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 
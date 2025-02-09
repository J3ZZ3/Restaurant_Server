const express = require('express');
const router = express.Router();
const { createReservation, getUserReservations, getReservationById, updateReservation, deleteReservation, updatePaymentStatus } = require('../controllers/reservationController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, createReservation);
router.get('/', authMiddleware, getUserReservations);
router.get('/:id', authMiddleware, getReservationById);
router.put('/:id', authMiddleware, updateReservation);
router.delete('/:id', authMiddleware, deleteReservation);
router.put('/update-payment-status', authMiddleware, updatePaymentStatus);

module.exports = router; 
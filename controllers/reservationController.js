<<<<<<< HEAD
const Reservation = require("../models/reservationModel");
const Restaurant = require("../models/restaurantModel");
=======
const Reservation = require('../models/reservationModel');
const Restaurant = require('../models/restaurantModel');
>>>>>>> origin/second-phase

// Create a new reservation
exports.createReservation = async (req, res) => {
  const { restaurantId, date, timeSlot, numberOfGuests, name } = req.body;
  try {
<<<<<<< HEAD
    const reservation = await Reservation.create({
      userId: req.user.id,
      restaurantId,
      date,
      timeSlot,
      numberOfGuests,
      name,
    });
    res
      .status(201)
      .json({ message: "Reservation created successfully", reservation });
=======
    const reservation = await Reservation.create({ 
      userId: req.user.id, 
      restaurantId, 
      date, 
      timeSlot, 
      numberOfGuests,
      name
    });
    res.status(201).json({ message: 'Reservation created successfully', reservation });
>>>>>>> origin/second-phase
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get reservations for the logged-in user
exports.getUserReservations = async (req, res) => {
  try {
<<<<<<< HEAD
    const reservations = await Reservation.find({
      userId: req.user.id,
    }).populate("restaurantId");
    res.status(200).json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
=======
    const userId = req.user.id;
    const reservations = await Reservation.find({ userId })
      .populate('restaurantId');
    res.status(200).json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reservations' });
>>>>>>> origin/second-phase
  }
};

// Get reservation by ID
exports.getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
<<<<<<< HEAD
    if (!reservation)
      return res.status(404).json({ error: "Reservation not found" });
=======
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
>>>>>>> origin/second-phase
    res.status(200).json(reservation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update reservation
exports.updateReservation = async (req, res) => {
  try {
<<<<<<< HEAD
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!reservation)
      return res.status(404).json({ error: "Reservation not found" });
    res
      .status(200)
      .json({ message: "Reservation updated successfully", reservation });
=======
    const reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    res.status(200).json({ message: 'Reservation updated successfully', reservation });
>>>>>>> origin/second-phase
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete reservation
exports.deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);
<<<<<<< HEAD
    if (!reservation)
      return res.status(404).json({ error: "Reservation not found" });
    res.status(200).json({ message: "Reservation cancelled successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
=======
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    res.status(200).json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 
>>>>>>> origin/second-phase

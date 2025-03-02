const Reservation = require('../models/reservationModel');
const Restaurant = require('../models/restaurantModel');

// Update the createReservation function
exports.createReservation = async (req, res) => {
  const { 
    restaurantId, 
    date, 
    timeSlot, 
    guests,
    name,
    email,
    phone,
    occasion,
    specialRequests,
    seatingPreference,
    dietaryRestrictions,
    tablePreference
  } = req.body;

  try {
    // Validate restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Create reservation with all new fields
    const reservation = await Reservation.create({
      userId: req.user.id,
      restaurantId,
      date,
      timeSlot,
      guests,
      name,
      email,
      phone,
      occasion,
      specialRequests,
      seatingPreference,
      dietaryRestrictions,
      tablePreference,
      status: 'pending',
      paymentStatus: 'pending'
    });

    // Populate restaurant details
    await reservation.populate('restaurantId');

    res.status(201).json({
      message: 'Reservation created successfully',
      reservation
    });
  } catch (error) {
    console.error('Reservation creation error:', error);
    res.status(400).json({ error: error.message });
  }
};

// Add a new function to update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { reservationId, paymentStatus } = req.body;
    const reservation = await Reservation.findByIdAndUpdate(
      reservationId,
      { paymentStatus },
      { new: true }
    );
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.status(200).json({ message: 'Payment status updated', reservation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get reservations for the logged-in user
exports.getUserReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.user.id })
      .populate('restaurantId')
      .sort({ date: 1, timeSlot: 1 });
    
    res.status(200).json(reservations);
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
};

// Get reservation by ID
exports.getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    res.status(200).json(reservation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update reservation
exports.updateReservation = async (req, res) => {
  try {
    const {
      guests,
      date,
      timeSlot,
      occasion,
      specialRequests,
      seatingPreference,
      dietaryRestrictions,
      tablePreference
    } = req.body;

    const reservation = await Reservation.findOneAndUpdate(
      { 
        _id: req.params.id,
        userId: req.user.id // Ensure user owns the reservation
      },
      {
        guests,
        date,
        timeSlot,
        occasion,
        specialRequests,
        seatingPreference,
        dietaryRestrictions,
        tablePreference,
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('restaurantId');

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.status(200).json({
      message: 'Reservation updated successfully',
      reservation
    });
  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete reservation
exports.deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    res.status(200).json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add this function to your existing reservationController.js
exports.getAvailableTimeSlots = async (req, res) => {
    try {
        const { restaurantId, date } = req.params;
        const selectedDate = new Date(date);

        // Get all reservations for this restaurant on the selected date
        const existingReservations = await Reservation.find({
            restaurantId,
            date: {
                $gte: new Date(selectedDate.setHours(0, 0, 0)),
                $lt: new Date(selectedDate.setHours(23, 59, 59))
            }
        });

        // Define restaurant operating hours (you might want to make this dynamic per restaurant)
        const operatingHours = {
            start: 10, // 10 AM
            end: 22,   // 10 PM
            interval: 30 // 30-minute intervals
        };

        // Generate all possible time slots
        const allTimeSlots = [];
        for (let hour = operatingHours.start; hour < operatingHours.end; hour++) {
            allTimeSlots.push(`${hour}:00`);
            allTimeSlots.push(`${hour}:30`);
        }

        // Filter out booked slots
        const bookedTimes = existingReservations.map(res => res.timeSlot);
        const availableSlots = allTimeSlots.filter(slot => !bookedTimes.includes(slot));

        res.json({ availableSlots });
    } catch (error) {
        console.error('Error getting available time slots:', error);
        res.status(500).json({ error: 'Failed to get available time slots' });
    }
}; 
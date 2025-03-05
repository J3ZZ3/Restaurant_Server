const Reservation = require('../models/reservationModel');
const Restaurant = require('../models/restaurantModel');

// Define days array at the top level
const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Helper function to format time in 12-hour format
const formatTime = (time) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
};

// Helper function to generate time slots
const generateTimeSlots = (openTime, closeTime) => {
  const slots = [];
  const [openHour] = openTime.split(':');
  const [closeHour] = closeTime.split(':');
  
  for (let hour = parseInt(openHour); hour < parseInt(closeHour); hour++) {
    const time24 = `${hour}:00`;
    slots.push({
      time: formatTime(time24),
      available: true,
      maxGuests: 20
    });
    // Add half-hour slots
    slots.push({
      time: formatTime(`${hour}:30`),
      available: true,
      maxGuests: 20
    });
  }
  return slots;
};

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
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const requestedDate = new Date(date);
    const dayName = days[requestedDate.getDay()];
    const dayHours = restaurant.openingHours[dayName];

    if (!dayHours || !dayHours.open || !dayHours.close) {
      return res.status(400).json({ error: 'Restaurant is closed on this day' });
    }

    // Validate time slot format
    if (!/^(1[0-2]|0?[1-9]):[0-5][0-9] (AM|PM)$/.test(timeSlot)) {
      return res.status(400).json({ error: 'Invalid time slot format' });
    }

    // Create the reservation
    const reservation = new Reservation({
      userId: req.user._id,
      restaurantId,
      date: requestedDate,
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
    });

    await reservation.save();
    res.status(201).json({ message: 'Reservation created successfully', reservation });

  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ error: 'Failed to create reservation' });
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

// Get available time slots
exports.getAvailableTimeSlots = async (req, res) => {
  try {
    const { restaurantId, date } = req.params;
    const requestedDate = new Date(date);
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][requestedDate.getDay()];

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const dayHours = restaurant.openingHours[dayName];
    if (!dayHours || !dayHours.open || !dayHours.close) {
      return res.status(400).json({ error: 'Restaurant is closed on this day' });
    }

    // Generate available time slots
    const availableSlots = generateTimeSlots(dayHours.open, dayHours.close);

    // Get existing reservations for the date
    const existingReservations = await Reservation.find({
      restaurantId,
      date: {
        $gte: new Date(new Date(date).setHours(0, 0, 0)),
        $lt: new Date(new Date(date).setHours(23, 59, 59))
      }
    });

    // Update availability based on existing reservations
    existingReservations.forEach(reservation => {
      const slot = availableSlots.find(s => s.time === reservation.timeSlot);
      if (slot) {
        slot.available = false;
      }
    });

    res.status(200).json({
      date: requestedDate,
      dayName,
      openingHours: dayHours,
      availableSlots
    });

  } catch (error) {
    console.error('Get available time slots error:', error);
    res.status(500).json({ error: error.message });
  }
}; 
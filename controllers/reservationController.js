const Reservation = require('../models/reservationModel');
const Restaurant = require('../models/restaurantModel');

// Define days array at the top level
const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

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

// Add a new function to get available time slots
exports.getAvailableTimeSlots = async (req, res) => {
  try {
    const { restaurantId, date } = req.params;
    const requestedDate = new Date(date);
    
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const dayName = days[requestedDate.getDay()];
    const dayHours = restaurant.openingHours[dayName];

    if (!dayHours || !dayHours.open || !dayHours.close) {
      return res.status(200).json({ 
        timeSlots: [],
        message: 'Restaurant is closed on this day'
      });
    }

    // Generate time slots
    const timeSlots = [];
    const [openHour, openMinute = '00'] = dayHours.open.split(':');
    const [closeHour, closeMinute = '00'] = dayHours.close.split(':');

    const startTime = new Date(requestedDate);
    startTime.setHours(parseInt(openHour), parseInt(openMinute), 0, 0);
    
    const endTime = new Date(requestedDate);
    endTime.setHours(parseInt(closeHour), parseInt(closeMinute), 0, 0);

    // Get existing reservations for the date
    const existingReservations = await Reservation.find({
      restaurantId,
      date: {
        $gte: new Date(requestedDate.setHours(0, 0, 0, 0)),
        $lt: new Date(requestedDate.setHours(23, 59, 59, 999))
      }
    });

    // Generate slots in 30-minute intervals
    const currentTime = new Date(startTime);
    while (currentTime < endTime) {
      const hour = currentTime.getHours();
      const minutes = currentTime.getMinutes();
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      
      const timeString = `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;

      // Count existing reservations for this time slot
      const reservationsInSlot = existingReservations.filter(reservation => 
        reservation.timeSlot === timeString
      ).length;

      const availableCapacity = restaurant.maxGroupSize - (reservationsInSlot * 4);
      
      timeSlots.push({
        time: timeString,
        available: availableCapacity >= 4,
        capacity: Math.max(0, availableCapacity)
      });

      // Add 30 minutes
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    res.status(200).json({
      timeSlots,
      restaurantHours: restaurant.openingHours
    });

  } catch (error) {
    console.error('Error getting available time slots:', error);
    res.status(500).json({ error: 'Failed to get available time slots' });
  }
}; 
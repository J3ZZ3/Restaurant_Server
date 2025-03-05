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
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Validate against restaurant hours
    const requestedDate = new Date(date);
    const dayName = days[requestedDate.getDay()];
    const dayHours = restaurant.openingHours[dayName];

    if (!dayHours || !dayHours.open || !dayHours.close) {
      return res.status(400).json({ error: 'Restaurant is closed on this day' });
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

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[requestedDate.getDay()];

    // Get opening hours for that day
    const dayHours = restaurant.openingHours[dayName];
    if (!dayHours || !dayHours.open || !dayHours.close) {
      return res.status(200).json({ 
        timeSlots: [],
        message: 'Restaurant is closed on this day'
      });
    }

    // Parse opening and closing hours
    const [openHour, openMinute = '00'] = dayHours.open.split(':');
    const [closeHour, closeMinute = '00'] = dayHours.close.split(':');

    // Generate time slots
    const timeSlots = [];
    const startTime = new Date(requestedDate);
    startTime.setHours(parseInt(openHour), parseInt(openMinute), 0, 0);
    
    const endTime = new Date(requestedDate);
    endTime.setHours(parseInt(closeHour), parseInt(closeMinute), 0, 0);

    // Get existing reservations for the day
    const existingReservations = await Reservation.find({
      restaurantId,
      date: {
        $gte: new Date(requestedDate.setHours(0, 0, 0)),
        $lt: new Date(requestedDate.setHours(23, 59, 59))
      }
    });

    // Generate slots in 30-minute intervals
    const currentTime = new Date(startTime);
    while (currentTime < endTime) {
      // Format time as "h:mm A" (e.g., "1:30 PM")
      const hours = currentTime.getHours();
      const minutes = currentTime.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes.toString().padStart(2, '0');
      const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;

      // Check reservations for this time slot
      const reservationsInSlot = existingReservations.filter(reservation => 
        reservation.timeSlot === timeString
      ).length;

      // Calculate availability
      const availableCapacity = restaurant.maxGroupSize - (reservationsInSlot * 4);
      const isAvailable = availableCapacity >= 4; // Minimum party size of 4

      timeSlots.push({
        time: timeString,
        available: isAvailable,
        remainingCapacity: Math.max(0, availableCapacity)
      });

      // Add 30 minutes
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    res.status(200).json({ 
      timeSlots,
      restaurantHours: {
        open: dayHours.open,
        close: dayHours.close
      }
    });

  } catch (error) {
    console.error('Error getting available time slots:', error);
    res.status(500).json({ error: 'Failed to get available time slots' });
  }
}; 
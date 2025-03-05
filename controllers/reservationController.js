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
    // Validate restaurant exists and get its details
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Validate against restaurant hours
    const requestedDate = new Date(date);
    const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const dayHours = restaurant.openingHours[dayName];

    if (!dayHours || !dayHours.open || !dayHours.close) {
      return res.status(400).json({ error: 'Restaurant is closed on this day' });
    }

    // Parse the requested time slot
    const requestedTime = new Date(`${date} ${timeSlot}`);
    const [openHour] = dayHours.open.split(':').map(Number);
    const [closeHour] = dayHours.close.split(':').map(Number);

    // Validate time is within opening hours
    const hour = requestedTime.getHours();
    if (hour < openHour || hour >= closeHour) {
      return res.status(400).json({ 
        error: 'Selected time is outside restaurant operating hours' 
      });
    }

    // Check if the time slot is available
    const existingReservations = await Reservation.find({
      restaurantId,
      date: {
        $gte: new Date(requestedDate.setHours(0, 0, 0)),
        $lt: new Date(requestedDate.setHours(23, 59, 59))
      },
      timeSlot
    });

    const totalGuests = existingReservations.reduce((sum, res) => sum + res.guests, 0) + guests;
    if (totalGuests > restaurant.maxGroupSize) {
      return res.status(400).json({ 
        error: 'Selected time slot is fully booked' 
      });
    }

    // Create reservation if all validations pass
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

// Add a new function to get available time slots
exports.getAvailableTimeSlots = async (req, res) => {
  try {
    const { restaurantId, date } = req.params;
    const requestedDate = new Date(date);
    
    // Get restaurant details including opening hours
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = requestedDate.getDay();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[dayOfWeek];

    // Get opening hours for that day
    const dayHours = restaurant.openingHours[dayName];
    if (!dayHours || !dayHours.open || !dayHours.close) {
      return res.status(200).json({ 
        timeSlots: [],
        message: 'Restaurant is closed on this day'
      });
    }

    // Convert opening hours to 24-hour format
    const [openHour, openMinute] = dayHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = dayHours.close.split(':').map(Number);

    // Generate time slots every 30 minutes
    const timeSlots = [];
    let currentSlot = new Date(requestedDate);
    currentSlot.setHours(openHour, openMinute, 0);
    const closeTime = new Date(requestedDate);
    closeTime.setHours(closeHour, closeMinute, 0);

    // Get existing reservations for the day
    const existingReservations = await Reservation.find({
      restaurantId,
      date: {
        $gte: new Date(requestedDate.setHours(0, 0, 0)),
        $lt: new Date(requestedDate.setHours(23, 59, 59))
      }
    });

    while (currentSlot < closeTime) {
      const timeString = currentSlot.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true 
      });

      // Check if slot is already booked
      const reservationsInSlot = existingReservations.filter(reservation => 
        reservation.timeSlot === timeString
      ).length;

      // Assuming each time slot can have multiple reservations up to restaurant's maxGroupSize
      const isAvailable = reservationsInSlot < Math.floor(restaurant.maxGroupSize / 4);

      timeSlots.push({
        time: timeString,
        available: isAvailable
      });

      // Increment by 30 minutes
      currentSlot.setMinutes(currentSlot.getMinutes() + 30);
    }

    res.status(200).json({ timeSlots });
  } catch (error) {
    console.error('Error getting available time slots:', error);
    res.status(500).json({ error: 'Failed to get available time slots' });
  }
}; 
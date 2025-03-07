const Reservation = require('../models/reservationModel');
const Restaurant = require('../models/restaurantModel');
const io = require('../server');

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
  try {
    console.log('Received reservation request:', req.body);
    console.log('User from auth:', req.user);

    const { 
      restaurantId, 
      date, 
      timeSlot,
      time,
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

    // Use timeSlot or time
    const finalTimeSlot = timeSlot || time;

    // Validate required fields
    if (!restaurantId || !date || !finalTimeSlot || !guests || !name || !email || !phone) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { restaurantId, date, timeSlot: finalTimeSlot, guests, name, email, phone }
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Create the reservation
    const reservation = new Reservation({
      userId: req.user._id,
      restaurantId,
      date: new Date(date),
      timeSlot: finalTimeSlot,
      guests: parseInt(guests),
      name,
      email,
      phone,
      occasion: occasion || 'Regular Dining',
      specialRequests: specialRequests || '',
      seatingPreference: seatingPreference?.toLowerCase() || 'indoor',
      dietaryRestrictions: dietaryRestrictions || '',
      tablePreference: tablePreference || 'No Preference',
      status: 'pending',
      paymentStatus: 'pending'
    });

    await reservation.save();
    
    // Emit event for real-time updates
    io.emit('reservationCreated', reservation);

    console.log('Reservation created:', reservation);

    res.status(201).json({
      message: 'Reservation created successfully',
      reservation
    });

  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ 
      error: 'Failed to create reservation',
      details: error.message
    });
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

    // Emit event for real-time updates
    io.emit('reservationUpdated', reservation);

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

    // Emit event for real-time updates
    io.emit('reservationDeleted', reservation);

    res.status(200).json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get available time slots
exports.getAvailableTimeSlots = async (req, res) => {
  try {
    const { restaurantId, date } = req.params;
    
    // Parse the date correctly
    const requestedDate = new Date(date);
    
    // Validate the date
    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format. Please use YYYY-MM-DD',
        providedDate: date 
      });
    }

    // Get the day name (lowercase)
    const dayName = days[requestedDate.getDay()];

    // Debug logging
    console.log({
      requestedDate,
      dayName,
      dateString: requestedDate.toISOString(),
      dayNumber: requestedDate.getDay()
    });

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const dayHours = restaurant.openingHours[dayName];
    
    // Debug logging for opening hours
    console.log({
      dayHours,
      allHours: restaurant.openingHours,
      requestedDay: dayName
    });

    if (!dayHours || !dayHours.open || !dayHours.close) {
      return res.status(400).json({ 
        error: `Restaurant is closed on ${dayName}`,
        debug: {
          requestedDate: requestedDate.toISOString(),
          dayName,
          openingHours: restaurant.openingHours[dayName],
          allOpeningHours: restaurant.openingHours
        }
      });
    }

    // Generate available time slots
    const availableSlots = generateTimeSlots(dayHours.open, dayHours.close);

    // Get existing reservations for the date
    const existingReservations = await Reservation.find({
      restaurantId,
      date: {
        $gte: new Date(requestedDate.setHours(0, 0, 0, 0)),
        $lt: new Date(requestedDate.setHours(23, 59, 59, 999))
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
      date: requestedDate.toISOString(),
      dayName,
      openingHours: dayHours,
      availableSlots
    });

  } catch (error) {
    console.error('Get available time slots error:', error);
    res.status(500).json({ 
      error: 'Failed to get available time slots',
      details: error.message,
      debug: {
        restaurantId: req.params.restaurantId,
        date: req.params.date
      }
    });
  }
}; 
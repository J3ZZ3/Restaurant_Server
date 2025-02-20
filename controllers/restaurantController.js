const Restaurant = require('../models/restaurantModel');

// Add a new restaurant
exports.addRestaurant = async (req, res) => {
  const { 
    name, 
    location, 
    cuisine, 
    description, 
    contact, 
    pricing,
    openingHours,
    seatingOptions,
    maxGroupSize,
    reservationSlots 
  } = req.body;

  try {
    // Validate pricing data
    if (!pricing || !pricing.basePrice) {
      return res.status(400).json({ error: 'Base price per guest is required' });
    }

    const restaurant = await Restaurant.create({ 
      name, 
      location, 
      cuisine, 
      ownerId: req.user.id, 
      description, 
      contact,
      pricing: {
        basePrice: pricing.basePrice,
        specialOccasionFee: pricing.specialOccasionFee || 0,
        weekendSurcharge: pricing.weekendSurcharge || 0,
        holidaySurcharge: pricing.holidaySurcharge || 0,
        minimumSpend: pricing.minimumSpend || 0,
        depositAmount: pricing.depositAmount || 0,
        cancellationFee: pricing.cancellationFee || 0
      },
      openingHours,
      seatingOptions,
      maxGroupSize,
      reservationSlots
    });

    res.status(201).json({ 
      message: 'Restaurant added successfully', 
      restaurant 
    });
  } catch (error) {
    console.error('Add restaurant error:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get all restaurants
exports.getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.status(200).json(restaurants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get restaurant by ID
exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    res.status(200).json(restaurant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update restaurant
exports.updateRestaurant = async (req, res) => {
  try {
    const { 
      name, 
      location, 
      cuisine, 
      description, 
      contact, 
      pricing,
      openingHours,
      seatingOptions,
      maxGroupSize,
      reservationSlots 
    } = req.body;

    // Ensure only restaurant owner can update
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      ownerId: req.user.id
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found or unauthorized' });
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      {
        name,
        location,
        cuisine,
        description,
        contact,
        pricing,
        openingHours,
        seatingOptions,
        maxGroupSize,
        reservationSlots,
        updatedAt: Date.now()
      },
      { new: true }
    );

    res.status(200).json({ 
      message: 'Restaurant updated successfully', 
      restaurant: updatedRestaurant 
    });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete restaurant
exports.deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    res.status(200).json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 
const Restaurant = require('../models/restaurantModel');

// Add a new restaurant
exports.addRestaurant = async (req, res) => {
  const { name, location, cuisine, description, contact, reservationSlots } = req.body;
  try {
    const restaurant = await Restaurant.create({ name, location, cuisine, ownerId: req.user.id, description, contact, reservationSlots });
    res.status(201).json({ message: 'Restaurant added successfully', restaurant });
  } catch (error) {
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
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    res.status(200).json({ message: 'Restaurant updated successfully', restaurant });
  } catch (error) {
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
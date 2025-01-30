<<<<<<< HEAD
const Restaurant = require("../models/restaurantModel");
const { io } = require("../server");

// Add a new restaurant
exports.addRestaurant = async (req, res) => {
  const { name, location, cuisine, description, contact, reservationSlots } =
    req.body;
  try {
    const restaurant = await Restaurant.create({
      name,
      location,
      cuisine,
      ownerId: req.user.id,
      description,
      contact,
      reservationSlots,
    });

    // Emit a 'newRestaurant' event to all connected clients
    io.emit("newRestaurant", restaurant);

    res.status(201).json({
      message: "Restaurant added successfully",
      restaurant: restaurant,
    });
=======
const Restaurant = require('../models/restaurantModel');

// Add a new restaurant
exports.addRestaurant = async (req, res) => {
  const { name, location, cuisine, description, contact, reservationSlots } = req.body;
  try {
    const restaurant = await Restaurant.create({ name, location, cuisine, ownerId: req.user.id, description, contact, reservationSlots });
    res.status(201).json({ message: 'Restaurant added successfully', restaurant });
>>>>>>> origin/second-phase
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
<<<<<<< HEAD
    if (!restaurant)
      return res.status(404).json({ error: "Restaurant not found" });
=======
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
>>>>>>> origin/second-phase
    res.status(200).json(restaurant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update restaurant
exports.updateRestaurant = async (req, res) => {
  try {
<<<<<<< HEAD
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    io.emit("updateRestaurant", restaurant);

    if (!restaurant)
      return res.status(404).json({ error: "Restaurant not found" });
    res
      .status(200)
      .json({ message: "Restaurant updated successfully", restaurant });
=======
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    res.status(200).json({ message: 'Restaurant updated successfully', restaurant });
>>>>>>> origin/second-phase
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete restaurant
exports.deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
<<<<<<< HEAD

    io.emit("deleteRestaurant", id);

    if (!restaurant)
      return res.status(404).json({ error: "Restaurant not found" });
    res.status(200).json({ message: "Restaurant deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
=======
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    res.status(200).json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 
>>>>>>> origin/second-phase

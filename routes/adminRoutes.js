const express = require("express");
const isAdmin = require("../middleware/authMiddleware");
const Restaurant = require("../models/restaurantModel"); // Assuming you have a Restaurant model
const Reservation = require("../models/reservationModel"); // Assuming you have a Reservation model

const router = express.Router();

// Create a new restaurant (admin only)
router.post("/restaurants", isAdmin, async (req, res) => {
  const { name, cuisine, location, openingHours } = req.body;

  try {
    const newRestaurant = await Restaurant.create({
      name,
      cuisine,
      location,
      openingHours,
    });
    res
      .status(201)
      .json({
        message: "Restaurant created successfully",
        restaurant: newRestaurant,
      });
  } catch (error) {
    res.status(500).json({ error: "Failed to create restaurant" });
  }
});

// Get all reservations (admin only)
router.get("/reservations", isAdmin, async (req, res) => {
  try {
    const reservations = await Reservation.find();
    res.status(200).json(reservations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reservations" });
  }
});

// Update restaurant details (admin only)
router.put("/restaurants/:id", isAdmin, async (req, res) => {
  const { name, cuisine, location, openingHours } = req.body;

  try {
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      {
        name,
        cuisine,
        location,
        openingHours,
      },
      { new: true }
    );

    if (!updatedRestaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    res.status(200).json(updatedRestaurant);
  } catch (error) {
    res.status(500).json({ error: "Failed to update restaurant" });
  }
});

// Delete restaurant (admin only)
router.delete("/restaurants/:id", isAdmin, async (req, res) => {
  try {
    const deletedRestaurant = await Restaurant.findByIdAndDelete(req.params.id);

    if (!deletedRestaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    res.status(200).json({ message: "Restaurant deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete restaurant" });
  }
});

module.exports = router;

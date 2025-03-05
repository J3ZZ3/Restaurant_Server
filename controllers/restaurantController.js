const Restaurant = require('../models/restaurantModel');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinaryConfig');

// Configure Multer storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'restaurant_images', // The folder in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'bmp', 'tiff', 'webp'], // Include all desired formats
  },
});

const upload = multer({ storage: storage });

// Add a new restaurant
exports.addRestaurant = [
  upload.single('image'), // Use multer to handle the image upload
  async (req, res) => {
    try {
      // Parse the JSON data if it's sent as a string
      const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      
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
        menu
      } = data;

      // Validate required fields
      if (!name || !location || !cuisine) {
        return res.status(400).json({ 
          error: 'Name, location, and cuisine are required fields' 
        });
      }

      // Validate pricing data
      if (!pricing || !pricing.basePrice) {
        return res.status(400).json({ 
          error: 'Base price per guest is required' 
        });
      }

      // Validate opening hours
      const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const hasValidHours = requiredDays.every(day => 
        openingHours[day] && 
        openingHours[day].open && 
        openingHours[day].close &&
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(openingHours[day].open) &&
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(openingHours[day].close)
      );

      if (!hasValidHours) {
        return res.status(400).json({ 
          error: 'Valid opening hours are required for all days of the week' 
        });
      }

      const newRestaurant = new Restaurant({
        name,
        location,
        cuisine,
        description,
        contact,
        pricing,
        openingHours,
        seatingOptions: seatingOptions || { indoor: true, outdoor: false },
        maxGroupSize: maxGroupSize || 20,
        imageUrl: req.file ? req.file.path : null,
        menu: menu || [],
        ownerId: req.user._id // Automatically set ownerId from authenticated user
      });

      await newRestaurant.save();
      res.status(201).json({ 
        message: 'Restaurant added successfully', 
        restaurant: newRestaurant 
      });
    } catch (error) {
      console.error('Add restaurant error:', error);
      res.status(500).json({ 
        error: error.message,
        details: 'Failed to add restaurant'
      });
    }
  }
];

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
    res.status(200).json({
      ...restaurant.toObject(),
      imageUrl: restaurant.imageUrl,
      rating: restaurant.rating,
      menu: restaurant.menu,
    });
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
      reservationSlots,
      imageUrl,
      rating,
      menu
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
        imageUrl,
        rating: rating || 0,
        menu: menu || [],
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
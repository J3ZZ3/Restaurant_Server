const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  cuisine: { type: String, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String },
  contact: { type: String },
  imageUrl: { type: String },
  rating: { type: Number, default: 0 },
  menu: [{ 
    item: { type: String, required: true }, // Item name
    price: { type: Number, required: true } // Item price
  }],
  pricing: {
    basePrice: { type: Number, required: true }, // Base price per guest
    specialOccasionFee: { type: Number, default: 0 }, // Additional fee for special occasions
    weekendSurcharge: { type: Number, default: 0 }, // Additional fee for weekends
    holidaySurcharge: { type: Number, default: 0 }, // Additional fee for holidays
    minimumSpend: { type: Number, default: 0 }, // Minimum spend required
    depositAmount: { type: Number, default: 0 }, // Required deposit amount
    cancellationFee: { type: Number, default: 0 } // Fee for cancellation
  },
  openingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  seatingOptions: {
    indoor: { type: Boolean, default: true },
    outdoor: { type: Boolean, default: false }
  },
  maxGroupSize: { type: Number, default: 20 },
  reservationSlots: [{
    date: { type: Date },
    slots: [{ 
      time: String,
      available: { type: Boolean, default: true },
      maxGuests: Number
    }]
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant; 
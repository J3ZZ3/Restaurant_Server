const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  date: { type: Date, required: true },
  timeSlot: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^(1[0-2]|0?[1-9]):[0-5][0-9] (AM|PM)$/.test(v);
      },
      message: props => `${props.value} is not a valid time slot format! Use format: "HH:MM AM/PM"`
    }
  },
  guests: { type: Number, required: true, min: 1, max: 20 },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  occasion: { type: String },
  specialRequests: { type: String },
  seatingPreference: { 
    type: String, 
    enum: ['indoor', 'outdoor', 'no preference'],
    default: 'indoor'
  },
  dietaryRestrictions: { type: String },
  tablePreference: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled'], 
    default: 'pending' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'], 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation; 
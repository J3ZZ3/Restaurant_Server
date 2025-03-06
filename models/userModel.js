const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'restaurant_owner'], default: 'user' },
  phoneNumber: { type: String },
  address: { type: String },
  imageUrl: { type: String, default: 'https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/default-avatar.png' },
  dateOfBirth: { type: Date },
  preferences: {
    dietaryRestrictions: [String],
    favoritesCuisine: [String],
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

module.exports = User; 
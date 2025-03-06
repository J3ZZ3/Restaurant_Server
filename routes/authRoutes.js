const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinaryConfig');
const upload = multer({ storage: multer.memoryStorage() });
const { register, login, getUserProfile, updateUserProfile, updateProfileImage } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');

// User registration and login routes
router.post('/register', register);
router.post('/login', login); // Regular login route

// Admin login route
router.post('/admin/login', login); // Admin login route

// Protected routes
router.get('/me', authMiddleware, getUserProfile);
router.put('/me', authMiddleware, updateUserProfile);

// Add these new routes
router.put('/me/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/me/email', authMiddleware, async (req, res) => {
  try {
    const { newEmail } = req.body;
    
    // Check if email is already in use
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const user = await User.findById(req.user._id);
    user.email = newEmail;
    await user.save();

    res.json({ message: 'Email updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/me', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/me/profile-image', 
  authMiddleware, 
  upload.single('image'), 
  updateProfileImage
);

module.exports = router;

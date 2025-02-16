const { auth } = require('../config/firebase');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register user
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'An account with this email already exists. Please use a different email or login.' 
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the user
    const userRecord = await User.create({ 
      name, 
      email, 
      password: hashedPassword, 
      role: role || 'user' // Default to 'user' if role not specified
    });

    // Generate token for the new user
    const token = jwt.sign(
      { id: userRecord._id, role: userRecord.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success response with token and role
    res.status(201).json({ 
      message: 'User registered successfully',
      token,
      role: userRecord.role
    });
  } catch (error) {
    console.error('Registration error:', error);
    // Handle different types of errors
    if (error.code === 11000) {
      res.status(400).json({ 
        error: 'An account with this email already exists. Please use a different email or login.'
      });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
};

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id.toString(),
        role: user.role,
        email: user.email 
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log the token payload for debugging
    console.log('Token payload:', { id: user._id.toString(), role: user.role });
    
    // Return success response
    res.status(200).json({
      message: 'Login successful',
      token,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Get logged-in user profile
exports.getUserProfile = async (req, res) => {
  try {
    console.log('Getting profile for user:', req.user._id);
    
    const user = await User.findById(req.user._id)
      .select('-password')
      .lean();
      
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return all user fields except password
    res.status(200).json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Update logged-in user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phoneNumber, 
      address, 
      preferences 
    } = req.body;

    // Create update object with all fields
    const updateData = {
      name,
      email,
      phoneNumber,
      address,
      preferences,
      updatedAt: Date.now()
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    const user = await User.findByIdAndUpdate(
      req.user.id, 
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

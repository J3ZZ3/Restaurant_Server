<<<<<<< HEAD
const { auth } = require("../config/firebase");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
=======
const { auth } = require('../config/firebase');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
>>>>>>> origin/second-phase

// Register user
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
<<<<<<< HEAD
    const userRecord = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });
    res
      .status(201)
      .json({ message: "User registered successfully", user: userRecord });
=======
    const userRecord = await User.create({ name, email, password: hashedPassword, role });
    res.status(201).json({ message: 'User registered successfully', user: userRecord });
>>>>>>> origin/second-phase
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
<<<<<<< HEAD
      return res.status(400).json({ error: "Invalid credentials" });
=======
      return res.status(400).json({ error: 'Invalid credentials' });
>>>>>>> origin/second-phase
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
<<<<<<< HEAD
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({ message: "Login successful", token }); // Return the token
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
};

const isAdmin = User && User.role === "admin";
if (isAdmin) {
  // Generate JWT token for admin user
  const token = jwt.sign(
    { id: User._id, role: User.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
  return res.status(200).json({ message: "Admin login successful", token });
}

// Get logged-in user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
=======
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check if the user is an admin
    if (req.path.includes('/admin') && user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // Return the token and user role
    res.status(200).json({ message: 'Login successful', token, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

// Get logged-in user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
>>>>>>> origin/second-phase
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update logged-in user profile
exports.updateUserProfile = async (req, res) => {
  const { name, email } = req.body;
  try {
<<<<<<< HEAD
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true }
    ).select("-password");
=======
    const user = await User.findByIdAndUpdate(req.user.id, { name, email }, { new: true }).select('-password');
>>>>>>> origin/second-phase
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

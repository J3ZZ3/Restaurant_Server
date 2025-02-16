const express = require('express');
const router = express.Router();
const { submitFeedback, getAllFeedback, updateFeedbackStatus } = require('../controllers/feedbackController');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  next();
};

// Submit feedback (any authenticated user)
router.post('/', authMiddleware, submitFeedback);

// Get all feedback (admin only)
router.get('/', authMiddleware, isAdmin, getAllFeedback);

// Update feedback status (admin only)
router.put('/:id', authMiddleware, isAdmin, updateFeedbackStatus);

module.exports = router; 
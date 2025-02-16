const Feedback = require('../models/feedbackModel');

// Submit feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { message, rating, category } = req.body;
    const feedback = await Feedback.create({
      userId: req.user.id,
      message,
      rating,
      category
    });
    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all feedback (admin only)
exports.getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json(feedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update feedback status (admin only)
exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    res.status(200).json(feedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 
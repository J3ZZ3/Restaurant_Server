const express = require('express');
const router = express.Router();
const Report = require('../models/reportModel');
const authMiddleware = require('../middleware/authMiddleware');

// Create a new report
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { issueType, description } = req.body;
    
    const report = new Report({
      userId: req.user._id,
      issueType,
      description
    });

    await report.save();
    res.status(201).json(report);
  } catch (error) {
    console.error('Report creation error:', error);
    res.status(500).json({ error: 'Error creating report' });
  }
});

// Get user's reports
router.get('/my-reports', authMiddleware, async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user._id });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching reports' });
  }
});

module.exports = router; 
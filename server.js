require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const userReservationRoutes = require('./routes/userReservationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const connectDB = require('./config/mongo');
const bodyParser = require('body-parser');
const feedbackRoutes = require('./routes/feedbackRoutes');
const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());


// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/user/reservations', userReservationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/feedback', feedbackRoutes);

// Add these routes before your other route definitions
app.get('/payment/success', (req, res) => {
    res.send('Payment successful! You can close this window.');
});

app.get('/payment/cancel', (req, res) => {
    res.send('Payment cancelled! You can close this window.');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


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
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const stripePaymentRoutes = require('./routes/stripePaymentRoutes');
const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.post('/payment-sheet', async (req, res) => {
  const { amount } = req.body; // Ensure amount is received from the request

  if (!amount) {
    return res.status(400).json({ error: 'Amount is required' });
  }

  try {
    const customer = await stripe.customers.create();
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2025-01-27.acacia' }
    );
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: process.env.STRIPE_SECRET_KEY,
    });
  } catch (error) {
    console.error('Error creating payment sheet:', error);
    res.status(500).json({ error: error.message });
  }
});

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/user/reservations', userReservationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stripe', stripePaymentRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


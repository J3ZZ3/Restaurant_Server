<<<<<<< HEAD
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const connectDB = require("./config/mongo");
const dotenv = require("dotenv");
const adminRoutes = require("./routes/adminRoutes");
const app = express();
const http = require("http");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

//real time communication

const server = http.createServer(app); // Use the server to enable socket.io
const io = socketIo(server); // Initialize Socket.io

// Handle socket connection
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});
=======
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const userReservationRoutes = require('./routes/userReservationRoutes');
const connectDB = require('./config/mongo');

const app = express();
app.use(cors());
app.use(express.json());
>>>>>>> origin/second-phase

// Connect to MongoDB
connectDB();

// Routes
<<<<<<< HEAD
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
=======
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/user/reservations', userReservationRoutes);
>>>>>>> origin/second-phase

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
<<<<<<< HEAD

module.exports = { server, io };
=======
>>>>>>> origin/second-phase

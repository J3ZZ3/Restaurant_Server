const express = require('express');
const router = express.Router();
const { addRestaurant, getAllRestaurants, getRestaurantById, updateRestaurant, deleteRestaurant } = require('../controllers/restaurantController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, addRestaurant);
router.get('/', getAllRestaurants);
router.get('/:id', getRestaurantById);
router.put('/:id', authMiddleware, updateRestaurant);
router.delete('/:id', authMiddleware, deleteRestaurant);

module.exports = router; 
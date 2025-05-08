const express = require('express');
const {
    getUsers,
    getUser,
    updateProfile,
    changePassword
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Apply protection middleware to all routes
router.use(protect);

// Routes for all authenticated users
router.put('/profile', updateProfile);
router.put('/changepassword', changePassword);

// Admin-only routes
router.get('/', authorize('admin'), getUsers);
router.get('/:id', authorize('admin'), getUser);

module.exports = router;
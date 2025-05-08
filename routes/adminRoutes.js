const express = require('express');
const {
    getPendingApprovals,
    approvePharmacist,
    rejectPharmacist,
    getStats,
    deleteUser
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Apply protection middleware to all routes
router.use(protect);
router.use(authorize('admin'));

// Admin routes
router.get('/approvals', getPendingApprovals);
router.put('/approvals/:id/approve', approvePharmacist);
router.put('/approvals/:id/reject', rejectPharmacist);
router.get('/stats', getStats);
router.delete('/users/:id', deleteUser);

module.exports = router;
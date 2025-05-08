const express = require('express');
const {
    completeProfile,
    getPharmacies,
    getPharmacy,
    updatePharmacy,
    updateCertificate,
    getMyPharmacy
} = require('../controllers/pharmacieController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadCertificate } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public routes
router.get('/', getPharmacies);
router.get('/:id', getPharmacy);

// Protected routes
router.use(protect);

// Pharmacist routes
router.post('/', authorize('pharmacist'), (req, res, next) => {
    uploadCertificate(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        next();
    });
}, completeProfile);

router.put('/:id', authorize('pharmacist', 'admin'), updatePharmacy);
router.put('/:id/certificate', authorize('pharmacist', 'admin'), (req, res, next) => {
    uploadCertificate(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        next();
    });
}, updateCertificate);

router.get('/me/profile', authorize('pharmacist'), getMyPharmacy);

module.exports = router;
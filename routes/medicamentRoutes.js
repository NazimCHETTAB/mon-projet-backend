const express = require('express');
const {
    createMedicament,
    getMedicaments,
    getMedicament,
    updateMedicament,
    updateMedicamentImage,
    deleteMedicament,
    searchMedicaments
} = require('../controllers/medicamentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize, approvedPharmacist } = require('../middleware/roleMiddleware');
const { uploadMedicamentImage } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public routes
router.get('/', getMedicaments);
router.get('/search', searchMedicaments);
router.get('/:id', getMedicament);

// Protected routes
router.use(protect);

// Add medicament - only for approved pharmacists
router.post('/', approvedPharmacist, (req, res, next) => {
    uploadMedicamentImage(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        next();
    });
}, createMedicament);

// Update medicament details
router.put('/:id', authorize('pharmacist', 'admin'), updateMedicament);

// Update medicament image
router.put('/:id/image', authorize('pharmacist', 'admin'), (req, res, next) => {
    uploadMedicamentImage(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        next();
    });
}, updateMedicamentImage);

// Delete medicament
router.delete('/:id', authorize('pharmacist', 'admin'), deleteMedicament);

module.exports = router;
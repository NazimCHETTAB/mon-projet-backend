const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    getMedicaments,
    ajouterMedicament,
    modifierMedicament,
    supprimerMedicament
} = require('../controllers/medicamentController');

// Routes publiques
router.get('/', getMedicaments);

// Routes protégées
router.post('/', authMiddleware, ajouterMedicament);
router.put('/:id', authMiddleware, modifierMedicament);
router.delete('/:id', authMiddleware, supprimerMedicament);

module.exports = router;
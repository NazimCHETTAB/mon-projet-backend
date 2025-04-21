const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getPharmacies, ajouterPharmacie } = require('../controllers/pharmacieController');

// Routes publiques
router.get('/', getPharmacies);

// Routes protégées - Idéalement ajouter un middleware adminOnly pour l'ajout
router.post('/', authMiddleware, ajouterPharmacie);

module.exports = router;
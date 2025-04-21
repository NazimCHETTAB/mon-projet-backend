const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    inscrireUtilisateur,
    connecterUtilisateur,
    validerUtilisateur,
    getUtilisateurs
} = require('../controllers/utilisateurController');

// Routes publiques
router.post('/inscription', inscrireUtilisateur);
router.post('/connexion', connecterUtilisateur);

// Routes protégées
router.put('/valider/:id', authMiddleware, validerUtilisateur); // Idéalement ajouter un middleware adminOnly
router.get('/', authMiddleware, getUtilisateurs); // Idéalement ajouter un middleware adminOnly

module.exports = router;
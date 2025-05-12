const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 1. Choix du rôle
router.get('/choisir-role', authController.choisirRole);

// 2. Inscriptions
router.post('/inscription/pharmacien', authController.inscrirePharmacien);
router.post('/inscription/vendeur', authController.inscrireVendeur);
// Dans authRoutes.js
router.post('/inscription/admin', authController.inscrireAdmin);

// 3. Connexion
router.post('/connexion', authController.connexion);

// 4. Mot de passe oublié
router.post('/mot-de-passe-oublie', authController.motDePasseOublie);
router.get('/reset-password/:token', authController.verifierToken);
router.post('/reinitialiser-mot-de-passe', authController.reinitialiserMotDePasse);

// Route de déconnexion (ne nécessite pas d'authentification)
router.post('/deconnexion', authController.deconnexion);

module.exports = router;

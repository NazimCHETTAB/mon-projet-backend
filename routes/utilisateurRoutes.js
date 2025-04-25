const express = require('express');
const router = express.Router();
const controller = require('../controllers/utilisateurController');
const { authentifierUtilisateur, verifierRole } = require('../middlewares/authMiddlewares');

// Routes publiques
router.get('/:id', controller.obtenirProfilAutre);

// Route de signalement accessible sans authentification
router.post('/signalement', controller.signalerMessage);

// Routes protégées (authentification requise)
router.use(authentifierUtilisateur);

// Routes utilisateur standard
router.get('/profil/mon-profil', controller.obtenirProfil);
router.put('/profil', controller.mettreAJourUtilisateur);
router.delete('/:id', controller.supprimerUtilisateur);

// Routes admin (vérification du rôle Admin)
router.get('/admin/pharmaciens/demandes', verifierRole(['Admin']), (req, res, next) => {
    controller.gestionAdmin.obtenirDemandesPharmaciens(req, res).catch(next);
});

router.put('/admin/pharmaciens/:id/valider', verifierRole(['Admin']), (req, res, next) => {
    controller.gestionAdmin.validerPharmacien(req, res).catch(next);
});

// Routes admin pour les notifications et signalements
router.get('/admin/notifications', verifierRole(['Admin']), (req, res, next) => {
    controller.gestionAdmin.obtenirNotifications(req, res).catch(next);
});

router.put('/admin/notifications/:id/lue', verifierRole(['Admin']), (req, res, next) => {
    controller.gestionAdmin.marquerNotificationLue(req, res).catch(next);
});



module.exports = router;
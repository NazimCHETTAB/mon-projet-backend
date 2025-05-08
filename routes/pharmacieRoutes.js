const express = require('express');
const {
<<<<<<< HEAD
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
=======
  ajouterPharmacie,
  getAllPharmacies,
  getPharmacieById,
  rechercherPharmacieParNom,
  modifierPharmacie,
  supprimerPharmacie,
  findNearbyPharmacies // Ajout de la nouvelle fonction
} = require('../controllers/pharmacieController');

// Modification ici - utiliser les bons noms de middlewares
const { authentifierUtilisateur, verifierRole } = require('../middlewares/authMiddlewares');

const router = express.Router();

// Ajouter une pharmacie (réservé aux administrateurs et aux pharmaciens)
// Utiliser les bons noms de middlewares
router.post('/ajouter', authentifierUtilisateur, verifierRole(['Admin', 'pharmacien']), ajouterPharmacie);

// Obtenir toutes les pharmacies
router.get('/', getAllPharmacies);

// Rechercher une pharmacie par son nom ou sa localisation
router.get('/recherche', rechercherPharmacieParNom);

// Nouvelle route: Trouver les pharmacies à proximité
router.get('/nearby', findNearbyPharmacies);

// Obtenir une pharmacie par son ID
router.get('/:id', getPharmacieById);

// Modifier une pharmacie (réservé aux administrateurs et aux pharmaciens)
router.put('/modifier/:id', authentifierUtilisateur, verifierRole(['Admin', 'pharmacien']), modifierPharmacie);

// Supprimer une pharmacie (réservé aux administrateurs et aux pharmaciens)
router.delete('/supprimer/:id', authentifierUtilisateur, verifierRole(['Admin', 'pharmacien']), supprimerPharmacie);

module.exports = router;
>>>>>>> bf15775c51ff21f57620fe8b157ed20f0f428711

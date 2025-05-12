const express = require('express');
const {
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

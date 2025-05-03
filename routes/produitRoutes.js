const express = require('express');
const router = express.Router();
const produitController = require('../controllers/produitController');
const { authentifierUtilisateur, verifierRole } = require('../middlewares/authMiddlewares');

// Ajouter un produit (réservé aux rôles spécifiques)
router.post(
  '/produits',
  authentifierUtilisateur,
  verifierRole(['Vendeur', 'Pharmacien', 'Admin']),
  produitController.ajouterProduit
);

// Modifier un produit
router.put(
  '/produits/:id',
  authentifierUtilisateur,
  verifierRole(['Vendeur', 'Pharmacien', 'Admin']),
  produitController.updateProduit
);

// Supprimer un produit
router.delete(
  '/produits/:id',
  authentifierUtilisateur,
  verifierRole(['Vendeur', 'Pharmacien', 'Admin']),
  produitController.deleteProduit
);

// Obtenir tous les produits (accessible à tous)
router.get('/produits', produitController.getAllProduits);

// Obtenir un produit par ID (accessible à tous)
router.get('/produits/:id', produitController.getProduitById);

// Nouvelles routes de recherche
// Recherche de produits par nom (accessible à tous)
router.get('/produits/search/nom', produitController.searchProduitsByName);



module.exports = router;




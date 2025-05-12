const Produit = require('../models/produit'); 
const Utilisateur = require('../models/utilisateur');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration du stockage des images
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = 'uploads/produits';
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Créer un nom de fichier unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'produit-' + uniqueSuffix + ext);
  }
});

// Filtre pour vérifier que le fichier est une image
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Veuillez télécharger uniquement une image.'), false);
  }
};

// Configuration du middleware de téléchargement
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5 Mo
  },
  fileFilter: fileFilter
});

// Ajouter un produit avec support de téléchargement d'image
exports.ajouterProduit = [
  upload.single('photo'),
  
  async (req, res) => {
    try {
      const { nom, description, prix } = req.body;
      const role = req.user.role;
      
      console.log("USER ID:", req.user.id);
      console.log("USER ROLE:", role);
      
      // Basic validations
      if (!['Pharmacien', 'Vendeur', 'Admin'].includes(role)) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(403).json({ message: "Accès refusé." });
      }
      
      if (!nom || !description || !prix) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis." });
      }
      
      // Get complete user data
      const utilisateur = await Utilisateur.findById(req.user.id);
      console.log("FULL USER DATA:", JSON.stringify(utilisateur));
      
      if (!utilisateur) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: "Utilisateur non trouvé." });
      }
      
      // Create custom description based on role
      let modifiedDescription = description;
      
      if (role === 'Pharmacien') {
        console.log("IS PHARMACIEN - SHOULD MODIFY DESC");
        modifiedDescription = `${description}\n\nPharmacie: ${utilisateur.nomPharmacie || 'Non spécifiée'}\nLocalisation: ${utilisateur.localisation || 'Non spécifiée'}\nTél: ${utilisateur.telephone || 'Non spécifié'}`;
      } else if (role === 'Vendeur') {
        console.log("IS VENDEUR - SHOULD MODIFY DESC");
        modifiedDescription = `${description}\n\nVendeur: ${utilisateur.username || 'Non spécifié'}\nTél: ${utilisateur.telephone || 'Non spécifié'}`;
      }
      
      console.log("ORIGINAL DESC:", description);
      console.log("MODIFIED DESC:", modifiedDescription);
      
      // Create product data
      let produitData = {
        nom: nom,
        prix: parseFloat(prix),
        description: modifiedDescription,
        vendeur: req.user.id
      };
      
      // Handle image
      if (req.file) {
        produitData.photo = `/uploads/produits/${req.file.filename}`;
      } else if (req.body.photo) {
        produitData.photo = req.body.photo;
      }
      
      console.log("FINAL PRODUCT DATA:", produitData);
      
      // Save product
      const produit = new Produit(produitData);
      const savedProduct = await produit.save();
      
      console.log("SAVED PRODUCT:", savedProduct);
      
      // Force update the description directly in the database to ensure it's saved correctly
      const finalProduct = await Produit.findByIdAndUpdate(
        savedProduct._id,
        { description: modifiedDescription },
        { new: true }
      );
      
      console.log("FINAL UPDATED PRODUCT:", finalProduct);
      
      res.status(201).json(finalProduct);
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      console.error('Erreur:', error);
      res.status(500).json({ 
        message: "Erreur lors de l'ajout du produit.", 
        error: error.message
      });
    }
  }
];
    

// Mettre à jour un produit avec support de téléchargement d'image
exports.updateProduit = [
  upload.single('photo'), // Middleware pour télécharger l'image
  
  async (req, res) => {
    try {
      const { id } = req.params;
      const { nom, description, prix } = req.body;
      
      // Vérifier si le produit existe
      const produit = await Produit.findById(id);
      if (!produit) {
        // Supprimer l'image téléchargée si elle existe
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ message: "Produit non trouvé." });
      }
      
      // Vérifier les autorisations
      if (produit.vendeur.toString() !== req.user.id && req.user.role !== 'Admin') {
        // Supprimer l'image téléchargée si elle existe
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier ce produit." });
      }
      
      // Rechercher l'utilisateur
      const utilisateur = await Utilisateur.findById(req.user.id);
      if (!utilisateur) {
        // Supprimer l'image téléchargée si elle existe
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ message: "Utilisateur non trouvé." });
      }
      
      // Personnaliser la description selon le rôle
      let modifiedDescription = description;
      const role = req.user.role;
      
      if (role === 'Pharmacien') {
        modifiedDescription = `${description}\n\nPharmacie: ${utilisateur.nomPharmacie || 'Non spécifiée'}\nTél: ${utilisateur.numeroTelephone || utilisateur.telephone || 'Non spécifié'}`;
      } else if (role === 'Vendeur') {
        modifiedDescription = `${description}\n\nVendeur: ${utilisateur.nom || 'Non spécifié'}\nTél: ${utilisateur.numeroTelephone || utilisateur.telephone || 'Non spécifié'}`;
      }
      
      // Préparer les données de mise à jour
      const updateData = { 
        nom, 
        description: modifiedDescription, 
        prix: parseFloat(prix)
      };
      
      // Gérer l'image
      if (req.file) {
        // Si une nouvelle image a été téléchargée
        
        // Supprimer l'ancienne image si elle existe et est un fichier réel (pas une URL externe)
        if (produit.photo && produit.photo.startsWith('/uploads/')) {
          const oldImagePath = path.join(__dirname, '..', produit.photo);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        
        // Mettre à jour le chemin de la nouvelle image
        updateData.photo = `/uploads/produits/${req.file.filename}`;
      } else if (req.body.photo !== undefined) {
        // Si une URL d'image a été fournie dans req.body
        updateData.photo = req.body.photo;
      }
      
      // Mettre à jour le produit
      const updatedProduit = await Produit.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );
      
      res.status(200).json(updatedProduit);
    } catch (error) {
      // Supprimer l'image en cas d'erreur
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      console.error('Erreur:', error);
      res.status(500).json({ 
        message: "Erreur lors de la mise à jour du produit.", 
        errorMessage: error.message,
        stack: error.stack 
      });
    }
  }
];

// Fonction pour supprimer un produit et son image associée
exports.deleteProduit = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si le produit existe
    const produit = await Produit.findById(id);
    if (!produit) {
      return res.status(404).json({ message: "Produit non trouvé." });
    }
    
    // Vérifier les autorisations
    if (produit.vendeur.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à supprimer ce produit." });
    }
    
    // Supprimer l'image si elle existe et est un fichier réel (pas une URL externe)
    if (produit.photo && produit.photo.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '..', produit.photo);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Supprimer le produit
    await Produit.findByIdAndDelete(id);
    
    res.status(200).json({ message: "Produit supprimé avec succès." });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      message: "Erreur lors de la suppression du produit.", 
      errorMessage: error.message,
      stack: error.stack 
    });
  }
};
exports.getAllProduits = async (req, res) => {
    try {
        // Récupérer les produits avec les infos du vendeur
        const produits = await Produit.find()
            .populate('vendeur', 'nom nomPharmacie role numeroTelephone telephone');
        
        res.status(200).json(produits);
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: "Erreur lors de la récupération des produits." });
    }
};

exports.getProduitById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Récupérer le produit avec les infos du vendeur
        const produit = await Produit.findById(id)
            .populate('vendeur', 'nom nomPharmacie role numeroTelephone telephone');
        
        if (!produit) {
            return res.status(404).json({ message: "Produit non trouvé." });
        }
        
        // Utiliser la méthode personnalisée du modèle pour obtenir les infos du vendeur
        const produitAvecInfos = await produit.getProduitAvecInfosVendeur();
        
        res.status(200).json(produitAvecInfos);
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: "Erreur lors de la récupération du produit." });
    }
};
exports.searchProduitsByName = async (req, res) => {
    try {
        const { nom, exactMatch, caseSensitive, limit, skip, avecInfosVendeur } = req.query;
        
        // Vérifier si le paramètre nom est fourni
        if (!nom) {
            return res.status(400).json({ message: "Le paramètre 'nom' est requis pour la recherche." });
        }
        
        // Construire la requête en fonction des options
        let query = {};
        
        // Convertir les paramètres string en booléens/nombres
        const parsedOptions = {
            exactMatch: exactMatch === 'true',
            caseSensitive: caseSensitive === 'true',
            limit: limit ? parseInt(limit) : 10,
            skip: skip ? parseInt(skip) : 0,
            avecInfosVendeur: avecInfosVendeur === 'true'
        };
        
        if (parsedOptions.exactMatch) {
            // Correspondance exacte
            query.nom = parsedOptions.caseSensitive ? nom : new RegExp(`^${nom}$`, 'i');
        } else {
            // Correspondance partielle (contient)
            query.nom = parsedOptions.caseSensitive 
                ? { $regex: nom }
                : { $regex: nom, $options: 'i' };
        }
        
        // Exécuter la requête
        let produits = await Produit.find(query)
            .sort({ dateAjout: -1 }) // Tri par date d'ajout décroissante (plus récent d'abord)
            .skip(parsedOptions.skip)
            .limit(parsedOptions.limit);
        
        // Si on veut les infos vendeur détaillées, utiliser la méthode personnalisée
        if (parsedOptions.avecInfosVendeur && produits.length > 0) {
            const produitsAvecVendeur = [];
            for (const produit of produits) {
                const produitComplet = await produit.getProduitAvecInfosVendeur();
                produitsAvecVendeur.push(produitComplet);
            }
            return res.status(200).json(produitsAvecVendeur);
        } else {
            // Sinon, utiliser populate pour obtenir les infos vendeur de base
            produits = await Produit.find(query)
                .populate('vendeur', 'nom nomPharmacie role numeroTelephone telephone')
                .sort({ dateAjout: -1 })
                .skip(parsedOptions.skip)
                .limit(parsedOptions.limit);
            
            return res.status(200).json(produits);
        }
    } catch (error) {
        console.error('Erreur lors de la recherche de produits:', error);
        res.status(500).json({ 
            message: "Erreur lors de la recherche de produits par nom.", 
            errorMessage: error.message,
            stack: error.stack 
        });
    }
};//k


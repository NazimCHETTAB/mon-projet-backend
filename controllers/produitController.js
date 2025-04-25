const Produit = require('../models/produit'); 
const Utilisateur = require('../models/utilisateur'); 

exports.ajouterProduit = async (req, res) => {
    try {
        console.log('Données reçues:', req.body);
        console.log('Utilisateur authentifié:', req.user);
        
        const { nom, description, prix, photo } = req.body;
        const role = req.user.role;
        
        // Vérifier si l'utilisateur est autorisé à ajouter un produit
        if (!['Pharmacien', 'Vendeur', 'Admin'].includes(role)) {
            return res.status(403).json({ message: "Accès refusé. Vous ne pouvez pas ajouter un produit." });
        }
        
        // Vérifier si tous les champs obligatoires sont remplis
        if (!nom || !description || !prix) {
            return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis." });
        }
        
        // Récupérer les informations complètes de l'utilisateur
        const utilisateur = await Utilisateur.findById(req.user.id);
        if (!utilisateur) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }
        
        // Créer un nouveau produit avec des informations adaptées au rôle
        let produitData = {
            nom: nom,
            prix: prix,
            photo: photo,
            vendeur: req.user.id
        };

        // Personnaliser la description en fonction du rôle
        let modifiedDescription = description;
        
        if (role === 'Pharmacien') {
            // Ajouter des informations spécifiques pour les pharmaciens
            modifiedDescription = `${description}\n\nPharmacie: ${utilisateur.nomPharmacie || 'Non spécifiée'}\nTél: ${utilisateur.numeroTelephone || utilisateur.telephone || 'Non spécifié'}`;
        } else if (role === 'Vendeur') {
            // Ajouter des informations spécifiques pour les vendeurs
            modifiedDescription = `${description}\n\nVendeur: ${utilisateur.nom || 'Non spécifié'}\nTél: ${utilisateur.numeroTelephone || utilisateur.telephone || 'Non spécifié'}`;
        }
        
        produitData.description = modifiedDescription;
        
        // Créer et sauvegarder le produit
        const produit = new Produit(produitData);
        console.log('Produit avant sauvegarde:', produit);
        
        const savedProduct = await produit.save();
        console.log('Produit sauvegardé:', savedProduct);
        
        res.status(201).json(savedProduct);
    } catch (error) {
        console.error('Erreur complète:', error);
        res.status(500).json({ 
            message: "Erreur lors de l'ajout du produit.", 
            errorMessage: error.message,
            stack: error.stack
        });
    }
};

exports.updateProduit = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, description, prix, photo } = req.body;
        
        // Vérifier si le produit existe
        const produit = await Produit.findById(id);
        if (!produit) {
            return res.status(404).json({ message: "Produit non trouvé." });
        }
        
        // Vérifier si l'utilisateur est le propriétaire du produit
        if (produit.vendeur.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier ce produit." });
        }
        
        // Récupérer les informations complètes de l'utilisateur
        const utilisateur = await Utilisateur.findById(req.user.id);
        if (!utilisateur) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }
        
        // Personnaliser la description en fonction du rôle
        let modifiedDescription = description;
        const role = req.user.role;
        
        if (role === 'Pharmacien') {
            // Ajouter des informations spécifiques pour les pharmaciens
            modifiedDescription = `${description}\n\nPharmacie: ${utilisateur.nomPharmacie || 'Non spécifiée'}\nTél: ${utilisateur.numeroTelephone || utilisateur.telephone || 'Non spécifié'}`;
        } else if (role === 'Vendeur') {
            // Ajouter des informations spécifiques pour les vendeurs
            modifiedDescription = `${description}\n\nVendeur: ${utilisateur.nom || 'Non spécifié'}\nTél: ${utilisateur.numeroTelephone || utilisateur.telephone || 'Non spécifié'}`;
        }
        
        // Mettre à jour le produit
        const updatedProduit = await Produit.findByIdAndUpdate(
            id,
            { 
                nom, 
                description: modifiedDescription, 
                prix, 
                photo 
            },
            { new: true }
        );
        
        res.status(200).json(updatedProduit);
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: "Erreur lors de la mise à jour du produit.", error });
    }
};
exports.deleteProduit = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Vérifier si le produit existe
        const produit = await Produit.findById(id);
        if (!produit) {
            return res.status(404).json({ message: "Produit non trouvé." });
        }
        
        // Vérifier si l'utilisateur est le propriétaire du produit ou un admin
        if (produit.vendeur.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Vous n'êtes pas autorisé à supprimer ce produit." });
        }
        
        await Produit.findByIdAndDelete(id);
        res.status(200).json({ message: "Produit supprimé avec succès." });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ 
            message: "Erreur lors de la suppression du produit.",
            error: error.toString(),
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


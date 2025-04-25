const Utilisateur = require('../models/utilisateur');
const Produit = require('../models/produit');
const Notification = require('../models/notification');
const Message = require('../models/message');

// Fonctions existantes pour les utilisateurs normaux
exports.obtenirProfil = async (req, res) => {
    try {
        const utilisateur = await Utilisateur.findById(req.user.id).select("-motDePasse");
        if (!utilisateur) return res.status(404).json({ message: "Utilisateur non trouvé" });
        res.json(utilisateur);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.obtenirProfilAutre = async (req, res) => {
    try {
        const utilisateur = await Utilisateur.findById(req.params.id).select("-motDePasse");
        if (!utilisateur) return res.status(404).json({ message: "Utilisateur non trouvé" });
        res.json(utilisateur);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Fonctions admin intégrées
exports.gestionAdmin = {



   

    // Pharmaciens
obtenirNotifications: async (req, res) => {
        try {
            // Log pour débogage
            console.log("Récupération des notifications pour l'utilisateur:", req.user.id);
            
            // Requête plus générale pour voir toutes les notifications
            const toutesNotifications = await Notification.find({ 
                utilisateur: req.user.id
            });
            
            console.log("Toutes les notifications (incluant lues):", toutesNotifications.length);
            console.log("Types de toutes les notifications:", toutesNotifications.map(n => n.type));
            
            // Récupérer les notifications non lues
            const notifications = await Notification.find({ 
                utilisateur: req.user.id,
                lu: false
            })
            .sort('-dateCreation')
            .populate('produit', 'nom')
            .populate('pharmacien', 'email nomPharmacie licence')
            .populate('message', 'contenu')
            .populate('signalePar', 'email username');
            
            console.log("Notifications non lues:", notifications.length);
            console.log("Types de notifications non lues:", notifications.map(n => n.type));
            
            // Pour débogage seulement, afficher toutes les notifications
            console.log("Détails des notifications:", JSON.stringify(notifications, null, 2));
            
            res.json(notifications);
        } catch (error) {
            console.error("Erreur complète lors de la récupération des notifications:", error);
            res.status(500).json({ 
                message: "Erreur serveur", 
                error: error.toString() 
            });
        }
    },

validerPharmacien: async (req, res) => {
        try {
            const pharmacien = await Utilisateur.findByIdAndUpdate(
                req.params.id,
                { compteValide: true },
                { new: true }
            ).select('-motDePasse');
            if (!pharmacien) return res.status(404).json({ message: "Pharmacien non trouvé" });
            res.json({ message: "Pharmacien validé", pharmacien });
        } catch (error) {
            res.status(500).json({ message: "Erreur serveur", error });
        }
    },

    // Messages signalés


    traiterSignalement: async (req, res) =>{
        try {
            const messageId = req.params.id;
            const { action } = req.body; // 'approuver' ou 'refuser'
            
            // Vérifier si l'utilisateur est admin
            if (!req.user || req.user.role !== 'Admin') {
                return res.status(403).json({ message: "Accès interdit. Seuls les administrateurs peuvent traiter les signalements." });
            }
            
            const message = await Message.findById(messageId);
            if (!message) {
                return res.status(404).json({ message: "Message non trouvé" });
            }
            
            // Mettre à jour le statut du message selon l'action
            if (action === 'approuver') {
                // Si approuvé, supprimer ou masquer le message (selon votre logique)
                await Message.findByIdAndUpdate(messageId, { 
                    estSignale: false,
                    supprime: true  // Ajoutez ce champ à votre modèle Message si nécessaire
                });
            } else {
                // Si refusé, simplement marquer comme non signalé
                await Message.findByIdAndUpdate(messageId, { estSignale: false });
            }
            
            // Mettre à jour toutes les notifications liées à ce message
            await Notification.updateMany(
                { message: messageId, type: 'signalement_message' },
                { 
                    status: action === 'approuver' ? 'approuvé' : 'refusé',
                    lu: true
                }
            );
            
            res.status(200).json({ 
                message: `Signalement ${action === 'approuver' ? 'approuvé' : 'refusé'} avec succès.`
            });
        } catch (error) {
            console.error('Erreur:', error);
            res.status(500).json({ 
                message: "Erreur lors du traitement du signalement.",
                error: error.toString()
            });
        }
    },
   obtenirNotifications: async (req, res) => {
        try {
            // Récupérer les notifications de l'utilisateur
            const notifications = await Notification.find({ 
                utilisateur: req.user.id,
                lu: false
            })
            .sort('-dateCreation')
            .populate('produit', 'nom')
            .populate('pharmacien', 'email nomPharmacie licence') // Ajout de cette ligne
            .populate('message', 'contenu')
            .populate('signalePar', 'email username');
            
            res.json(notifications);
        } catch (error) {
            res.status(500).json({ message: "Erreur serveur", error });
        }
    },
    
    // Marquer une notification comme lue
    marquerNotificationLue: async (req, res) => {
        try {
            const { id } = req.params;
            
            await Notification.findOneAndUpdate(
                { _id: id, utilisateur: req.user.id },
                { lu: true }
            );
            
            res.json({ message: "Notification marquée comme lue" });
        } catch (error) {
            res.status(500).json({ message: "Erreur serveur", error });
        }
    }
};

// Fonctions existantes de mise à jour/suppression
exports.mettreAJourUtilisateur = async (req, res) => {
    try {
        const utilisateur = await Utilisateur.findByIdAndUpdate(
            req.user.id,
            req.body,
            { new: true }
        ).select('-motDePasse');
        if (!utilisateur) return res.status(404).json({ message: "Utilisateur non trouvé" });
        res.json({ message: "Profil mis à jour", utilisateur });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.supprimerUtilisateur = async (req, res) => {
    try {
        if (req.user.role !== 'Admin' && req.user.id !== req.params.id) {
            return res.status(403).json({ message: "Action non autorisée" });
        }
        await Utilisateur.findByIdAndDelete(req.params.id);
        res.json({ message: "Utilisateur supprimé" });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};
exports.signalerMessage = async (req, res) => {
    try {
        // Utiliser une raison par défaut, aucune donnée n'est requise
        const raison = "Contenu inapproprié";
        const description = req.body.description || "Signalement automatique";
        const email = req.body.email || "Anonyme";
        
        // Récupérer tous les administrateurs
        const admins = await Utilisateur.find({ role: 'Admin' });
        
        if (admins.length === 0) {
            console.log("Aucun administrateur trouvé pour envoyer les notifications");
            return res.status(200).json({ 
                success: true,
                message: "Signalement enregistré." 
            });
        }
        
        console.log(`Envoi de notifications à ${admins.length} administrateurs`);
        
        // Créer une notification pour chaque administrateur
        for (const admin of admins) {
            const notification = new Notification({
                type: 'signalement_message',
                utilisateur: admin._id,
                raison: raison,
                description: description,
                email: email,
                status: 'en_attente',
                dateCreation: new Date(),
                lu: false // S'assurer que la notification n'est pas marquée comme lue
            });
            
            const savedNotif = await notification.save();
            console.log(`Notification de signalement créée pour admin ${admin._id}, ID: ${savedNotif._id}`);
        }
        
        // Message simplifié
        res.status(200).json({ 
            success: true,
            message: "Signalement envoyé."
        });
    } catch (error) {
        console.error('Erreur complète lors du signalement:', error);
        // Message d'erreur simplifié, mais nous loggons l'erreur complète pour débogage
        res.status(200).json({ 
            success: true,
            message: "Signalement envoyé."
        });
    }
};
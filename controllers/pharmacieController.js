<<<<<<< HEAD
const Pharmacie = require('../models/Pharmacie');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');

// @desc    Complete pharmacist profile
// @route   POST /api/pharmacies
// @access  Private (Pharmacist only)
const completeProfile = asyncHandler(async(req, res) => {
    // Check if pharmacist already has a profile
    const existingProfile = await Pharmacie.findOne({ user: req.user.id });

    if (existingProfile) {
        return res.status(400).json({
            success: false,
            message: 'Pharmacist profile already exists'
        });
    }

    // Create pharmacist profile
    const pharmacie = await Pharmacie.create({
        user: req.user.id,
        location: req.body.location,
        address: req.body.address,
        socialMedia: {
            instagram: req.body.instagram,
            facebook: req.body.facebook,
            linkedin: req.body.linkedin
        },
        certificatePath: req.file.path
    });

    res.status(201).json({
        success: true,
        data: pharmacie,
        message: 'Profile submitted for approval'
    });
});

// @desc    Get all pharmacies
// @route   GET /api/pharmacies
// @access  Public
const getPharmacies = asyncHandler(async(req, res) => {
    // Only get approved pharmacies for public
    const query = { isApproved: true };

    const pharmacies = await Pharmacie.find(query).populate({
        path: 'user',
        select: 'firstName familyName email phoneNumber'
    });

    res.status(200).json({
        success: true,
        count: pharmacies.length,
        data: pharmacies
    });
});

// @desc    Get single pharmacy
// @route   GET /api/pharmacies/:id
// @access  Public
const getPharmacy = asyncHandler(async(req, res) => {
    const pharmacie = await Pharmacie.findById(req.params.id).populate({
        path: 'user',
        select: 'firstName familyName email phoneNumber'
    });

    if (!pharmacie) {
        return res.status(404).json({
            success: false,
            message: `No pharmacy found with the id of ${req.params.id}`
        });
    }

    // Only show approved pharmacies to public
    if (!pharmacie.isApproved && req.user && req.user.role !== 'admin') {
        return res.status(404).json({
            success: false,
            message: `No pharmacy found with the id of ${req.params.id}`
        });
    }

    res.status(200).json({
        success: true,
        data: pharmacie
    });
});

// @desc    Update pharmacy
// @route   PUT /api/pharmacies/:id
// @access  Private (Owner or Admin)
const updatePharmacy = asyncHandler(async(req, res) => {
    let pharmacie = await Pharmacie.findById(req.params.id);

    if (!pharmacie) {
        return res.status(404).json({
            success: false,
            message: `No pharmacy found with the id of ${req.params.id}`
        });
    }

    // Make sure user is pharmacy owner or admin
    if (pharmacie.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(401).json({
            success: false,
            message: `User ${req.user.id} is not authorized to update this pharmacy`
        });
    }

    const fieldsToUpdate = {
        location: req.body.location,
        address: req.body.address,
        socialMedia: {
            instagram: req.body.instagram,
            facebook: req.body.facebook,
            linkedin: req.body.linkedin
        }
    };

    pharmacie = await Pharmacie.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: pharmacie
    });
});

// @desc    Update pharmacy certificate
// @route   PUT /api/pharmacies/:id/certificate
// @access  Private (Owner or Admin)
const updateCertificate = asyncHandler(async(req, res) => {
    let pharmacie = await Pharmacie.findById(req.params.id);

    if (!pharmacie) {
        return res.status(404).json({
            success: false,
            message: `No pharmacy found with the id of ${req.params.id}`
        });
    }

    // Make sure user is pharmacy owner or admin
    if (pharmacie.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(401).json({
            success: false,
            message: `User ${req.user.id} is not authorized to update this pharmacy`
        });
    }

    // Delete old certificate
    if (fs.existsSync(pharmacie.certificatePath)) {
        fs.unlinkSync(pharmacie.certificatePath);
    }

    // Update with new certificate
    pharmacie = await Pharmacie.findByIdAndUpdate(req.params.id, { certificatePath: req.file.path, isApproved: false }, // Reset approval status
        { new: true }
    );

    res.status(200).json({
        success: true,
        data: pharmacie,
        message: 'Certificate updated and submitted for re-approval'
    });
});

// @desc    Get my pharmacy profile
// @route   GET /api/pharmacies/me
// @access  Private (Pharmacist only)
const getMyPharmacy = asyncHandler(async(req, res) => {
    const pharmacie = await Pharmacie.findOne({ user: req.user.id });

    if (!pharmacie) {
        return res.status(404).json({
            success: false,
            message: 'No pharmacy profile found'
        });
    }

    res.status(200).json({
        success: true,
        data: pharmacie
    });
});

module.exports = {
    completeProfile,
    getPharmacies,
    getPharmacy,
    updatePharmacy,
    updateCertificate,
    getMyPharmacy
};
=======
const jwt = require('jsonwebtoken');
const Pharmacie = require('../models/pharmacie');
const User = require('../models/utilisateur');
const authMiddlewares = require('../middlewares/authMiddlewares');
// Ajouter une pharmacie (Réservé aux pharmaciens et aux administrateurs)
exports.ajouterPharmacie = async (req, res) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: "Accès refusé. Token manquant." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const utilisateur = await User.findById(decoded.id);

        if (!utilisateur || (utilisateur.role !== 'pharmacien' && utilisateur.role !== 'Admin')) {
            return res.status(403).json({ message: "Accès interdit. Seuls les pharmaciens et les administrateurs peuvent ajouter une pharmacie." });
        }

        const { nomPharmacie, adresse, wilaya, telephone, localisation } = req.body;
        
        // Vérification des coordonnées GPS
        if (!localisation || !localisation.latitude || !localisation.longitude) {
            return res.status(400).json({ message: "Les coordonnées GPS (latitude et longitude) sont requises dans l'objet localisation." });
        }
        
        // Convertir en nombres pour validation
        const lat = parseFloat(localisation.latitude);
        const lng = parseFloat(localisation.longitude);
        
        // Vérifier que les coordonnées sont valides
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({ message: "Coordonnées GPS invalides. Latitude doit être entre -90 et 90, Longitude entre -180 et 180." });
        }
        
        // Créer la nouvelle pharmacie en utilisant les noms de champs corrects
        const nouvellePharmacie = new Pharmacie({
            nom: nomPharmacie,  // Utiliser 'nom' au lieu de 'nomPharmacie'
            adresse,
            wilaya,
            telephone,
            latitude: lat,      // Mettre latitude à la racine
            longitude: lng,     // Mettre longitude à la racine
            proprietaire: utilisateur._id
        });

        await nouvellePharmacie.save();
        res.status(201).json({ message: "Pharmacie ajoutée avec succès.", pharmacie: nouvellePharmacie });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de l'ajout de la pharmacie.", error });
    }
};
// Modifier une pharmacie (Réservé au pharmacien propriétaire ou à l'administrateur)
exports.modifierPharmacie = async (req, res) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: "Accès refusé. Token manquant." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const utilisateur = await User.findById(decoded.id);

        if (!utilisateur) {
            return res.status(403).json({ message: "Utilisateur non autorisé." });
        }

        const pharmacie = await Pharmacie.findById(req.params.id);
        if (!pharmacie) {
            return res.status(404).json({ message: "Pharmacie non trouvée." });
        }

        // Vérifier si l'utilisateur est l'admin ou le propriétaire de la pharmacie
        if (utilisateur.role !== 'Admin' && pharmacie.proprietaire.toString() !== utilisateur._id.toString()) {
            return res.status(403).json({ message: "Accès interdit. Vous ne pouvez modifier que votre propre pharmacie." });
        }

        // Préparer les données à mettre à jour
        const updates = {};
        
        // Récupérer les champs à mettre à jour
        if (req.body.nomPharmacie) updates.nom = req.body.nomPharmacie;
        if (req.body.adresse) updates.adresse = req.body.adresse;
        if (req.body.wilaya) updates.wilaya = req.body.wilaya;
        if (req.body.telephone) updates.telephone = req.body.telephone;
        
        // Si localisation est fournie, valider et intégrer les coordonnées directement
        if (req.body.localisation) {
            if (!req.body.localisation.latitude || !req.body.localisation.longitude) {
                return res.status(400).json({ message: "Les coordonnées GPS (latitude et longitude) sont requises." });
            }
            
            const lat = parseFloat(req.body.localisation.latitude);
            const lng = parseFloat(req.body.localisation.longitude);
            
            if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                return res.status(400).json({ message: "Coordonnées GPS invalides." });
            }
            
            updates.latitude = lat;
            updates.longitude = lng;
        }

        // Mettre à jour la pharmacie avec les champs validés
        const pharmacieModifiee = await Pharmacie.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: "Pharmacie modifiée avec succès.", pharmacie: pharmacieModifiee });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la modification de la pharmacie.", error });
    }
};

// Supprimer une pharmacie (pas de modification nécessaire)
exports.supprimerPharmacie = async (req, res) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: "Accès refusé. Token manquant." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const utilisateur = await User.findById(decoded.id);

        if (!utilisateur) {
            return res.status(403).json({ message: "Utilisateur non autorisé." });
        }

        const pharmacie = await Pharmacie.findById(req.params.id);
        if (!pharmacie) {
            return res.status(404).json({ message: "Pharmacie non trouvée." });
        }

        // Vérifier si l'utilisateur est l'admin ou le propriétaire de la pharmacie
        if (utilisateur.role !== 'admin' && pharmacie.proprietaire.toString() !== utilisateur._id.toString()) {
            return res.status(403).json({ message: "Accès interdit. Vous ne pouvez supprimer que votre propre pharmacie." });
        }

        await Pharmacie.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Pharmacie supprimée avec succès." });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la suppression de la pharmacie.", error });
    }
};

// Récupérer toutes les pharmacies (maintenant avec option de localisation)
exports.getAllPharmacies = async (req, res) => {
    try {
        // Vérifier si des coordonnées sont fournies pour trier par proximité
        if (req.query.lat && req.query.lng) {
            const latitude = parseFloat(req.query.lat);
            const longitude = parseFloat(req.query.lng);
            
            if (isNaN(latitude) || isNaN(longitude)) {
                return res.status(400).json({ message: "Coordonnées GPS invalides." });
            }
            
            const pharmacies = await Pharmacie.find();
            
            // Ajouter la distance à chaque pharmacie
            const pharmaciesAvecDistance = pharmacies.map(pharmacie => {
                const pharmObj = pharmacie.toObject();
                const distance = calculateDistance(
                    latitude, longitude,
                    pharmacie.localisation.latitude, pharmacie.localisation.longitude
                );
                pharmObj.distance = Math.round(distance * 10) / 10; // Arrondir à 1 décimale
                return pharmObj;
            });
            
            // Trier par distance
            pharmaciesAvecDistance.sort((a, b) => a.distance - b.distance);
            
            return res.status(200).json(pharmaciesAvecDistance);
        }
        
        // Sinon, retourner toutes les pharmacies sans tri
        const pharmacies = await Pharmacie.find();
        res.status(200).json(pharmacies);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des pharmacies.", error });
    }
};

// Récupérer une pharmacie par ID (avec option de distance)
exports.getPharmacieById = async (req, res) => {
    try {
        const pharmacie = await Pharmacie.findById(req.params.id);
        if (!pharmacie) {
            return res.status(404).json({ message: "Pharmacie non trouvée." });
        }
        
        // Si des coordonnées sont fournies, calculer la distance
        if (req.query.lat && req.query.lng) {
            const latitude = parseFloat(req.query.lat);
            const longitude = parseFloat(req.query.lng);
            
            if (!isNaN(latitude) && !isNaN(longitude)) {
                const pharmObj = pharmacie.toObject();
                const distance = calculateDistance(
                    latitude, longitude,
                    pharmacie.localisation.latitude, pharmacie.localisation.longitude
                );
                pharmObj.distance = Math.round(distance * 10) / 10; // Arrondir à 1 décimale
                return res.status(200).json(pharmObj);
            }
        }
        
        res.status(200).json(pharmacie);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération de la pharmacie.", error });
    }
};

// Recherche de pharmacies par nom (avec option de tri par distance)

exports.rechercherPharmacieParNom = async (req, res) => {
    try {
        const nom = req.query.nom;
        if (!nom) {
            return res.status(400).json({ message: "Le paramètre 'nom' est requis." });
        }
        
        // Correction: utiliser "nom" au lieu de "nomPharmacie"
        const pharmacies = await Pharmacie.find({ nom: { $regex: nom, $options: 'i' } });
        
        // Si des coordonnées sont fournies, trier par proximité
        if (req.query.lat && req.query.lng) {
            const latitude = parseFloat(req.query.lat);
            const longitude = parseFloat(req.query.lng);
            
            if (!isNaN(latitude) && !isNaN(longitude)) {
                const pharmaciesAvecDistance = pharmacies.map(pharmacie => {
                    const pharmObj = pharmacie.toObject();
                    // Correction: utiliser les propriétés à la racine selon votre schéma
                    const distance = calculateDistance(
                        latitude, longitude,
                        pharmacie.latitude, pharmacie.longitude
                    );
                    pharmObj.distance = Math.round(distance * 10) / 10; // Arrondir à 1 décimale
                    return pharmObj;
                });
                
                // Trier par distance
                pharmaciesAvecDistance.sort((a, b) => a.distance - b.distance);
                
                return res.status(200).json(pharmaciesAvecDistance);
            }
        }
        
        res.status(200).json(pharmacies);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la recherche des pharmacies.", error });
    }
};
// Nouvelle fonction: Trouver les pharmacies à proximité
exports.findNearbyPharmacies = async (req, res) => {
    try {
        const { lat, lng, distance = 5 } = req.query; // distance en km, par défaut 5km
        
        if (!lat || !lng) {
            return res.status(400).json({ message: "Les coordonnées GPS sont requises" });
        }
        
        // Convertir les coordonnées en nombres
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        
        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({ message: "Coordonnées GPS invalides." });
        }
        
        // Recherche simple avec filtrage par distance
        const pharmacies = await Pharmacie.find();
        
        // Filtrer les pharmacies par distance
        const pharmaciesProches = pharmacies
            .map(pharmacie => {
                const pharmObj = pharmacie.toObject();
                const dist = calculateDistance(
                    latitude, longitude,
                    pharmacie.localisation.latitude, pharmacie.localisation.longitude
                );
                pharmObj.distance = Math.round(dist * 10) / 10; // Arrondir à 1 décimale
                return pharmObj;
            })
            .filter(pharmacie => pharmacie.distance <= parseFloat(distance))
            .sort((a, b) => a.distance - b.distance);
        
        res.status(200).json(pharmaciesProches);
    } catch (error) {
        res.status(500).json({ 
            message: "Erreur lors de la recherche des pharmacies à proximité", 
            error: error.message 
        });
    }
};

// Fonction utilitaire pour calculer la distance entre deux points GPS
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance en km
    return distance;
}
>>>>>>> bf15775c51ff21f57620fe8b157ed20f0f428711

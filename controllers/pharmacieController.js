const jwt = require('jsonwebtoken');
const Pharmacie = require('../models/pharmacie');
const User = require('../models/utilisateur');
const authMiddlewares = require('../middlewares/authMiddlewares');

// Fonction pour calculer la distance entre deux points GPS (formule de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const toRad = (value) => value * Math.PI / 180;
    const R = 6371; // Rayon de la Terre en km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance en kilomètres
}

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
                    pharmacie.latitude, pharmacie.longitude // Correction ici
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
                    pharmacie.latitude, pharmacie.longitude // Correction ici
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
                    pharmacie.latitude, pharmacie.longitude
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

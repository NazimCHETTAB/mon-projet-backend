const Medicament = require('../models/Medicament');
const { getDistance } = require('../utils/locationUtils');

// Récupérer les médicaments avec filtres et tri par distance
const getMedicaments = async(req, res) => {
    try {
        let { nom, maxprix, latitude, longitude } = req.query;
        let filtre = {};

        if (nom) filtre.nom = { $regex: new RegExp(nom, 'i') };
        if (maxprix) filtre.prix = { $lte: Number(maxprix) };

        // Récupérer les médicaments avec leurs pharmaciens et pharmacies
        let medicaments = await Medicament.find(filtre)
            .populate('pharmacienId', 'email telephone')
            .populate('pharmacieId', 'nom adresse latitude longitude');

        // Si l'utilisateur envoie sa localisation, ajouter la distance
        if (latitude && longitude) {
            latitude = parseFloat(latitude);
            longitude = parseFloat(longitude);

            medicaments = medicaments.map(med => {
                if (med.pharmacieId) {
                    const distance = getDistance(latitude, longitude, med.pharmacieId.latitude, med.pharmacieId.longitude);
                    return {...med.toObject(), distance };
                }
                return med.toObject();
            });

            // Trier les médicaments du plus proche au plus éloigné
            medicaments.sort((a, b) => a.distance - b.distance);
        }

        res.json(medicaments);
    } catch (error) {
        res.status(500).json({ message: "Erreur interne", erreur: error.message });
    }
};

// Ajouter un médicament
const ajouterMedicament = async(req, res) => {
    try {
        const { nom, prix, quantite, description, pharmacieId } = req.body;
        const newMedicament = new Medicament({
            nom,
            prix,
            quantite,
            description,
            pharmacienId: req.userId,
            pharmacieId
        });

        await newMedicament.save();
        res.status(201).json({ message: "Médicament ajouté avec succès !" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de l'ajout", erreur: error.message });
    }
};

// Modifier un médicament
const modifierMedicament = async(req, res) => {
    try {
        const medicament = await Medicament.findById(req.params.id);
        if (!medicament || medicament.pharmacienId.toString() !== req.userId) {
            return res.status(403).json({ message: "Action non autorisée." });
        }

        await Medicament.findByIdAndUpdate(req.params.id, req.body);
        res.json({ message: "Médicament modifié !" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la modification", erreur: error.message });
    }
};

// Supprimer un médicament
const supprimerMedicament = async(req, res) => {
    try {
        const medicament = await Medicament.findById(req.params.id);
        if (!medicament || medicament.pharmacienId.toString() !== req.userId) {
            return res.status(403).json({ message: "Action non autorisée." });
        }

        await Medicament.findByIdAndDelete(req.params.id);
        res.json({ message: "Médicament supprimé !" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la suppression", erreur: error.message });
    }
};

module.exports = {
    getMedicaments,
    ajouterMedicament,
    modifierMedicament,
    supprimerMedicament
};
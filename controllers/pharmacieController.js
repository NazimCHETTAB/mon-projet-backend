const Pharmacie = require('../models/Pharmacie');

// Récupérer toutes les pharmacies
const getPharmacies = async(req, res) => {
    try {
        const pharmacies = await Pharmacie.find();
        res.json(pharmacies);
    } catch (error) {
        res.status(500).json({ message: "Erreur interne", erreur: error.message });
    }
};

// Ajouter une pharmacie
const ajouterPharmacie = async(req, res) => {
    try {
        const { nom, adresse, latitude, longitude } = req.body;
        const nouvellePharmacie = new Pharmacie({ nom, adresse, latitude, longitude });
        await nouvellePharmacie.save();
        res.status(201).json(nouvellePharmacie);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de l'ajout de la pharmacie", erreur: error.message });
    }
};

module.exports = {
    getPharmacies,
    ajouterPharmacie
};
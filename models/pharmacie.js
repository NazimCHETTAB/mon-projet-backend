const mongoose = require('mongoose');

const pharmacieSchema = new mongoose.Schema({
    nom: { type: String, required: true }, // Nom de la pharmacie
    adresse: { type: String, required: true }, // Adresse de la pharmacie
    wilaya: { type: String, required: true }, // Wilaya où se trouve la pharmacie
    latitude: { type: Number, required: true }, // Coordonnée GPS - Latitude
    longitude: { type: Number, required: true }, // Coordonnée GPS - Longitude
    telephone: { type: String }, // Numéro de téléphone (optionnel)
    proprietaire: { type: mongoose.Schema.Types.ObjectId, ref: "Utilisateur", required: true } // Référence au propriétaire de la pharmacie
});

// Ajout d'un index géospatial pour les recherches de proximité
pharmacieSchema.index({ latitude: 1, longitude: 1 }, { "2dsphere": true });

const Pharmacie = mongoose.model("Pharmacie", pharmacieSchema);

module.exports = Pharmacie;

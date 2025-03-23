const mongoose = require("mongoose");

const PharmacieSchema = new mongoose.Schema({
    nom: { type: String, required: true }, // Nom de la pharmacie
    adresse: { type: String, required: true }, // Adresse de la pharmacie
    latitude: { type: Number, required: true }, // Coordonnée de latitude (Google Maps)
    longitude: { type: Number, required: true }, // Coordonnée de longitude (Google Maps)
});

module.exports = mongoose.model("Pharmacie", PharmacieSchema);


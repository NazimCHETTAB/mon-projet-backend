const mongoose = require('mongoose');

const pharmacieSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    adresse: { type: String, required: true },
    latitude: Number,
    longitude: Number
});

module.exports = mongoose.model('Pharmacie', pharmacieSchema);
const mongoose = require('mongoose');

const medicamentSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    prix: { type: Number, required: true },
    quantite: { type: Number, required: true },
    description: String,
    datePoste: { type: Date, default: Date.now },
    pharmacienId: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
    pharmacieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacie' }
});

module.exports = mongoose.model('Medicament', medicamentSchema);
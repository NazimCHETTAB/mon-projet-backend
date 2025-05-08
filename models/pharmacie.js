const mongoose = require('mongoose');

<<<<<<< HEAD
const PharmacieSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        type: String,
        required: [true, 'Please add a location']
    },
    address: {
        type: String,
        required: [true, 'Please add an address']
    },
    socialMedia: {
        instagram: String,
        facebook: String,
        linkedin: String
    },
    certificatePath: {
        type: String,
        required: [true, 'Please upload your certificate']
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Pharmacie', PharmacieSchema);
=======
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

>>>>>>> bf15775c51ff21f57620fe8b157ed20f0f428711

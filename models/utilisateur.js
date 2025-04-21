const mongoose = require('mongoose');

const utilisateurSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true }, // Adresse e-mail obligatoire et unique
    motDePasse: { type: String, required: true }, // Mot de passe obligatoire
    telephone: { 
        type: String, 
        required: function() { return this.role !== 'Visiteur'; } // Téléphone obligatoire sauf pour le visiteur
    },
    role: { 
        type: String, 
        enum: ['Visiteur', 'Vendeur', 'Admin', 'Pharmacien'], 
        default: 'Visiteur' 
    }, // Rôle avec valeur par défaut "Visiteur"
    licence: { 
        type: String, 
        required: function() { return this.role === 'Pharmacien'; } // Licence obligatoire uniquement pour le pharmacien
    },
    nomPharmacie: { 
        type: String, 
        required: function() { return this.role === 'Pharmacien'; } // Nom de la pharmacie obligatoire uniquement pour le pharmacien
    },
    username: { 
        type: String, 
        required: function() { return this.role === 'Vendeur' || this.role === 'Pharmacien'; } 
    }, // Nom d'utilisateur obligatoire pour les vendeurs et pharmaciens
    photoProfil: { 
        type: String, 
        required: function() { return this.role === 'Vendeur' || this.role === 'Pharmacien'; } 
    } // Photo de profil obligatoire pour les vendeurs et pharmaciens
}, { timestamps: true });

const Utilisateur = mongoose.model('Utilisateur', utilisateurSchema);
module.exports = Utilisateur;





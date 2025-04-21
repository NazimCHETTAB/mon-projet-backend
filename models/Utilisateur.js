const mongoose = require('mongoose');

const utilisateurSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['utilisateur', 'pharmacien', 'admin'], required: true },
    telephone: String,
    validé: { type: Boolean, default: function() { return this.role === 'utilisateur'; } },
    pharmacieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacie' }
});

module.exports = mongoose.model('Utilisateur', utilisateurSchema);
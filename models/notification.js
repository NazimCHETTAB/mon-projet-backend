const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['demande_pharmacien', 'signalement_message'],
    required: true
  },
  pharmacien: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur'
  },
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  // Champ optionnel pour référencer un produit
  produit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produit'
  },
  // Nouveau champ pour référencer un message
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  // Pour stocker la raison du signalement
  raison: {
    type: String
  },
  // Pour indiquer qui a fait le signalement
  signalePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur'
  },
  status: {
    type: String,
    enum: ['en_attente', 'approuvé', 'refusé', 'traité'],
    default: 'en_attente'
  },
  lu: {
    type: Boolean,
    default: false
  },
  dateCreation: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
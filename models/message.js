const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  // Supposons que votre modèle contient déjà ces champs
  contenu: {
    type: String,
    required: true
  },
  expediteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  destinataire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  lu: {
    type: Boolean,
    default: false
  },
  dateEnvoi: {
    type: Date,
    default: Date.now
  },
  
  // Nouveaux champs à ajouter pour le signalement
  estSignale: { 
    type: Boolean, 
    default: false 
  },
  raisonSignalement: { 
    type: String,
    default: null
  },
  signaledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    default: null
  },
  dateSignalement: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
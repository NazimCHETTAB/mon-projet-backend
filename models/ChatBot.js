const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    utilisateurId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Utilisateur', 
        required: true // Référence à l'utilisateur qui envoie le message
    },
    message: { type: String, required: true }, // Contenu du message envoyé
    reponse: { type: String }, // Réponse du chatbot (peut être vide si en attente de traitement)
    date: { type: Date, default: Date.now } // Date d'envoi du message
});

const ChatBot = mongoose.model('ChatBot', chatSchema);
module.exports = ChatBot;


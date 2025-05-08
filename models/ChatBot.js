const mongoose = require("mongoose");

// Définition du schéma pour le chatbot
const chatbotSchema = new mongoose.Schema({
    question: { type: String, required: true }, // La question posée par l'utilisateur
    answer: { type: String, required: true }, // La réponse associée à la question
}, { timestamps: true }); // Ajoute automatiquement createdAt et updatedAt

const Chatbot = mongoose.model("Chatbot", chatbotSchema);

module.exports = Chatbot;




const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");
const { authentifierUtilisateur, verifierRole } = require("../middlewares/authMiddlewares");
console.log("chatbot Controller :", chatbotController);
// Add this to the top of your chatbotController.js
console.log("chatbotController loaded");

// Route pour ajouter une question-réponse (réservée à l'admin)
router.post("/add", authentifierUtilisateur, verifierRole(['Admin']), chatbotController.addQA);

// Route temporaire pour tester l'ajout sans authentification
router.post("/add-test", chatbotController.addQA);

// Route pour obtenir une réponse en fonction d'une question posée (protégée)
router.get("/get-answer", authentifierUtilisateur, chatbotController.getAnswer);
// Créez une route de test sans authentification pour vérifier
//router.get("/get-answer-test", chatbotController.getAnswer);

// Route pour supprimer une question-réponse (réservée à l'admin)
// Correction de la casse du rôle admin -> Admin
router.delete("/delete/:id", authentifierUtilisateur, verifierRole(['Admin']), chatbotController.deleteQA);

module.exports = router;

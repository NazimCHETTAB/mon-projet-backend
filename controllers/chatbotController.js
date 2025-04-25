const Chatbot = require("../models/ChatBot");

// Ajouter une nouvelle question-réponse (réservé à l'admin)
exports.addQA = async (req, res) => {
    try {
        const { question, answer } = req.body;
        const newQA = new Chatbot({ question, answer });
        await newQA.save();
        res.status(201).json({ message: "Question ajoutée avec succès!", newQA });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de l'ajout de la question", error });
    }
};

// Obtenir une réponse en fonction d'une question (accessible uniquement aux utilisateurs authentifiés)
exports.getAnswer = async (req, res) => {
    try {
        if (!req.user) { // Changé de req.utilisateur à req.user
            return res.status(401).json({ message: "Authentification requise pour utiliser le chatbot" });
        }
        
        const { question } = req.query;
        const qa = await Chatbot.findOne({ question });
        if (!qa) {
            return res.status(404).json({ message: "Question non trouvée" });
        }
        res.status(200).json({ answer: qa.answer });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération de la réponse", error });
    }
};


// Supprimer une question-réponse (réservé à l'admin)
exports.deleteQA = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedQA = await Chatbot.findByIdAndDelete(id);
        if (!deletedQA) {
            return res.status(404).json({ message: "Question non trouvée" });
        }
        res.status(200).json({ message: "Question supprimée avec succès!" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la suppression de la question", error });
    }
};



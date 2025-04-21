const Utilisateur = require('../models/Utilisateur');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Inscription d'un utilisateur
const inscrireUtilisateur = async(req, res) => {
    try {
        const { email, password, role, telephone, pharmacieId } = req.body;
        if (!email || !password || !role) {
            return res.status(400).json({ message: "Tous les champs requis." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new Utilisateur({ email, password: hashedPassword, role, telephone, pharmacieId });
        await newUser.save();
        res.status(201).json({ message: "Inscription réussie, en attente de validation si pharmacien." });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de l'inscription", erreur: error.message });
    }
};

// Connexion d'un utilisateur
const connecterUtilisateur = async(req, res) => {
    try {
        const { email, password } = req.body;
        const user = await Utilisateur.findOne({ email });

        if (!user || !user.validé) {
            return res.status(401).json({ message: "Compte non valide ou en attente de validation." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Mot de passe incorrect." });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la connexion", erreur: error.message });
    }
};

// Validation d'un utilisateur par l'admin
const validerUtilisateur = async(req, res) => {
    try {
        await Utilisateur.findByIdAndUpdate(req.params.id, { validé: true });
        res.json({ message: "Compte validé avec succès !" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la validation", erreur: error.message });
    }
};

// Récupérer la liste des utilisateurs (pour l'admin)
const getUtilisateurs = async(req, res) => {
    try {
        const utilisateurs = await Utilisateur.find({}, 'email role validé telephone');
        res.json(utilisateurs);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs", erreur: error.message });
    }
};

module.exports = {
    inscrireUtilisateur,
    connecterUtilisateur,
    validerUtilisateur,
    getUtilisateurs
};
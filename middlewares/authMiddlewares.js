const jwt = require('jsonwebtoken');
const Utilisateur = require('../models/utilisateur'); 

// Middleware d'authentification
exports.authentifierUtilisateur = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: "Token manquant" });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Token invalide" });
        }
        
        try {
            // Vérifier si l'utilisateur existe et si son compte est validé (pour les pharmaciens)
            const utilisateur = await Utilisateur.findById(decoded.id);
            
            if (!utilisateur) {
                return res.status(401).json({ message: "Utilisateur non trouvé" });
            }
            
            // Vérification spécifique pour les pharmaciens
            if (decoded.role === 'Pharmacien' && utilisateur.compteValide === false) {
                return res.status(403).json({ 
                    message: "Votre compte pharmacien est en attente de validation par un administrateur",
                    compteValide: false
                });
            }
            
            req.user = decoded;
            next();
        } catch (error) {
            console.error('Erreur de vérification du compte:', error);
            return res.status(500).json({ message: "Erreur lors de la vérification du compte" });
        }
    });
};

// Middleware de vérification de rôle (inchangé)
exports.verifierRole = (rolesAutorises) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Utilisateur non authentifié" });
        }
        
        if (!rolesAutorises.includes(req.user.role)) {
            return res.status(403).json({ message: "Permissions insuffisantes" });
        }
        
        next();
    };
};


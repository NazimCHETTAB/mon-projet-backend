const Utilisateur = require('../models/utilisateur'); 
const emailService = require('../services/emailService'); // Nouveau service d'email
const Notification = require('../models/notification');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// 1. Choix du rôle (Première étape)
exports.choisirRole = (req, res) => {
    res.status(200).json({
        message: "Choisissez votre type de compte",
        options: ["Vendeur", "Pharmacien"]
    });
};

// 2. Inscription Pharmacien
exports.inscrirePharmacien = async (req, res) => {
  try {
      const { 
          email, 
          motDePasse, 
          telephone, 
          nomPharmacie, 
          licence, 
          photoProfil, 
          localisation, 
          tempsDeTravail 
      } = req.body;
      
      if (!email || !motDePasse || !telephone || !nomPharmacie || !licence || !localisation) {
          return res.status(400).json({
              success: false,
              message: "Email, mot de passe, téléphone, nom de pharmacie, licence et localisation sont obligatoires"
          });
      }
      
      const existeDeja = await Utilisateur.findOne({ email });
      if (existeDeja) {
          return res.status(400).json({
              success: false,
              message: "Cet email est déjà utilisé"
          });
      }
      
      const nouvelUtilisateur = new Utilisateur({
          email,
          motDePasse: await bcrypt.hash(motDePasse, 10),
          telephone,
          role: "Pharmacien",
          nomPharmacie,
          licence,
          localisation,
          tempsDeTravail: tempsDeTravail || null,
          photoProfil: photoProfil || `https://ui-avatars.com/api/?name=${nomPharmacie.replace(/\s+/g, '+')}`,
          username: email.split('@')[0],
          compteValide: false  // Compte non validé par défaut
      });
      
      await nouvelUtilisateur.save();
      
      // Créer des notifications pour les administrateurs
      try {
          const admins = await Utilisateur.find({ role: 'Admin' });
          console.log(`Trouvé ${admins.length} administrateurs pour les notifications`);
          
          if (admins.length === 0) {
              console.log("Attention: Aucun administrateur trouvé pour envoyer les notifications");
          }
          
          for (const admin of admins) {
              const notification = new Notification({
                  type: 'demande_pharmacien',
                  utilisateur: admin._id,
                  pharmacien: nouvelUtilisateur._id,
                  status: 'en_attente',
                  dateCreation: new Date()
              });
              
              const savedNotif = await notification.save();
              console.log(`Notification créée avec succès pour admin ${admin._id}, ID: ${savedNotif._id}`);
          }
      } catch (notifError) {
          console.error("Erreur détaillée lors de la création des notifications:", notifError);
      }
      
      const token = jwt.sign(
          { id: nouvelUtilisateur._id, role: 'Pharmacien' },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
      );
      
      res.status(201).json({
          success: true,
          message: "Pharmacien enregistré avec succès. Votre compte est en attente de validation par un administrateur.",
          token,
          user: nouvelUtilisateur
      });
  } catch (error) {
      console.error("Erreur complète lors de l'inscription:", error);
      res.status(500).json({
          success: false,
          message: "Erreur lors de l'inscription",
          error: error.message
      });
  }
};
// 3. Inscription Vendeur
exports.inscrireVendeur = async (req, res) => {
    try {
        const { email, motDePasse, telephone, username, photoProfil } = req.body;

        if (!email || !motDePasse || !telephone || !username) {
            return res.status(400).json({ 
                success: false,
                message: "Email, mot de passe, téléphone et username sont obligatoires" 
            });
        }

        const existeDeja = await Utilisateur.findOne({ email });
        if (existeDeja) {
            return res.status(400).json({ 
                success: false,
                message: "Cet email est déjà utilisé" 
            });
        }

        const nouvelUtilisateur = new Utilisateur({
            email,
            motDePasse: await bcrypt.hash(motDePasse, 10),
            telephone,
            role: "Vendeur",
            username,
            photoProfil: photoProfil || `https://ui-avatars.com/api/?name=${username.replace(/\s+/g, '+')}`
        });

        await nouvelUtilisateur.save();

        const token = jwt.sign(
            { id: nouvelUtilisateur._id, role: 'Vendeur' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: "Vendeur enregistré avec succès",
            token,
            user: nouvelUtilisateur
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de l'inscription",
            error: error.message
        });
    }
};
//inscription admin 
exports.inscrireAdmin = async (req, res) => {
    try {
      const { nom, email, motDePasse, telephone } = req.body;
      
      // Vérifiez si l'email existe déjà
      const utilisateurExistant = await Utilisateur.findOne({ email });
      if (utilisateurExistant) {
        return res.status(400).json({
          success: false,
          message: "Cet email est déjà utilisé"
        });
      }
      
      // Hasher le mot de passe
      const motDePasseHache = await bcrypt.hash(motDePasse, 10);
      
      // Créer le nouvel utilisateur admin
      const nouvelAdmin = new Utilisateur({
        nom,
        email,
        motDePasse: motDePasseHache,
        telephone, // Inclure le téléphone qui est requis
        role: "Admin" // Utiliser "Admin" avec un A majuscule
      });
      
      await nouvelAdmin.save();
      
      res.status(201).json({
        success: true,
        message: "Admin créé avec succès",
        utilisateur: {
          id: nouvelAdmin._id,
          nom: nouvelAdmin.nom,
          email: nouvelAdmin.email,
          role: nouvelAdmin.role
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'inscription de l'admin",
        error: error.message
      });
    }
  };
// 4. Connexion (Signin)
exports.connexion = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    
    if (!email || !motDePasse) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe sont obligatoires"
      });
    }
    
    // Modification ici: ajout de .select('+motDePasse') pour inclure le mot de passe
    const utilisateur = await Utilisateur.findOne({ email }).select('+motDePasse');
    
    // Vérifier si l'utilisateur existe
    if (!utilisateur) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect"
      });
    }
    
    // Comparer le mot de passe
    const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
    
    if (!motDePasseValide) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect"
      });
    }
    
    // Vérifier si le compte pharmacien est validé
    if (utilisateur.role === 'Pharmacien' && utilisateur.compteValide === false) {
      const token = jwt.sign(
        { id: utilisateur._id, role: utilisateur.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return res.status(200).json({
        success: true,
        message: "Connexion réussie, mais votre compte est en attente de validation par un administrateur",
        compteValide: false,
        token,
        user: {
          id: utilisateur._id,
          email: utilisateur.email,
          role: utilisateur.role,
          username: utilisateur.username,
          compteValide: utilisateur.compteValide
        }
      });
    }
    
    // Générer un token pour un compte validé
    const token = jwt.sign(
      { id: utilisateur._id, role: utilisateur.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(200).json({
      success: true,
      message: "Connexion réussie",
      token,
      user: {
        id: utilisateur._id,
        email: utilisateur.email,
        role: utilisateur.role,
        username: utilisateur.username,
        compteValide: true
      }
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la connexion",
      error: error.message
    });
  }
};
// 5. Mot de passe oublié 
exports.motDePasseOublie = async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "Email requis" 
        });
      }
      
      const utilisateur = await Utilisateur.findOne({ email });
      
      if (!utilisateur) {
        return res.status(404).json({ 
          success: false, 
          message: "Aucun compte trouvé avec cet email" 
        });
      }
      
      // Génération d'un code de confirmation à 5 chiffres
      const confirmationCode = Math.floor(10000 + Math.random() * 90000);
      const codeExpires = Date.now() + 3600000; // 1 heure
      
      utilisateur.resetPasswordToken = confirmationCode.toString();
      utilisateur.resetPasswordExpires = codeExpires;
      await utilisateur.save();
      
      try {
        // Récupérer le nom du site depuis les variables d'environnement
        const websiteName = process.env.WEBSITE_NAME || 'MedHive';
        
        // Envoyer l'email avec le code de confirmation
        const emailResult = await emailService.sendEmail({
          to: email,
          subject: 'Code de confirmation pour réinitialiser votre mot de passe',
          text: `Bonjour ${utilisateur.nom || 'Utilisateur'},\n\nVous avez demandé une réinitialisation de votre mot de passe.\n\nVotre code de confirmation est: ${confirmationCode}\n\nCe code est valide pendant 1 heure.\n\nSi vous n'avez pas demandé cette réinitialisation, ignorez cet email.\n\nCordialement,\nL'équipe ${websiteName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1>Code de confirmation</h1>
              <p>Bonjour ${utilisateur.nom || 'Utilisateur'},</p>
              <p>Vous avez demandé une réinitialisation de votre mot de passe.</p>
              <div style="margin: 30px 0; text-align: center;">
                <h2 style="font-size: 32px; letter-spacing: 5px; background-color: #f4f4f4; padding: 15px; border-radius: 8px;">${confirmationCode}</h2>
              </div>
              <p>Veuillez saisir ce code sur la page de réinitialisation pour continuer.</p>
              <p>Ce code est valide pendant 1 heure.</p>
              <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
              <p>Cordialement,<br>L'équipe ${websiteName}</p>
            </div>
          `
        });
        
        console.log(`Email avec code de confirmation envoyé à ${email}`);
        
        // Ne pas renvoyer le code dans la réponse en production pour des raisons de sécurité
        // Ici nous le faisons pour faciliter le développement
        res.status(200).json({
          success: true,
          message: "Un email avec le code de confirmation a été envoyé",
          // Retirer cette ligne en production
          confirmationCode: confirmationCode,
          previewUrl: emailResult.previewUrl // Ajout du lien de prévisualisation
        });
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email:', emailError);
        res.status(200).json({
          success: true,
          message: "Un problème est survenu lors de l'envoi de l'email, mais le code a été généré",
          // Retirer cette ligne en production
          confirmationCode: confirmationCode
        });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Erreur lors du traitement", 
        error: error.message 
      });
    }
  };

// Fonction pour vérifier le code de confirmation
exports.verifierCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email et code de confirmation requis"
      });
    }
    
    const utilisateur = await Utilisateur.findOne({
      email: email,
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!utilisateur) {
      return res.status(400).json({
        success: false,
        message: "Code invalide ou expiré"
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Code valide",
      userId: utilisateur._id
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du code:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification du code",
      error: error.message
    });
  }
};
// 6. Réinitialisation du mot de passe
// Vérification du token pour l'affichage du formulaire
exports.verifierToken = async (req, res) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Token requis"
        });
      }
      
      const utilisateur = await Utilisateur.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
      
      if (!utilisateur) {
        return res.status(400).json({
          success: false,
          message: "Token invalide ou expiré"
        });
      }
      
      return res.status(200).json({
        success: true,
        message: "Token valide",
        token
      });
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la vérification du token",
        error: error.message
      });
    }
  };
  // Réinitialisation du mot de passe
  exports.reinitialiserMotDePasse = async (req, res) => {
    try {
      const { token, nouveauMotDePasse } = req.body;
      
      if (!token || !nouveauMotDePasse) {
        return res.status(400).json({
          success: false,
          message: "Token et nouveau mot de passe requis"
        });
      }
      
      const utilisateur = await Utilisateur.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
      
      if (!utilisateur) {
        return res.status(400).json({
          success: false,
          message: "Token invalide ou expiré"
        });
      }
      
      utilisateur.motDePasse = await bcrypt.hash(nouveauMotDePasse, 10);
      utilisateur.resetPasswordToken = undefined;
      utilisateur.resetPasswordExpires = undefined;
      await utilisateur.save();
      
      // Envoyer un email de confirmation
      try {
        const websiteName = process.env.WEBSITE_NAME || 'MedHive';
        
        await emailService.sendEmail({
          to: utilisateur.email,
          subject: 'Votre mot de passe a été modifié',
          text: `Bonjour ${utilisateur.nom || 'Utilisateur'},\n\nCeci est une confirmation que le mot de passe de votre compte ${utilisateur.email} vient d'être modifié.\n\nSi vous n'avez pas effectué cette modification, veuillez nous contacter immédiatement.\n\nCordialement,\nL'équipe ${websiteName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1>Mot de passe modifié</h1>
              <p>Bonjour ${utilisateur.nom || 'Utilisateur'},</p>
              <p>Ceci est une confirmation que le mot de passe de votre compte ${utilisateur.email} vient d'être modifié.</p>
              <p>Si vous n'avez pas effectué cette modification, veuillez nous contacter immédiatement.</p>
              <p>Cordialement,<br>L'équipe ${websiteName}</p>
            </div>
          `
        });
        
        console.log(`Email de confirmation de changement de mot de passe envoyé à ${utilisateur.email}`);
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
        // L'erreur d'email ne doit pas empêcher la réinitialisation du mot de passe
      }
      
      res.status(200).json({
        success: true,
        message: "Mot de passe réinitialisé avec succès"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la réinitialisation",
        error: error.message
      });
    }
  };
  // Déconnexion (pas de modification nécessaire)
  exports.deconnexion = (req, res) => {
    try {
      res.status(200).json({
        message: "Déconnexion réussie",
        token: ""
      });
    } catch (error) {
      res.status(500).json({
        message: "Erreur lors de la déconnexion",
        error: error.message
      });
    }
  };

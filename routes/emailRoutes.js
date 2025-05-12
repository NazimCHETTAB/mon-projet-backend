const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

// Route pour tester l'envoi d'emails
router.post('/api/email/test', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({
        success: false,
        message: "Les champs destinataire, sujet et contenu sont requis"
      });
    }
    
    const result = await emailService.sendEmail({
      to,
      subject,
      text,
      html
    });
    
    res.json({
      success: true,
      message: "Email envoyé avec succès",
      data: result
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi du test email:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi de l'email",
      error: error.message
    });
  }
});

// Route pour vérifier la configuration email
router.get('/api/email/status', (req, res) => {
  const isConfigured = !!(process.env.GMAIL_USER && process.env.EMAIL_PASSWORD);
  
  res.json({
    configured: isConfigured,
    emailUser: process.env.GMAIL_USER ? process.env.GMAIL_USER : null
  });
});

module.exports = router;
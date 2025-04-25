// services/emailService.js
const { createTransporter } = require('../config/emailConfig');

async function sendEmail(emailData) {
  const { to, subject, text, html, attachments } = emailData;
  
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${process.env.WEBSITE_NAME}" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`,
      attachments
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email envoyé à ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
}

module.exports = { sendEmail };
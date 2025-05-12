require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const pharmacieRoutes = require('./routes/pharmacieRoutes');

const utilisateurRoutes = require("./routes/utilisateurRoutes");
const produitRoutes = require("./routes/produitRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const emailRoutes = require('./routes/emailRoutes'); 

const app = express();
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors());
app.use('/api/auth', authRoutes);
app.use('/api/pharmacies', pharmacieRoutes);
app.use("/api/utilisateur", utilisateurRoutes);
app.use("/api/produit", produitRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use(emailRoutes);
// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => console.log("Connecté à MongoDB"))
    .catch(err => console.error("Erreur de connexion MongoDB :", err));


//  Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Serveur démarré sur http://localhost:${PORT}`));

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const utilisateurRoutes = require('./routes/utilisateurRoutes');
const pharmacieRoutes = require('./routes/pharmacieRoutes');
const medicamentRoutes = require('./routes/medicamentRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');

// Initialize app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to database
connectDB();

// Routes
app.use('/api/utilisateurs', utilisateurRoutes);
app.use('/api/pharmacies', pharmacieRoutes);
app.use('/api/medicaments', medicamentRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));
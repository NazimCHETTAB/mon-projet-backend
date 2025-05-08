const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const cookieParser = require('cookie-parser');
const cors = require('cors');
<<<<<<< HEAD
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// DB Connection
const connectDB = require('./config/db');
connectDB();

// Route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const pharmacieRoutes = require('./routes/pharmacieRoutes');
const medicamentRoutes = require('./routes/medicamentRoutes');
const adminRoutes = require('./routes/adminRoutes');

=======
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const authRoutes = require('./routes/authRoutes');
const pharmacieRoutes = require('./routes/pharmacieRoutes');
const chatbotRoutes = require("./routes/chatbotRoutes");
const utilisateurRoutes = require("./routes/utilisateurRoutes");
const produitRoutes = require("./routes/produitRoutes");
// Ajoutez ces lignes après vos autres imports
const emailRoutes = require('./routes/emailRoutes'); 
//const Utilisateur = require('./models/utilisateur');
>>>>>>> bf15775c51ff21f57620fe8b157ed20f0f428711
const app = express();

// Create upload directories if they don't exist
const dirs = ['./uploads', './uploads/certificates', './uploads/medicaments'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Body parser
app.use(express.json());

<<<<<<< HEAD
// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Enable CORS
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

// Set static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pharmacies', pharmacieRoutes);
app.use('/api/medicaments', medicamentRoutes);
app.use('/api/admin', adminRoutes);

// Basic route for testing
app.get('/', (req, res) => {
    res.json({ message: 'API is running...' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`.red);
    // Close server & exit process
    process.exit(1);
});
=======

// Ajoutez cette ligne après vos autres app.use()



app.use(cors());
app.use('/api/auth', authRoutes);
app.use('/api/pharmacies', pharmacieRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/utilisateur", utilisateurRoutes);
app.use("/api/produit", produitRoutes);
//app.use('/api/email', emailRoutes);
app.use(emailRoutes);
// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => console.log("Connecté à MongoDB"))
    .catch(err => console.error("Erreur de connexion MongoDB :", err));


// 📌 Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));
>>>>>>> bf15775c51ff21f57620fe8b157ed20f0f428711

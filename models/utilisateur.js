const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema
const utilisateurSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  motDePasse: {
    type: String,
    required: true,
    select: false // Never return password in queries by default
  },
  telephone: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['Vendeur', 'Pharmacien', 'Admin'],
    required: true,
    default: 'Vendeur' // Default role if not specified
  },
  username: {
    type: String,
    trim: true,
    default: function() {
      return this.email ? this.email.split('@')[0] : '';
    }
  },
  nomPharmacie: {
    type: String,
    trim: true,
    required: function() {
      return this.role === 'Pharmacien';
    }
  },
  licence: {
    type: String,
    trim: true,
    required: function() {
      return this.role === 'Pharmacien';
    }
  },
  localisation: {
    type: String,
    trim: true,
    required: function() {
      return this.role === 'Pharmacien';
    }
  },
  tempsDeTravail: {
    type: String,
    trim: true
  },
  photoProfil: {
    type: String,
    trim: true,
    default: function() {
      return this.nomPharmacie 
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(this.nomPharmacie)}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(this.username || 'U')}`;
    }
  },
  compteValide: {
    type: Boolean,
    default: function() {
      return this.role === 'Pharmacien' ? false : true;
    }
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    select: false
  }
}, {
  timestamps: true,
  collection: 'utilisateurs', // Explicit collection name
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
utilisateurSchema.index({ email: 1 }, { unique: true });
utilisateurSchema.index({ role: 1 });
utilisateurSchema.index({ compteValide: 1 });
utilisateurSchema.index({ nomPharmacie: 'text' });

// Create and export the model
const Utilisateur = mongoose.model('Utilisateur', utilisateurSchema);
module.exports = Utilisateur;





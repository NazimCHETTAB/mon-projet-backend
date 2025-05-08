const mongoose = require('mongoose');

const MedicamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Please add a price']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    imagePath: {
        type: String,
        default: 'no-image.jpg'
    },
    pharmacie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pharmacie',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Medicament', MedicamentSchema);
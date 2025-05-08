const mongoose = require('mongoose');

const PharmacieSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        type: String,
        required: [true, 'Please add a location']
    },
    address: {
        type: String,
        required: [true, 'Please add an address']
    },
    socialMedia: {
        instagram: String,
        facebook: String,
        linkedin: String
    },
    certificatePath: {
        type: String,
        required: [true, 'Please upload your certificate']
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Pharmacie', PharmacieSchema);
const Pharmacie = require('../models/Pharmacie');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');

// @desc    Complete pharmacist profile
// @route   POST /api/pharmacies
// @access  Private (Pharmacist only)
const completeProfile = asyncHandler(async(req, res) => {
    // Check if pharmacist already has a profile
    const existingProfile = await Pharmacie.findOne({ user: req.user.id });

    if (existingProfile) {
        return res.status(400).json({
            success: false,
            message: 'Pharmacist profile already exists'
        });
    }

    // Create pharmacist profile
    const pharmacie = await Pharmacie.create({
        user: req.user.id,
        location: req.body.location,
        address: req.body.address,
        socialMedia: {
            instagram: req.body.instagram,
            facebook: req.body.facebook,
            linkedin: req.body.linkedin
        },
        certificatePath: req.file.path
    });

    res.status(201).json({
        success: true,
        data: pharmacie,
        message: 'Profile submitted for approval'
    });
});

// @desc    Get all pharmacies
// @route   GET /api/pharmacies
// @access  Public
const getPharmacies = asyncHandler(async(req, res) => {
    // Only get approved pharmacies for public
    const query = { isApproved: true };

    const pharmacies = await Pharmacie.find(query).populate({
        path: 'user',
        select: 'firstName familyName email phoneNumber'
    });

    res.status(200).json({
        success: true,
        count: pharmacies.length,
        data: pharmacies
    });
});

// @desc    Get single pharmacy
// @route   GET /api/pharmacies/:id
// @access  Public
const getPharmacy = asyncHandler(async(req, res) => {
    const pharmacie = await Pharmacie.findById(req.params.id).populate({
        path: 'user',
        select: 'firstName familyName email phoneNumber'
    });

    if (!pharmacie) {
        return res.status(404).json({
            success: false,
            message: `No pharmacy found with the id of ${req.params.id}`
        });
    }

    // Only show approved pharmacies to public
    if (!pharmacie.isApproved && req.user && req.user.role !== 'admin') {
        return res.status(404).json({
            success: false,
            message: `No pharmacy found with the id of ${req.params.id}`
        });
    }

    res.status(200).json({
        success: true,
        data: pharmacie
    });
});

// @desc    Update pharmacy
// @route   PUT /api/pharmacies/:id
// @access  Private (Owner or Admin)
const updatePharmacy = asyncHandler(async(req, res) => {
    let pharmacie = await Pharmacie.findById(req.params.id);

    if (!pharmacie) {
        return res.status(404).json({
            success: false,
            message: `No pharmacy found with the id of ${req.params.id}`
        });
    }

    // Make sure user is pharmacy owner or admin
    if (pharmacie.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(401).json({
            success: false,
            message: `User ${req.user.id} is not authorized to update this pharmacy`
        });
    }

    const fieldsToUpdate = {
        location: req.body.location,
        address: req.body.address,
        socialMedia: {
            instagram: req.body.instagram,
            facebook: req.body.facebook,
            linkedin: req.body.linkedin
        }
    };

    pharmacie = await Pharmacie.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: pharmacie
    });
});

// @desc    Update pharmacy certificate
// @route   PUT /api/pharmacies/:id/certificate
// @access  Private (Owner or Admin)
const updateCertificate = asyncHandler(async(req, res) => {
    let pharmacie = await Pharmacie.findById(req.params.id);

    if (!pharmacie) {
        return res.status(404).json({
            success: false,
            message: `No pharmacy found with the id of ${req.params.id}`
        });
    }

    // Make sure user is pharmacy owner or admin
    if (pharmacie.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(401).json({
            success: false,
            message: `User ${req.user.id} is not authorized to update this pharmacy`
        });
    }

    // Delete old certificate
    if (fs.existsSync(pharmacie.certificatePath)) {
        fs.unlinkSync(pharmacie.certificatePath);
    }

    // Update with new certificate
    pharmacie = await Pharmacie.findByIdAndUpdate(req.params.id, { certificatePath: req.file.path, isApproved: false }, // Reset approval status
        { new: true }
    );

    res.status(200).json({
        success: true,
        data: pharmacie,
        message: 'Certificate updated and submitted for re-approval'
    });
});

// @desc    Get my pharmacy profile
// @route   GET /api/pharmacies/me
// @access  Private (Pharmacist only)
const getMyPharmacy = asyncHandler(async(req, res) => {
    const pharmacie = await Pharmacie.findOne({ user: req.user.id });

    if (!pharmacie) {
        return res.status(404).json({
            success: false,
            message: 'No pharmacy profile found'
        });
    }

    res.status(200).json({
        success: true,
        data: pharmacie
    });
});

module.exports = {
    completeProfile,
    getPharmacies,
    getPharmacy,
    updatePharmacy,
    updateCertificate,
    getMyPharmacy
};
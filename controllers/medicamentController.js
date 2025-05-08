const Medicament = require('../models/Medicament');
const Pharmacie = require('../models/Pharmacie');
const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');

// @desc    Create new medicament
// @route   POST /api/medicaments
// @access  Private (Approved Pharmacist only)
const createMedicament = asyncHandler(async(req, res) => {
    // Check if pharmacist has an approved profile
    const pharmacie = await Pharmacie.findOne({ user: req.user.id, isApproved: true });

    if (!pharmacie) {
        return res.status(403).json({
            success: false,
            message: 'You need an approved pharmacy profile to add medicaments'
        });
    }

    // Create medicament
    const medicamentData = {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        pharmacie: pharmacie._id,
        user: req.user.id
    };

    // Add image path if provided
    if (req.file) {
        medicamentData.imagePath = req.file.path;
    }

    const medicament = await Medicament.create(medicamentData);

    res.status(201).json({
        success: true,
        data: medicament
    });
});

// @desc    Get all medicaments
// @route   GET /api/medicaments
// @access  Public
const getMedicaments = asyncHandler(async(req, res) => {
    let query;

    // Copy req.query
    const reqQuery = {...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Medicament.find(JSON.parse(queryStr))
        .populate({
            path: 'pharmacie',
            select: 'location address'
        })
        .populate({
            path: 'user',
            select: 'firstName familyName email phoneNumber'
        });

    // Select fields
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Medicament.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const medicaments = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
        pagination.next = {
            page: page + 1,
            limit
        };
    }

    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        };
    }

    res.status(200).json({
        success: true,
        count: medicaments.length,
        pagination,
        data: medicaments
    });
});

// @desc    Get single medicament
// @route   GET /api/medicaments/:id
// @access  Public
const getMedicament = asyncHandler(async(req, res) => {
    const medicament = await Medicament.findById(req.params.id)
        .populate({
            path: 'pharmacie',
            select: 'location address'
        })
        .populate({
            path: 'user',
            select: 'firstName familyName email phoneNumber'
        });

    if (!medicament) {
        return res.status(404).json({
            success: false,
            message: `No medicament found with the id of ${req.params.id}`
        });
    }

    res.status(200).json({
        success: true,
        data: medicament
    });
});

// @desc    Update medicament
// @route   PUT /api/medicaments/:id
// @access  Private (Owner or Admin)
const updateMedicament = asyncHandler(async(req, res) => {
    let medicament = await Medicament.findById(req.params.id);

    if (!medicament) {
        return res.status(404).json({
            success: false,
            message: `No medicament found with the id of ${req.params.id}`
        });
    }

    // Make sure user is medicament owner or admin
    if (medicament.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(401).json({
            success: false,
            message: `User ${req.user.id} is not authorized to update this medicament`
        });
    }

    const fieldsToUpdate = {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description
    };

    medicament = await Medicament.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: medicament
    });
});

// @

// @desc    Update medicament image
// @route   PUT /api/medicaments/:id/image
// @access  Private (Owner or Admin)
const updateMedicamentImage = asyncHandler(async(req, res) => {
    let medicament = await Medicament.findById(req.params.id);

    if (!medicament) {
        return res.status(404).json({
            success: false,
            message: `No medicament found with the id of ${req.params.id}`
        });
    }

    // Make sure user is medicament owner or admin
    if (medicament.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(401).json({
            success: false,
            message: `User ${req.user.id} is not authorized to update this medicament`
        });
    }

    // Delete old image if it exists and is not the default
    if (medicament.imagePath !== 'no-image.jpg' && fs.existsSync(medicament.imagePath)) {
        fs.unlinkSync(medicament.imagePath);
    }

    // Update with new image
    medicament = await Medicament.findByIdAndUpdate(req.params.id, { imagePath: req.file.path }, { new: true });

    res.status(200).json({
        success: true,
        data: medicament
    });
});

// @desc    Delete medicament
// @route   DELETE /api/medicaments/:id
// @access  Private (Owner or Admin)
const deleteMedicament = asyncHandler(async(req, res) => {
    const medicament = await Medicament.findById(req.params.id);

    if (!medicament) {
        return res.status(404).json({
            success: false,
            message: `No medicament found with the id of ${req.params.id}`
        });
    }

    // Make sure user is medicament owner or admin
    if (medicament.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(401).json({
            success: false,
            message: `User ${req.user.id} is not authorized to delete this medicament`
        });
    }

    // Delete the image file if it exists and is not the default
    if (medicament.imagePath !== 'no-image.jpg' && fs.existsSync(medicament.imagePath)) {
        fs.unlinkSync(medicament.imagePath);
    }

    await medicament.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Search medicaments by name
// @route   GET /api/medicaments/search
// @access  Public
const searchMedicaments = asyncHandler(async(req, res) => {
    const { name } = req.query;

    if (!name) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a search term'
        });
    }

    // Search using regex for partial matches
    const medicaments = await Medicament.find({
        name: { $regex: name, $options: 'i' }
    }).populate({
        path: 'pharmacie',
        select: 'location address'
    }).populate({
        path: 'user',
        select: 'firstName familyName email phoneNumber'
    });

    res.status(200).json({
        success: true,
        count: medicaments.length,
        data: medicaments
    });
});

module.exports = {
    createMedicament,
    getMedicaments,
    getMedicament,
    updateMedicament,
    updateMedicamentImage,
    deleteMedicament,
    searchMedicaments
};
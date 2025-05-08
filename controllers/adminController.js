const User = require('../models/User');
const Pharmacie = require('../models/Pharmacie');
const Medicament = require('../models/Medicament');
const asyncHandler = require('express-async-handler');
const fs = require('fs');

// @desc    Get all pending pharmacist approvals
// @route   GET /api/admin/approvals
// @access  Private (Admin only)
const getPendingApprovals = asyncHandler(async(req, res) => {
    const pendingPharmacies = await Pharmacie.find({ isApproved: false })
        .populate({
            path: 'user',
            select: 'firstName familyName email phoneNumber username'
        });

    res.status(200).json({
        success: true,
        count: pendingPharmacies.length,
        data: pendingPharmacies
    });
});

// @desc    Approve pharmacist
// @route   PUT /api/admin/approvals/:id/approve
// @access  Private (Admin only)
const approvePharmacist = asyncHandler(async(req, res) => {
    const pharmacie = await Pharmacie.findById(req.params.id);

    if (!pharmacie) {
        return res.status(404).json({
            success: false,
            message: `No pharmacy found with the id of ${req.params.id}`
        });
    }

    // Update pharmacy and user approval status
    pharmacie.isApproved = true;
    await pharmacie.save();

    // Update the user's approval status
    await User.findByIdAndUpdate(pharmacie.user, { isApproved: true });

    res.status(200).json({
        success: true,
        data: pharmacie,
        message: 'Pharmacist approved successfully'
    });
});

// @desc    Reject pharmacist
// @route   PUT /api/admin/approvals/:id/reject
// @access  Private (Admin only)
const rejectPharmacist = asyncHandler(async(req, res) => {
    const pharmacie = await Pharmacie.findById(req.params.id);

    if (!pharmacie) {
        return res.status(404).json({
            success: false,
            message: `No pharmacy found with the id of ${req.params.id}`
        });
    }

    // Delete certificate file if it exists
    if (fs.existsSync(pharmacie.certificatePath)) {
        fs.unlinkSync(pharmacie.certificatePath);
    }

    // Delete pharmacy record
    await pharmacie.deleteOne();

    // You can also delete the user or just leave them as unapproved
    // For this example, we'll just leave the user as unapproved

    res.status(200).json({
        success: true,
        message: 'Pharmacist application rejected successfully'
    });
});

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getStats = asyncHandler(async(req, res) => {
    const totalUsers = await User.countDocuments();
    const visitors = await User.countDocuments({ role: 'visitor' });
    const pharmacists = await User.countDocuments({ role: 'pharmacist' });
    const approvedPharmacists = await User.countDocuments({
        role: 'pharmacist',
        isApproved: true
    });
    const pendingPharmacists = await User.countDocuments({
        role: 'pharmacist',
        isApproved: false
    });
    const totalMedicaments = await Medicament.countDocuments();

    res.status(200).json({
        success: true,
        data: {
            totalUsers,
            visitors,
            pharmacists,
            approvedPharmacists,
            pendingPharmacists,
            totalMedicaments
        }
    });
});

// @desc    Delete user and all related data
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = asyncHandler(async(req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: `No user found with the id of ${req.params.id}`
        });
    }

    // Check if pharmacist and delete related data
    if (user.role === 'pharmacist') {
        const pharmacie = await Pharmacie.findOne({ user: user._id });

        if (pharmacie) {
            // Delete certificate file
            if (fs.existsSync(pharmacie.certificatePath)) {
                fs.unlinkSync(pharmacie.certificatePath);
            }

            // Delete pharmacy
            await pharmacie.deleteOne();

            // Delete all medicaments related to this pharmacy
            const medicaments = await Medicament.find({ user: user._id });

            for (const medicament of medicaments) {
                // Delete medicament image
                if (medicament.imagePath !== 'no-image.jpg' && fs.existsSync(medicament.imagePath)) {
                    fs.unlinkSync(medicament.imagePath);
                }

                // Delete medicament
                await medicament.deleteOne();
            }
        }
    }

    // Delete user
    await user.deleteOne();

    res.status(200).json({
        success: true,
        message: 'User and related data deleted successfully'
    });
});

module.exports = {
    getPendingApprovals,
    approvePharmacist,
    rejectPharmacist,
    getStats,
    deleteUser
};
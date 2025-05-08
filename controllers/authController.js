const User = require('../models/User');
const Pharmacie = require('../models/Pharmacie');
const asyncHandler = require('express-async-handler');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async(req, res) => {
    const { username, firstName, familyName, email, password, phoneNumber, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({
            success: false,
            message: 'User already exists'
        });
    }

    // Create user
    const user = await User.create({
        username,
        firstName,
        familyName,
        email,
        password,
        phoneNumber,
        role
    });

    if (user) {
        // If role is pharmacist, create a placeholder in Pharmacie model
        if (role === 'pharmacist') {
            res.status(201).json({
                success: true,
                message: 'User registered. Please complete your pharmacist profile.',
                data: {
                    _id: user._id,
                    username: user.username,
                    firstName: user.firstName,
                    familyName: user.familyName,
                    email: user.email,
                    role: user.role,
                    isApproved: user.isApproved
                }
            });
        } else {
            // Send token for direct login for visitors
            sendTokenResponse(user, 201, res);
        }
    } else {
        res.status(400).json({
            success: false,
            message: 'Invalid user data'
        });
    }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async(req, res) => {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Please provide an email and password'
        });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }

    // Check if user is approved (for pharmacists)
    if (user.role === 'pharmacist' && !user.isApproved) {
        return res.status(401).json({
            success: false,
            message: 'Your account is pending approval'
        });
    }

    sendTokenResponse(user, 200, res);
});

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
const logout = asyncHandler(async(req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000), // 10 seconds
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: 'User logged out successfully'
    });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async(req, res) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        data: user
    });
});

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            user: {
                _id: user._id,
                username: user.username,
                firstName: user.firstName,
                familyName: user.familyName,
                email: user.email,
                role: user.role,
                isApproved: user.isApproved
            }
        });
};

module.exports = {
    register,
    login,
    logout,
    getMe
};
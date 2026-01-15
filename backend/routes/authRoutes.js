import express from 'express';
import authService from '../services/authService.js';
import cartService from '../services/cartService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { protect } from '../middleware/auth.js';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js';
import {
    registerValidator,
    loginValidator,
    forgotPasswordValidator,
    resetPasswordValidator
} from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authLimiter, registerValidator, asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName } = req.body;

    const result = await authService.register(
        { email, password, firstName, lastName },
        req.ip,
        req.get('user-agent')
    );

    // Transfer guest cart if session exists
    if (req.cookies?.sessionId) {
        await cartService.transferToUser(result.user._id, req.cookies.sessionId);
    }

    // Set cookies - sameSite: 'none' required for cross-origin (Vercel to Render)
    res.cookie('token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
        success: true,
        message: 'Registration successful. Please verify your email.',
        data: {
            user: result.user,
            accessToken: result.accessToken,
            requiresVerification: result.requiresVerification
        }
    });
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authLimiter, loginValidator, asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await authService.login(
        email,
        password,
        req.ip,
        req.get('user-agent')
    );

    // Merge guest cart if session exists
    if (req.cookies?.sessionId) {
        await cartService.mergeGuestCart(result.user._id, req.cookies.sessionId);
    }

    // Set cookies - sameSite: 'none' required for cross-origin (Vercel to Render)
    res.cookie('token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: result.user,
            accessToken: result.accessToken
        }
    });
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', protect, asyncHandler(async (req, res) => {
    await authService.logout(
        req.user._id,
        req.ip,
        req.get('user-agent')
    );

    // Clear cookie
    res.clearCookie('token');

    res.json({
        success: true,
        message: 'Logout successful'
    });
}));

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            message: 'Refresh token required'
        });
    }

    const result = await authService.refreshToken(refreshToken);

    // Update cookie - sameSite: 'none' required for cross-origin (Vercel to Render)
    res.cookie('token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
        success: true,
        data: {
            accessToken: result.accessToken,
            user: result.user
        }
    });
}));

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', protect, asyncHandler(async (req, res) => {
    res.json({
        success: true,
        data: {
            user: req.user
        }
    });
}));

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with token
 * @access  Public
 */
router.post('/verify-email', asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({
            success: false,
            message: 'Verification token required'
        });
    }

    const user = await authService.verifyEmail(token);

    res.json({
        success: true,
        message: 'Email verified successfully',
        data: { user }
    });
}));

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend-verification', authLimiter, asyncHandler(async (req, res) => {
    const { email } = req.body;

    const result = await authService.resendVerificationEmail(email);

    res.json({
        success: true,
        message: result.message
    });
}));

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidator, asyncHandler(async (req, res) => {
    const { email } = req.body;

    const result = await authService.forgotPassword(email, req.ip);

    res.json({
        success: true,
        message: result.message
    });
}));

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', resetPasswordValidator, asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    const result = await authService.resetPassword(token, password, req.ip);

    res.json({
        success: true,
        message: result.message
    });
}));

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (authenticated)
 * @access  Private
 */
router.post('/change-password', protect, asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const result = await authService.changePassword(
        req.user._id,
        currentPassword,
        newPassword
    );

    // Clear cookie (force re-login)
    res.clearCookie('token');

    res.json({
        success: true,
        message: result.message
    });
}));

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', protect, asyncHandler(async (req, res) => {
    const { firstName, lastName, phone } = req.body;

    const user = req.user;

    if (!user.profile) {
        user.profile = {};
    }

    if (firstName !== undefined) user.profile.firstName = firstName;
    if (lastName !== undefined) user.profile.lastName = lastName;
    if (phone !== undefined) user.profile.phone = phone;

    await user.save();

    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
    });
}));

/**
 * @route   POST /api/auth/addresses
 * @desc    Add a new address
 * @access  Private
 */
router.post('/addresses', protect, asyncHandler(async (req, res) => {
    const addressData = req.body;

    const user = req.user;

    if (!user.profile) {
        user.profile = {};
    }
    if (!user.profile.addresses) {
        user.profile.addresses = [];
    }

    // If this is first address or marked as default, set it as default
    if (user.profile.addresses.length === 0 || addressData.isDefault) {
        // Reset other defaults
        user.profile.addresses.forEach(addr => {
            if (addr.type === addressData.type) {
                addr.isDefault = false;
            }
        });
        addressData.isDefault = true;
    }

    user.profile.addresses.push(addressData);
    await user.save();

    res.status(201).json({
        success: true,
        message: 'Address added successfully',
        data: { addresses: user.profile.addresses }
    });
}));

/**
 * @route   DELETE /api/auth/addresses/:addressId
 * @desc    Delete an address
 * @access  Private
 */
router.delete('/addresses/:addressId', protect, asyncHandler(async (req, res) => {
    const { addressId } = req.params;

    const user = req.user;

    if (!user.profile?.addresses) {
        return res.status(404).json({
            success: false,
            message: 'Address not found'
        });
    }

    user.profile.addresses = user.profile.addresses.filter(
        addr => addr._id.toString() !== addressId
    );

    await user.save();

    res.json({
        success: true,
        message: 'Address deleted successfully',
        data: { addresses: user.profile.addresses }
    });
}));

/**
 * @route   PUT /api/auth/addresses/:addressId
 * @desc    Update an address
 * @access  Private
 */
router.put('/addresses/:addressId', protect, asyncHandler(async (req, res) => {
    const { addressId } = req.params;
    const addressData = req.body;

    const user = req.user;

    if (!user.profile?.addresses) {
        return res.status(404).json({
            success: false,
            message: 'Address not found'
        });
    }

    const addressIndex = user.profile.addresses.findIndex(
        addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Address not found'
        });
    }

    // If setting as default, reset other defaults
    if (addressData.isDefault) {
        user.profile.addresses.forEach(addr => {
            addr.isDefault = false;
        });
    }

    // Update the address properties
    const existingAddress = user.profile.addresses[addressIndex];
    Object.assign(existingAddress, {
        firstName: addressData.firstName || existingAddress.firstName,
        lastName: addressData.lastName || existingAddress.lastName,
        street: addressData.street || existingAddress.street,
        city: addressData.city || existingAddress.city,
        state: addressData.state || existingAddress.state,
        postalCode: addressData.postalCode || existingAddress.postalCode,
        country: addressData.country || existingAddress.country,
        phone: addressData.phone || existingAddress.phone,
        isDefault: addressData.isDefault ?? existingAddress.isDefault
    });

    await user.save();

    res.json({
        success: true,
        message: 'Address updated successfully',
        data: { addresses: user.profile.addresses }
    });
}));

export default router;


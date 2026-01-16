import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, AuditLog } from '../models/index.js';
import { createError } from '../middleware/errorHandler.js';
import { AUDIT_ACTIONS, USER_ROLES } from '../config/constants.js';
import emailService from './emailService.js';

/**
 * Authentication Service
 * Handles user registration, login, password management, and token generation
 */
class AuthService {
    /**
     * Generate JWT access token
     */
    generateAccessToken(userId) {
        return jwt.sign(
            { id: userId },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
    }

    /**
     * Generate refresh token
     */
    generateRefreshToken(userId) {
        return jwt.sign(
            { id: userId },
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
        );
    }

    /**
     * Generate secure random token
     */
    generateRandomToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Hash token for storage
     */
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    /**
     * Register a new user
     */
    async register(userData, ipAddress = null, userAgent = null) {
        const { email, password, firstName, lastName, phone } = userData;

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw createError.conflict('An account with this email already exists');
        }

        // Create verification token
        const verificationToken = this.generateRandomToken();
        const hashedToken = this.hashToken(verificationToken);

        // Create user
        const user = new User({
            email: email.toLowerCase(),
            password,
            profile: {
                firstName,
                lastName,
                phone: phone || undefined
            },
            verificationToken: hashedToken,
            verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            status: 'pending'
        });

        await user.save();

        // Send verification email
        try {
            await emailService.sendVerificationEmail(user.email, verificationToken, user.fullName);
        } catch (error) {
            console.error('Failed to send verification email:', error);
            // Don't throw - user is still created
        }

        // Log action
        await AuditLog.log({
            action: AUDIT_ACTIONS.USER_REGISTER,
            actor: user._id,
            resourceType: 'user',
            resourceId: user._id,
            resourceName: user.email,
            ipAddress,
            userAgent
        });

        // Generate tokens
        const accessToken = this.generateAccessToken(user._id);
        const refreshToken = this.generateRefreshToken(user._id);

        // Save refresh token
        user.refreshToken = this.hashToken(refreshToken);
        await user.save();

        return {
            user: user.toJSON(),
            accessToken,
            refreshToken,
            requiresVerification: true
        };
    }

    /**
     * Login user
     */
    async login(email, password, ipAddress = null, userAgent = null) {
        // Find user with password
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            throw createError.unauthorized('Invalid email or password');
        }

        // Check if account is locked
        if (user.isLocked) {
            const lockRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
            throw createError.forbidden(
                `Account is locked. Please try again in ${lockRemaining} minutes.`
            );
        }

        // Verify password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            await user.incrementLoginAttempts();
            throw createError.unauthorized('Invalid email or password');
        }

        // Check if account is blocked
        if (user.status === 'blocked') {
            throw createError.forbidden('Your account has been blocked. Please contact support.');
        }

        // Reset login attempts on successful login
        await user.resetLoginAttempts();

        // Generate tokens
        const accessToken = this.generateAccessToken(user._id);
        const refreshToken = this.generateRefreshToken(user._id);

        // Save refresh token
        user.refreshToken = this.hashToken(refreshToken);
        await user.save();

        // Log action
        await AuditLog.log({
            action: AUDIT_ACTIONS.USER_LOGIN,
            actor: user._id,
            resourceType: 'user',
            resourceId: user._id,
            resourceName: user.email,
            ipAddress,
            userAgent
        });

        return {
            user: user.toJSON(),
            accessToken,
            refreshToken
        };
    }

    /**
     * Logout user
     */
    async logout(userId, ipAddress = null, userAgent = null) {
        const user = await User.findById(userId);

        if (user) {
            user.refreshToken = undefined;
            await user.save();

            await AuditLog.log({
                action: AUDIT_ACTIONS.USER_LOGOUT,
                actor: userId,
                resourceType: 'user',
                resourceId: userId,
                resourceName: user.email,
                ipAddress,
                userAgent
            });
        }

        return true;
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
            );

            const user = await User.findById(decoded.id);

            if (!user || user.refreshToken !== this.hashToken(refreshToken)) {
                throw createError.unauthorized('Invalid refresh token');
            }

            if (user.status === 'blocked') {
                throw createError.forbidden('Account is blocked');
            }

            const newAccessToken = this.generateAccessToken(user._id);

            return {
                accessToken: newAccessToken,
                user: user.toJSON()
            };
        } catch (error) {
            throw createError.unauthorized('Invalid or expired refresh token');
        }
    }

    /**
     * Verify email
     */
    async verifyEmail(token) {
        const hashedToken = this.hashToken(token);

        const user = await User.findOne({
            verificationToken: hashedToken,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            throw createError.badRequest('Invalid or expired verification token');
        }

        user.emailVerified = true;
        user.status = 'active';
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;

        await user.save();

        return user.toJSON();
    }

    /**
     * Resend verification email
     */
    async resendVerificationEmail(email) {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Don't reveal if user exists
            return { message: 'If an account exists, a verification email has been sent.' };
        }

        if (user.emailVerified) {
            throw createError.badRequest('Email is already verified');
        }

        const verificationToken = this.generateRandomToken();
        user.verificationToken = this.hashToken(verificationToken);
        user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await user.save();

        await emailService.sendVerificationEmail(user.email, verificationToken, user.fullName);

        return { message: 'Verification email sent' };
    }

    /**
     * Request password reset
     */
    async forgotPassword(email, ipAddress = null) {
        const user = await User.findOne({ email: email.toLowerCase() });

        // Always return success to prevent user enumeration
        if (!user) {
            return { message: 'If an account exists, a password reset email has been sent.' };
        }

        const resetToken = this.generateRandomToken();
        user.resetPasswordToken = this.hashToken(resetToken);
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await user.save();

        await emailService.sendPasswordResetEmail(user.email, resetToken, user.fullName);

        await AuditLog.log({
            action: AUDIT_ACTIONS.PASSWORD_RESET,
            actor: user._id,
            resourceType: 'user',
            resourceId: user._id,
            resourceName: user.email,
            details: { type: 'requested' },
            ipAddress
        });

        return { message: 'If an account exists, a password reset email has been sent.' };
    }

    /**
     * Reset password
     */
    async resetPassword(token, newPassword, ipAddress = null) {
        const hashedToken = this.hashToken(token);

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            throw createError.badRequest('Invalid or expired reset token');
        }

        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.refreshToken = undefined; // Invalidate all sessions

        await user.save();

        await AuditLog.log({
            action: AUDIT_ACTIONS.PASSWORD_RESET,
            actor: user._id,
            resourceType: 'user',
            resourceId: user._id,
            resourceName: user.email,
            details: { type: 'completed' },
            ipAddress
        });

        return { message: 'Password reset successful' };
    }

    /**
     * Change password (authenticated user)
     */
    async changePassword(userId, currentPassword, newPassword) {
        const user = await User.findById(userId).select('+password');

        if (!user) {
            throw createError.notFound('User not found');
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            throw createError.unauthorized('Current password is incorrect');
        }

        user.password = newPassword;
        user.refreshToken = undefined; // Invalidate all sessions

        await user.save();

        return { message: 'Password changed successfully' };
    }

    /**
     * Create admin user (super admin only)
     */
    async createAdmin(adminData, createdBy) {
        const { email, password, firstName, lastName, role = USER_ROLES.ADMIN } = adminData;

        // Validate role
        if (![USER_ROLES.ADMIN, USER_ROLES.STAFF].includes(role)) {
            throw createError.badRequest('Invalid admin role');
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw createError.conflict('An account with this email already exists');
        }

        const admin = new User({
            email: email.toLowerCase(),
            password,
            role,
            profile: {
                firstName,
                lastName
            },
            emailVerified: true,
            status: 'active'
        });

        await admin.save();

        await AuditLog.log({
            action: AUDIT_ACTIONS.ADMIN_CREATE,
            actor: createdBy,
            resourceType: 'user',
            resourceId: admin._id,
            resourceName: admin.email,
            details: { role }
        });

        return admin.toJSON();
    }
}

export default new AuthService();

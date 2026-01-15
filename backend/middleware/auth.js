import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { asyncHandler, createError } from './errorHandler.js';
import { USER_ROLES, ROLE_HIERARCHY } from '../config/constants.js';

/**
 * Protect routes - Verify JWT token and attach user to request
 */
export const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // Also check for token in cookies
    else if (req.cookies?.token) {
        token = req.cookies.token;
    }

    if (!token) {
        throw createError.unauthorized('Not authorized. Please log in.');
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            throw createError.unauthorized('User no longer exists.');
        }

        // Check if user is blocked
        if (user.status === 'blocked') {
            throw createError.forbidden('Your account has been blocked. Please contact support.');
        }

        // Check if user is locked out
        if (user.isLocked) {
            throw createError.forbidden('Account temporarily locked due to too many failed login attempts.');
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            throw createError.unauthorized('Invalid or expired token. Please log in again.');
        }
        throw error;
    }
});

/**
 * Optional auth - Attach user to request if token exists, but don't require it
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
        token = req.cookies.token;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (user && user.status !== 'blocked') {
                req.user = user;
            }
        } catch (error) {
            // Token invalid but optional, so continue without user
        }
    }

    next();
});

/**
 * Restrict to specific roles
 */
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(createError.unauthorized('Not authorized. Please log in.'));
        }

        if (!roles.includes(req.user.role)) {
            return next(createError.forbidden('You do not have permission to perform this action.'));
        }

        next();
    };
};

/**
 * Require minimum role level (using role hierarchy)
 */
export const requireMinRole = (minRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(createError.unauthorized('Not authorized. Please log in.'));
        }

        const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
        const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

        if (userLevel < requiredLevel) {
            return next(createError.forbidden('You do not have permission to perform this action.'));
        }

        next();
    };
};

/**
 * Admin only middleware
 */
export const adminOnly = (req, res, next) => {
    if (!req.user) {
        return next(createError.unauthorized('Not authorized. Please log in.'));
    }

    const adminRoles = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN];

    if (!adminRoles.includes(req.user.role)) {
        return next(createError.forbidden('Admin access required.'));
    }

    next();
};

/**
 * Super admin only middleware
 */
export const superAdminOnly = (req, res, next) => {
    if (!req.user) {
        return next(createError.unauthorized('Not authorized. Please log in.'));
    }

    if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
        return next(createError.forbidden('Super admin access required.'));
    }

    next();
};

/**
 * Check if user owns the resource
 */
export const ownsResource = (getResourceUserId) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            throw createError.unauthorized('Not authorized. Please log in.');
        }

        // Admins can access any resource
        if ([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(req.user.role)) {
            return next();
        }

        const resourceUserId = await getResourceUserId(req);

        if (!resourceUserId || !req.user._id.equals(resourceUserId)) {
            throw createError.forbidden('You do not have permission to access this resource.');
        }

        next();
    });
};

/**
 * Verify email is confirmed
 */
export const emailVerified = (req, res, next) => {
    if (!req.user) {
        return next(createError.unauthorized('Not authorized. Please log in.'));
    }

    if (!req.user.emailVerified) {
        return next(createError.forbidden('Please verify your email address to continue.'));
    }

    next();
};

export default {
    protect,
    optionalAuth,
    restrictTo,
    requireMinRole,
    adminOnly,
    superAdminOnly,
    ownsResource,
    emailVerified
};

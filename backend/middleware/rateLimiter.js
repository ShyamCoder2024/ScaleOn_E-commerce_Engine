import rateLimit from 'express-rate-limit';
import { createError } from './errorHandler.js';

/**
 * Default rate limiter for API endpoints
 */
export const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        next(createError.tooManyRequests(options.message.message));
    }
});

/**
 * Strict rate limiter for authentication endpoints
 * In development, allows more attempts. In production, stricter limits.
 */
export const authLimiter = rateLimit({
    windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || (process.env.NODE_ENV === 'production' ? 10 : 100), // More attempts in dev
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again in 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
    skip: (req) => process.env.NODE_ENV !== 'production', // Skip rate limiting entirely in development
    handler: (req, res, next, options) => {
        next(createError.tooManyRequests(options.message.message));
    }
});

/**
 * Rate limiter for password reset
 */
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: {
        success: false,
        message: 'Too many password reset attempts. Please try again in an hour.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        next(createError.tooManyRequests(options.message.message));
    }
});

/**
 * Rate limiter for file uploads
 */
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 uploads per hour
    message: {
        success: false,
        message: 'Too many file uploads. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        next(createError.tooManyRequests(options.message.message));
    }
});

/**
 * Rate limiter for checkout/payment endpoints
 */
export const checkoutLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 10 : 50, // More attempts in dev
    message: {
        success: false,
        message: 'Too many checkout attempts. Please try again in a few minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        next(createError.tooManyRequests(options.message.message));
    }
});

/**
 * Rate limiter for search endpoints
 */
export const searchLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute
    message: {
        success: false,
        message: 'Too many search requests. Please slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        next(createError.tooManyRequests(options.message.message));
    }
});

/**
 * Admin-specific rate limiter (more lenient)
 */
export const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per 15 minutes
    message: {
        success: false,
        message: 'Too many admin requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        next(createError.tooManyRequests(options.message.message));
    }
});

export default {
    apiLimiter,
    authLimiter,
    passwordResetLimiter,
    uploadLimiter,
    checkoutLimiter,
    searchLimiter,
    adminLimiter
};

/**
 * Centralized Error Handler Middleware
 * Provides consistent error responses across the API
 */

// Custom API Error class
export class ApiError extends Error {
    constructor(statusCode, message, errors = []) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// 404 Not Found handler
export const notFound = (req, res, next) => {
    const error = new ApiError(404, `Not Found - ${req.originalUrl}`);
    next(error);
};

// Main error handler
export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errors = err.errors || [];

    // Log error for debugging (in production, use proper logging)
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', {
            message: err.message,
            stack: err.stack,
            statusCode
        });
    }

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
        errors = Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message
        }));
    }

    // Handle Mongoose duplicate key error
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue)[0];
        message = `${field} already exists`;
        errors = [{ field, message: `This ${field} is already in use` }];
    }

    // Handle Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token. Please log in again.';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired. Please log in again.';
    }

    // Handle multer errors (file upload)
    if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 400;
        message = 'File too large. Maximum size is 5MB.';
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        statusCode = 400;
        message = 'Unexpected file field.';
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        message,
        errors: errors.length > 0 ? errors : undefined,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

// Async handler wrapper to catch async errors
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Create common API errors
export const createError = {
    badRequest: (message = 'Bad Request', errors = []) => new ApiError(400, message, errors),
    unauthorized: (message = 'Unauthorized') => new ApiError(401, message),
    forbidden: (message = 'Forbidden') => new ApiError(403, message),
    notFound: (message = 'Not Found') => new ApiError(404, message),
    conflict: (message = 'Conflict') => new ApiError(409, message),
    unprocessable: (message = 'Unprocessable Entity', errors = []) => new ApiError(422, message, errors),
    tooManyRequests: (message = 'Too Many Requests') => new ApiError(429, message),
    internal: (message = 'Internal Server Error') => new ApiError(500, message)
};

export default {
    ApiError,
    notFound,
    errorHandler,
    asyncHandler,
    createError
};

import { body, param, query, validationResult } from 'express-validator';
import { createError } from './errorHandler.js';
import { VALIDATION } from '../config/constants.js';

/**
 * Handle validation errors from express-validator
 */
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.path,
            message: err.msg
        }));

        // Debug log to see what's failing
        console.log('Validation Error Details:', {
            url: req.originalUrl,
            body: req.body,
            errors: formattedErrors
        });

        return next(createError.badRequest('Validation failed', formattedErrors));
    }

    next();
};

// ===========================================
// AUTH VALIDATORS
// ===========================================

export const registerValidator = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
        .withMessage(`Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`)
        .isLength({ max: VALIDATION.PASSWORD_MAX_LENGTH })
        .withMessage(`Password cannot exceed ${VALIDATION.PASSWORD_MAX_LENGTH} characters`)
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters'),
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters'),
    handleValidationErrors
];

export const loginValidator = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

export const forgotPasswordValidator = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    handleValidationErrors
];

export const resetPasswordValidator = [
    body('token')
        .notEmpty()
        .withMessage('Reset token is required'),
    body('password')
        .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
        .withMessage(`Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`)
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    handleValidationErrors
];

// ===========================================
// PRODUCT VALIDATORS
// ===========================================

export const productValidator = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Product name is required')
        .isLength({ max: VALIDATION.PRODUCT_NAME_MAX_LENGTH })
        .withMessage(`Product name cannot exceed ${VALIDATION.PRODUCT_NAME_MAX_LENGTH} characters`),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Product description is required')
        .isLength({ max: VALIDATION.DESCRIPTION_MAX_LENGTH })
        .withMessage(`Description cannot exceed ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`),
    body('price')
        .isInt({ min: 1 })
        .withMessage('Price must be a positive number (in smallest currency unit)'),
    body('compareAtPrice')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Compare at price must be a non-negative number'),
    body('sku')
        .optional()
        .trim()
        .isLength({ max: VALIDATION.SKU_MAX_LENGTH })
        .withMessage(`SKU cannot exceed ${VALIDATION.SKU_MAX_LENGTH} characters`),
    body('inventory')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Inventory must be a non-negative number'),
    body('categories')
        .optional()
        .isArray()
        .withMessage('Categories must be an array'),
    body('categories.*')
        .optional()
        .isMongoId()
        .withMessage('Invalid category ID'),
    body('status')
        .optional()
        .isIn(['active', 'draft', 'archived'])
        .withMessage('Invalid status'),
    handleValidationErrors
];

export const productUpdateValidator = [
    body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Product name cannot be empty')
        .isLength({ max: VALIDATION.PRODUCT_NAME_MAX_LENGTH })
        .withMessage(`Product name cannot exceed ${VALIDATION.PRODUCT_NAME_MAX_LENGTH} characters`),
    body('description')
        .optional()
        .trim()
        .isLength({ max: VALIDATION.DESCRIPTION_MAX_LENGTH })
        .withMessage(`Description cannot exceed ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`),
    body('price')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Price must be a positive number'),
    handleValidationErrors
];

// ===========================================
// CATEGORY VALIDATORS
// ===========================================

export const categoryValidator = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Category name is required')
        .isLength({ max: 100 })
        .withMessage('Category name cannot exceed 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
    body('parent')
        .optional()
        .isMongoId()
        .withMessage('Invalid parent category ID'),
    body('status')
        .optional()
        .isIn(['active', 'draft', 'archived'])
        .withMessage('Invalid status'),
    handleValidationErrors
];

// ===========================================
// CART VALIDATORS
// ===========================================

export const addToCartValidator = [
    body('productId')
        .notEmpty()
        .withMessage('Product ID is required')
        .isMongoId()
        .withMessage('Invalid product ID'),
    body('quantity')
        .optional()
        .isInt({ min: 1, max: VALIDATION.MAX_QUANTITY_PER_ITEM })
        .withMessage(`Quantity must be between 1 and ${VALIDATION.MAX_QUANTITY_PER_ITEM}`),
    body('variant')
        .optional()
        .isObject()
        .withMessage('Variant must be an object'),
    body('variant.sku')
        .optional()
        .isString()
        .withMessage('Variant SKU must be a string'),
    handleValidationErrors
];

export const updateCartItemValidator = [
    param('itemId')
        .isMongoId()
        .withMessage('Invalid item ID'),
    body('quantity')
        .isInt({ min: 0, max: VALIDATION.MAX_QUANTITY_PER_ITEM })
        .withMessage(`Quantity must be between 0 and ${VALIDATION.MAX_QUANTITY_PER_ITEM}`),
    handleValidationErrors
];

// ===========================================
// ORDER VALIDATORS
// ===========================================

export const checkoutValidator = [
    body('shippingAddress')
        .notEmpty()
        .withMessage('Shipping address is required')
        .isObject()
        .withMessage('Shipping address must be an object'),
    body('shippingAddress.firstName')
        .trim()
        .notEmpty()
        .withMessage('First name is required'),
    body('shippingAddress.lastName')
        .trim()
        .notEmpty()
        .withMessage('Last name is required'),
    body('shippingAddress.email')
        .trim()
        .isEmail()
        .withMessage('Valid email is required'),
    body('shippingAddress.phone')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required'),
    body('shippingAddress.street')
        .trim()
        .notEmpty()
        .withMessage('Street address is required'),
    body('shippingAddress.city')
        .trim()
        .notEmpty()
        .withMessage('City is required'),
    body('shippingAddress.state')
        .trim()
        .notEmpty()
        .withMessage('State is required'),
    body('shippingAddress.postalCode')
        .trim()
        .notEmpty()
        .withMessage('Postal code is required'),
    body('paymentMethod')
        .notEmpty()
        .withMessage('Payment method is required')
        .isIn(['razorpay', 'stripe', 'cod'])
        .withMessage('Invalid payment method'),
    body('discountCode')
        .optional()
        .trim()
        .isString(),
    handleValidationErrors
];

export const updateOrderStatusValidator = [
    param('id')
        .notEmpty()
        .withMessage('Order ID is required')
        .isMongoId()
        .withMessage('Invalid order ID'),
    body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded', 'on_hold'])
        .withMessage('Invalid status'),
    body('note')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Note cannot exceed 500 characters'),
    handleValidationErrors
];

// ===========================================
// CONFIG VALIDATORS
// ===========================================

export const configUpdateValidator = [
    body('key')
        .trim()
        .notEmpty()
        .withMessage('Configuration key is required'),
    body('value')
        .exists()
        .withMessage('Configuration value is required'),
    body('type')
        .optional()
        .isIn(['branding', 'feature', 'payment', 'shipping', 'tax', 'email', 'policy', 'business_rule'])
        .withMessage('Invalid configuration type'),
    handleValidationErrors
];

export const featureToggleValidator = [
    body('featureName')
        .trim()
        .notEmpty()
        .withMessage('Feature name is required'),
    body('enabled')
        .isBoolean()
        .withMessage('Enabled must be a boolean'),
    handleValidationErrors
];

// ===========================================
// COMMON VALIDATORS
// ===========================================

export const mongoIdValidator = (paramName = 'id') => [
    param(paramName)
        .isMongoId()
        .withMessage(`Invalid ${paramName}`),
    handleValidationErrors
];

export const paginationValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('sort')
        .optional()
        .isString()
        .withMessage('Sort must be a string'),
    handleValidationErrors
];

export default {
    handleValidationErrors,
    registerValidator,
    loginValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    productValidator,
    productUpdateValidator,
    categoryValidator,
    addToCartValidator,
    updateCartItemValidator,
    checkoutValidator,
    updateOrderStatusValidator,
    configUpdateValidator,
    featureToggleValidator,
    mongoIdValidator,
    paginationValidator
};

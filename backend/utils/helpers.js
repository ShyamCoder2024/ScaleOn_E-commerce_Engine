/**
 * Utility Helper Functions
 * Generic helper functions used across the application
 */

/**
 * Format price from paise/cents to display format
 * @param {number} amount - Amount in smallest currency unit
 * @param {string} currency - Currency code (default: INR)
 * @param {string} locale - Locale for formatting (default: en-IN)
 * @returns {string} Formatted price string
 */
export const formatPrice = (amount, currency = 'INR', locale = 'en-IN') => {
    const value = amount / 100;
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2
    }).format(value);
};

/**
 * Parse price from display format to paise/cents
 * @param {string|number} amount - Display amount
 * @returns {number} Amount in smallest currency unit
 */
export const parsePrice = (amount) => {
    if (typeof amount === 'number') {
        return Math.round(amount * 100);
    }
    const parsed = parseFloat(amount.replace(/[^0-9.-]/g, ''));
    return Math.round(parsed * 100);
};

/**
 * Generate a random string
 * @param {number} length - Length of string
 * @returns {string} Random string
 */
export const generateRandomString = (length = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Slugify a string
 * @param {string} text - Text to slugify
 * @returns {string} Slugified text
 */
export const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

/**
 * Parse pagination parameters
 * @param {object} query - Query parameters
 * @param {object} defaults - Default values
 * @returns {object} Parsed pagination
 */
export const parsePagination = (query, defaults = {}) => {
    const page = Math.max(1, parseInt(query.page) || defaults.page || 1);
    const limit = Math.min(
        100,
        Math.max(1, parseInt(query.limit) || defaults.limit || 20)
    );
    const skip = (page - 1) * limit;
    const sort = query.sort || defaults.sort || '-createdAt';

    return { page, limit, skip, sort };
};

/**
 * Build pagination response
 * @param {Array} items - Items array
 * @param {number} total - Total count
 * @param {object} params - Pagination params
 * @returns {object} Pagination response
 */
export const buildPaginationResponse = (items, total, { page, limit }) => {
    return {
        items,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasMore: page * limit < total
        }
    };
};

/**
 * Deep clone an object
 * @param {object} obj - Object to clone
 * @returns {object} Cloned object
 */
export const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clone = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                clone[key] = deepClone(obj[key]);
            }
        }
        return clone;
    }
    return obj;
};

/**
 * Pick specific keys from an object
 * @param {object} obj - Source object
 * @param {string[]} keys - Keys to pick
 * @returns {object} New object with picked keys
 */
export const pick = (obj, keys) => {
    return keys.reduce((result, key) => {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            result[key] = obj[key];
        }
        return result;
    }, {});
};

/**
 * Omit specific keys from an object
 * @param {object} obj - Source object
 * @param {string[]} keys - Keys to omit
 * @returns {object} New object without omitted keys
 */
export const omit = (obj, keys) => {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
};

/**
 * Check if a value is empty
 * @param {any} value - Value to check
 * @returns {boolean} True if empty
 */
export const isEmpty = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    return false;
};

/**
 * Delay execution for specified milliseconds
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum retries
 * @param {number} baseDelay - Base delay in ms
 * @returns {Promise} Result of function
 */
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (attempt < maxRetries - 1) {
                const delayMs = baseDelay * Math.pow(2, attempt);
                await delay(delayMs);
            }
        }
    }

    throw lastError;
};

/**
 * Mask sensitive data for logging
 * @param {string} str - String to mask
 * @param {number} visibleChars - Number of visible characters at start and end
 * @returns {string} Masked string
 */
export const maskString = (str, visibleChars = 4) => {
    if (!str || str.length <= visibleChars * 2) {
        return '***';
    }
    const start = str.slice(0, visibleChars);
    const end = str.slice(-visibleChars);
    return `${start}***${end}`;
};

/**
 * Mask email for display
 * @param {string} email - Email to mask
 * @returns {string} Masked email
 */
export const maskEmail = (email) => {
    const [local, domain] = email.split('@');
    if (!domain) return '***@***';

    const maskedLocal = local.length > 2
        ? `${local[0]}***${local[local.length - 1]}`
        : '***';

    return `${maskedLocal}@${domain}`;
};

/**
 * Calculate percentage
 * @param {number} part - Part value
 * @param {number} whole - Whole value
 * @param {number} decimals - Decimal places
 * @returns {number} Percentage
 */
export const calculatePercentage = (part, whole, decimals = 2) => {
    if (whole === 0) return 0;
    return Number(((part / whole) * 100).toFixed(decimals));
};

/**
 * Get IP address from request
 * @param {object} req - Express request object
 * @returns {string} IP address
 */
export const getIpAddress = (req) => {
    return (
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.ip ||
        'unknown'
    );
};

export default {
    formatPrice,
    parsePrice,
    generateRandomString,
    slugify,
    parsePagination,
    buildPaginationResponse,
    deepClone,
    pick,
    omit,
    isEmpty,
    delay,
    retryWithBackoff,
    maskString,
    maskEmail,
    calculatePercentage,
    getIpAddress
};

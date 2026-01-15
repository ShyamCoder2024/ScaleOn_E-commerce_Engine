/**
 * Format price in Indian Rupees
 * @param {number} amount - Amount in paise (smallest unit)
 * @param {boolean} showSymbol - Whether to show ₹ symbol
 * @returns {string} - Formatted price string
 */
export const formatPrice = (amount, showSymbol = true) => {
    if (amount === null || amount === undefined) return showSymbol ? '₹0.00' : '0.00';
    const rupees = amount / 100;
    const formatted = rupees.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return showSymbol ? `₹${formatted}` : formatted;
};

/**
 * Format date in Indian locale
 * @param {string|Date} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, options = {}) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';

    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options
    };

    return d.toLocaleDateString('en-IN', defaultOptions);
};

/**
 * Format date with time
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date/time string
 */
export const formatDateTime = (date) => {
    return formatDate(date, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {string|Date} date - Date to compare
 * @returns {string} - Relative time string
 */
export const getRelativeTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const diffMs = now - d;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;

    return formatDate(d);
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export const truncate = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
};

/**
 * Generate a slug from text
 * @param {string} text - Text to slugify
 * @returns {string} - URL-safe slug
 */
export const slugify = (text) => {
    if (!text) return '';
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

/**
 * Capitalize first letter of each word
 * @param {string} text - Text to capitalize
 * @returns {string} - Capitalized text
 */
export const capitalize = (text) => {
    if (!text) return '';
    return text.replace(/\b\w/g, (l) => l.toUpperCase());
};

/**
 * Format phone number
 * @param {string} phone - Phone number
 * @returns {string} - Formatted phone number
 */
export const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
        return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    }
    return phone;
};

/**
 * Format number with commas (Indian numbering system)
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
export const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('en-IN');
};

/**
 * Parse query string to object
 * @param {string} queryString - Query string
 * @returns {object} - Parsed object
 */
export const parseQueryString = (queryString) => {
    if (!queryString) return {};
    const params = new URLSearchParams(queryString);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
};

/**
 * Build query string from object
 * @param {object} params - Parameters object
 * @returns {string} - Query string
 */
export const buildQueryString = (params) => {
    if (!params || typeof params !== 'object') return '';
    const filtered = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '');
    if (filtered.length === 0) return '';
    return '?' + new URLSearchParams(Object.fromEntries(filtered)).toString();
};

/**
 * Deep clone an object
 * @param {any} obj - Object to clone
 * @returns {any} - Cloned object
 */
export const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    return JSON.parse(JSON.stringify(obj));
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait = 300) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * @param {any} value - Value to check
 * @returns {boolean} - Whether value is empty
 */
export const isEmpty = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
};

export default {
    formatPrice,
    formatDate,
    formatDateTime,
    getRelativeTime,
    truncate,
    slugify,
    capitalize,
    formatPhone,
    formatNumber,
    parseQueryString,
    buildQueryString,
    deepClone,
    debounce,
    isEmpty
};

/**
 * System Constants - NEVER CHANGE PER CLIENT
 * These are immutable system-level constants that apply universally
 */

// ===========================================
// Order Status Constants
// ===========================================
export const ORDER_STATUS = {
    PAYMENT_PENDING: 'payment_pending', // Awaiting online payment
    PENDING: 'pending',                  // Payment confirmed, awaiting processing
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
    ON_HOLD: 'on_hold'
};

// Valid status transitions (state machine)
export const ORDER_STATUS_TRANSITIONS = {
    [ORDER_STATUS.PAYMENT_PENDING]: [ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED], // Payment received → pending/processing, failed → cancelled
    [ORDER_STATUS.PENDING]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.ON_HOLD, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
    [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.REFUNDED],
    [ORDER_STATUS.COMPLETED]: [ORDER_STATUS.REFUNDED],
    [ORDER_STATUS.ON_HOLD]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.CANCELLED]: [],
    [ORDER_STATUS.REFUNDED]: []
};

// ===========================================
// Payment Status Constants
// ===========================================
export const PAYMENT_STATUS = {
    INITIATED: 'initiated',
    PENDING: 'pending',
    AUTHORIZED: 'authorized',
    CAPTURED: 'captured',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    PARTIALLY_REFUNDED: 'partially_refunded'
};

export const PAYMENT_PROVIDERS = {
    STRIPE: 'stripe',
    RAZORPAY: 'razorpay',
    PAYPAL: 'paypal',
    COD: 'cod'
};

// ===========================================
// User Role Constants
// ===========================================
export const USER_ROLES = {
    CUSTOMER: 'customer',
    STAFF: 'staff',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin'
};

// Role hierarchy for permission checks
export const ROLE_HIERARCHY = {
    [USER_ROLES.SUPER_ADMIN]: 4,
    [USER_ROLES.ADMIN]: 3,
    [USER_ROLES.STAFF]: 2,
    [USER_ROLES.CUSTOMER]: 1
};

// ===========================================
// Product Status Constants
// ===========================================
export const PRODUCT_STATUS = {
    ACTIVE: 'active',
    DRAFT: 'draft',
    ARCHIVED: 'archived'
};

export const CATEGORY_STATUS = {
    ACTIVE: 'active',
    DRAFT: 'draft',
    ARCHIVED: 'archived'
};

// ===========================================
// Configuration Types
// ===========================================
export const CONFIG_TYPES = {
    BRANDING: 'branding',
    FEATURE: 'feature',
    PAYMENT: 'payment',
    SHIPPING: 'shipping',
    TAX: 'tax',
    EMAIL: 'email',
    POLICY: 'policy',
    BUSINESS_RULE: 'business_rule'
};

// ===========================================
// Shipping Calculation Methods
// ===========================================
export const SHIPPING_METHODS = {
    FLAT: 'flat',
    TIERED: 'tiered',
    WEIGHT_BASED: 'weight_based',
    LOCATION_BASED: 'location_based',
    FREE: 'free'
};

// ===========================================
// Tax Calculation Methods
// ===========================================
export const TAX_METHODS = {
    NONE: 'none',
    FLAT_RATE: 'flat_rate',
    PRODUCT_BASED: 'product_based',
    LOCATION_BASED: 'location_based'
};

// ===========================================
// Audit Action Types
// ===========================================
export const AUDIT_ACTIONS = {
    // Auth
    USER_LOGIN: 'user.login',
    USER_LOGOUT: 'user.logout',
    USER_REGISTER: 'user.register',
    PASSWORD_RESET: 'user.password_reset',

    // Products
    PRODUCT_CREATE: 'product.create',
    PRODUCT_UPDATE: 'product.update',
    PRODUCT_DELETE: 'product.delete',
    PRODUCT_ARCHIVE: 'product.archive',

    // Categories
    CATEGORY_CREATE: 'category.create',
    CATEGORY_UPDATE: 'category.update',
    CATEGORY_DELETE: 'category.delete',

    // Orders
    ORDER_CREATE: 'order.create',
    ORDER_STATUS_CHANGE: 'order.status_change',
    ORDER_CANCEL: 'order.cancel',
    ORDER_REFUND: 'order.refund',

    // Config
    CONFIG_UPDATE: 'config.update',
    FEATURE_TOGGLE: 'feature.toggle',

    // Admin
    ADMIN_CREATE: 'admin.create',
    ADMIN_UPDATE: 'admin.update',
    ADMIN_DELETE: 'admin.delete'
};

// ===========================================
// Validation Constants
// ===========================================
export const VALIDATION = {
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    PRODUCT_NAME_MAX_LENGTH: 200,
    DESCRIPTION_MAX_LENGTH: 10000,
    SKU_MAX_LENGTH: 50,
    MAX_IMAGES_PER_PRODUCT: 10,
    MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    MAX_CART_ITEMS: 100,
    MAX_QUANTITY_PER_ITEM: 99
};

// ===========================================
// Security Constants
// ===========================================
export const SECURITY = {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCK_DURATION_MINUTES: 15,
    PASSWORD_RESET_EXPIRY_HOURS: 1,
    EMAIL_VERIFICATION_EXPIRY_HOURS: 24,
    SESSION_TIMEOUT_MINUTES: 30,
    ADMIN_SESSION_TIMEOUT_MINUTES: 15,
    CART_EXPIRY_HOURS: 24,
    ABANDONED_CART_CLEANUP_DAYS: 7
};

// ===========================================
// Pagination Defaults
// ===========================================
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
};

export default {
    ORDER_STATUS,
    ORDER_STATUS_TRANSITIONS,
    PAYMENT_STATUS,
    PAYMENT_PROVIDERS,
    USER_ROLES,
    ROLE_HIERARCHY,
    PRODUCT_STATUS,
    CATEGORY_STATUS,
    CONFIG_TYPES,
    SHIPPING_METHODS,
    TAX_METHODS,
    AUDIT_ACTIONS,
    VALIDATION,
    SECURITY,
    PAGINATION
};

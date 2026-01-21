import axios from 'axios';
import toast from 'react-hot-toast';

import { getFriendlyErrorMessage } from '../utils/errorUtils';

// ===========================================
// REQUEST DEDUPLICATION & RETRY SYSTEM
// ===========================================

// In-flight request cache to prevent duplicate calls
const pendingRequests = new Map();

// Generate a unique key for each request
const getRequestKey = (config) => {
    return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
};

// Retry configuration - ENTERPRISE GRADE
const RETRY_CONFIG = {
    maxRetries: 2, // Reduced from 3 to prevent long delays
    baseDelay: 500, // Reduced from 1000ms for faster recovery
    maxDelay: 5000, // Reduced from 10000ms
};

// Request throttle to prevent API storms
const requestThrottle = new Map();
const THROTTLE_WINDOW = 100; // 100ms window for same-endpoint calls

// Sleep utility for retry delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Calculate exponential backoff delay
const getRetryDelay = (retryCount) => {
    const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, retryCount),
        RETRY_CONFIG.maxDelay
    );
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 500;
};

// Check if request should be retried - ONLY for GET requests and specific errors
const shouldRetry = (error, retryCount, config) => {
    if (retryCount >= RETRY_CONFIG.maxRetries) return false;

    // CRITICAL: Only retry GET requests - never retry POST/PUT/DELETE
    if (config?.method && config.method.toLowerCase() !== 'get') {
        return false;
    }

    // CRITICAL: Never retry auth errors (401, 403) - they won't magically fix themselves
    if (error.response) {
        const status = error.response.status;
        // Skip retry on ALL client errors except 429 (rate limit)
        if (status >= 400 && status < 500 && status !== 429) {
            return false;
        }
    }

    // Only retry on network errors, timeouts, and server errors (5xx)
    return !error.response || error.response.status >= 500 || error.code === 'ECONNABORTED';
};

// Throttle check - prevents same endpoint being hit multiple times within window
const isThrottled = (key) => {
    const lastCall = requestThrottle.get(key);
    if (lastCall && Date.now() - lastCall < THROTTLE_WINDOW) {
        return true;
    }
    requestThrottle.set(key, Date.now());
    // Clean up old entries periodically
    if (requestThrottle.size > 100) {
        const now = Date.now();
        for (const [k, v] of requestThrottle.entries()) {
            if (now - v > 5000) requestThrottle.delete(k);
        }
    }
    return false;
};

// Create axios instance with base configuration
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 30000, // Increased to 30 seconds for slow connections
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor for adding auth token and deduplication
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Initialize retry count
        if (config._retryCount === undefined) {
            config._retryCount = 0;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors with retry logic
api.interceptors.response.use(
    (response) => {
        // Clear from pending requests on success
        const key = getRequestKey(response.config);
        pendingRequests.delete(key);
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Clear from pending requests
        if (originalRequest) {
            const key = getRequestKey(originalRequest);
            pendingRequests.delete(key);
        }

        // Handle 401 Unauthorized - Token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Try to refresh token
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post('/api/auth/refresh', { refreshToken });
                    const { accessToken } = response.data.data;

                    localStorage.setItem('token', accessToken);
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, clear tokens and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');

                // Show session expired toast
                toast.error('Session expired. Please login again.', { duration: 4000 });

                // Only redirect if not already on login page
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        // Retry logic for failed requests - ONLY for GET requests
        const retryCount = originalRequest?._retryCount || 0;
        if (originalRequest && shouldRetry(error, retryCount, originalRequest)) {
            originalRequest._retryCount = retryCount + 1;
            const delay = getRetryDelay(retryCount);

            console.log(`Retrying GET request (${retryCount + 1}/${RETRY_CONFIG.maxRetries}): ${originalRequest.url}`);

            await sleep(delay);
            return api(originalRequest);
        }

        // Enhance error with user-friendly message for components to use if needed
        error.userMessage = getFriendlyErrorMessage(error);
        return Promise.reject(error);
    }
);

// ===========================================
// SMART REQUEST WRAPPER WITH DEDUPLICATION
// ===========================================

// Wrapper for GET requests with deduplication
const deduplicatedGet = (url, config = {}) => {
    const fullConfig = { ...config, method: 'get', url };
    const key = getRequestKey(fullConfig);

    // If same request is already in flight, return the existing promise
    if (pendingRequests.has(key)) {
        return pendingRequests.get(key);
    }

    // Create new request and cache it
    const promise = api.get(url, config).finally(() => {
        pendingRequests.delete(key);
    });

    pendingRequests.set(key, promise);
    return promise;
};

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
    verifyEmail: (token) => api.post('/auth/verify-email', { token }),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (data) => api.post('/auth/reset-password', data),
    updateProfile: (data) => api.put('/auth/profile', data),
    changePassword: (data) => api.post('/auth/change-password', data),
    addAddress: (data) => api.post('/auth/addresses', data),
    updateAddress: (id, data) => api.put(`/auth/addresses/${id}`, data),
    deleteAddress: (id) => api.delete(`/auth/addresses/${id}`),
    // Social Authentication
    loginWithGoogle: (userData) => api.post('/auth/google', { userData }),
    loginWithApple: (userData) => api.post('/auth/apple', { userData }),
};

// Product API - Using deduplication for read operations
export const productAPI = {
    getProducts: (params) => deduplicatedGet('/products', { params }),
    getFeatured: (limit = 8) => deduplicatedGet('/products/featured', { params: { limit } }),
    search: (query, params) => deduplicatedGet('/products/search', { params: { q: query, ...params } }),
    getBySlug: (slug) => deduplicatedGet(`/products/slug/${slug}`),
    getById: (id) => deduplicatedGet(`/products/${id}`),
    // Admin operations (no deduplication needed for mutations)
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
};

// Category API - Using deduplication
export const categoryAPI = {
    getCategories: () => deduplicatedGet('/categories'),
    getCategoryTree: () => deduplicatedGet('/categories/tree'),
    getBySlug: (slug) => deduplicatedGet(`/categories/slug/${slug}`),
};

// Cart API
export const cartAPI = {
    getCart: () => api.get('/cart'),
    getSummary: () => api.get('/cart/summary'),
    addItem: (productId, quantity = 1, variant = null) => {
        const data = { productId, quantity };
        if (variant) data.variant = variant;
        return api.post('/cart/add', data);
    },
    updateItem: (itemId, quantity) => api.put(`/cart/items/${itemId}`, { quantity }),
    removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),
    clearCart: () => api.delete('/cart'),
    applyDiscount: (code) => api.post('/cart/discount', { code }),
    removeDiscount: () => api.delete('/cart/discount'),
    validate: () => api.post('/cart/validate'),
};

// Order API
export const orderAPI = {
    getOrders: (params) => api.get('/orders', { params }),
    getById: (id) => api.get(`/orders/${id}`),
    getByOrderId: (orderId) => api.get(`/orders/order/${orderId}`),
    cancel: (id, reason = '') => api.post(`/orders/${id}/cancel`, { reason }),
    adminCancel: (id, reason = '') => api.post(`/orders/admin/${id}/cancel`, { reason }),
    // Admin order operations
    getAdminOrders: (params) => api.get('/orders/admin/all', { params }),
    getAdminStats: () => api.get('/orders/admin/stats'),
    updateStatus: (id, status, note = '') => api.put(`/orders/${id}/status`, { status, note }),
    addTracking: (id, data) => api.put(`/orders/${id}/tracking`, data),
    markDelivered: (id) => api.post(`/orders/${id}/deliver`),
    addNote: (id, note) => api.post(`/orders/${id}/notes`, { note }),
    processRefund: (id, amount, reason) => api.post(`/orders/${id}/refund`, { amount, reason }),
};

// Payment API
export const paymentAPI = {
    getMethods: () => api.get('/payments/methods'),
    checkout: (data) => api.post('/payments/checkout', data),
    verify: (paymentId, data) => api.post(`/payments/${paymentId}/verify`, data),
    getStatus: (paymentId) => api.get(`/payments/${paymentId}/status`),
};

// Config API - Using deduplication for critical config requests
export const configAPI = {
    getPublic: () => deduplicatedGet('/config/public'),
    getBranding: () => deduplicatedGet('/config/branding'),
    getFeatures: () => deduplicatedGet('/config/features'),
    // Admin config operations
    getConfig: () => api.get('/config/admin'),
    getAdminFeatures: () => api.get('/config/admin/features'),
    updateConfig: (data) => api.post('/config/admin/batch', data),
    toggleFeature: (featureName, enabled) => api.put(`/config/admin/features/${featureName}`, { enabled }),
};

// Feature Cards API (Promotional Banners) - Using deduplication
export const featureCardsAPI = {
    getAll: () => deduplicatedGet('/config/feature-cards'),
    // Admin operations
    getAdminCards: () => api.get('/config/admin/feature-cards'),
    add: (data) => api.post('/config/admin/feature-cards', data),
    remove: (id) => api.delete(`/config/admin/feature-cards/${id}`),
    reorder: (cardIds) => api.put('/config/admin/feature-cards/reorder', { cardIds }),
};

// Admin API
export const adminAPI = {
    // Dashboard
    getDashboard: () => api.get('/admin/dashboard'),
    getAnalytics: (params) => api.get('/admin/analytics', { params }),

    // Products
    getProducts: (params) => api.get('/products/admin/all', { params }),
    createProduct: (data) => api.post('/products', data),
    updateProduct: (id, data) => api.put(`/products/${id}`, data),
    deleteProduct: (id) => api.delete(`/products/${id}`),
    restoreProduct: (id) => api.post(`/products/${id}/restore`),
    duplicateProduct: (id) => api.post(`/products/${id}/duplicate`),
    bulkUpdateStatus: (productIds, status) =>
        api.post('/products/bulk/status', { productIds, status }),
    getLowStock: (threshold) =>
        api.get('/products/admin/low-stock', { params: { threshold } }),

    // Categories
    getAllCategories: () => api.get('/categories/admin/all'),
    createCategory: (data) => api.post('/categories', data),
    updateCategory: (id, data) => api.put(`/categories/${id}`, data),
    deleteCategory: (id) => api.delete(`/categories/${id}`),
    reorderCategories: (categories) => api.post('/categories/reorder', { categories }),

    // Orders
    getOrders: (params) => api.get('/orders/admin/all', { params }),
    getOrderStats: () => api.get('/orders/admin/stats'),
    getRecentOrders: (limit = 10) =>
        api.get('/orders/admin/recent', { params: { limit } }),
    updateOrderStatus: (id, status, note = '') =>
        api.put(`/orders/${id}/status`, { status, note }),
    addTracking: (id, trackingNumber, trackingUrl = '') =>
        api.put(`/orders/${id}/tracking`, { trackingNumber, trackingUrl }),
    addOrderNote: (id, note) => api.post(`/orders/${id}/notes`, { note }),
    cancelOrder: (id, reason = '') =>
        api.post(`/orders/admin/${id}/cancel`, { reason }),
    processRefund: (id, amount, reason = '') =>
        api.post(`/orders/${id}/refund`, { amount, reason }),

    // Customers
    getCustomers: (params) => api.get('/admin/customers', { params }),
    getCustomer: (id) => api.get(`/admin/customers/${id}`),
    updateCustomerStatus: (id, status) =>
        api.put(`/admin/customers/${id}/status`, { status }),

    // Admin Users
    getAdminUsers: () => api.get('/admin/users'),
    createAdminUser: (data) => api.post('/admin/users', data),
    updateAdminUser: (id, data) => api.put(`/admin/users/${id}`, data),
    deleteAdminUser: (id) => api.delete(`/admin/users/${id}`),

    // Audit Logs
    getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
    getRecentActivity: (limit = 20) =>
        api.get('/admin/audit-logs/recent', { params: { limit } }),
};

// Review API
export const reviewAPI = {
    create: (data) => api.post('/reviews', data),
    getByProduct: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
    getByUser: () => api.get('/reviews/user'),
    canReview: (orderId, orderItemId) => api.get(`/reviews/can-review/${orderId}/${orderItemId}`),
    delete: (id) => api.delete(`/reviews/${id}`),
};

// Utility to create abort controller for cancellable requests
export const createAbortController = () => {
    const controller = new AbortController();
    return {
        signal: controller.signal,
        cancel: () => controller.abort()
    };
};

export default api;

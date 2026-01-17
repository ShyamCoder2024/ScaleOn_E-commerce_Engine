import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Helper to get user-friendly error messages
const getErrorMessage = (error) => {
    // Network errors
    if (!error.response) {
        if (error.code === 'ECONNABORTED') {
            return 'Request timed out. Please try again.';
        }
        if (!navigator.onLine) {
            return 'You are offline. Please check your internet connection.';
        }
        return 'Unable to connect to server. Please try again later.';
    }

    const { status, data } = error.response;

    // Server-provided message
    if (data?.message) {
        return data.message;
    }

    // Default messages by status code
    switch (status) {
        case 400:
            return 'Invalid request. Please check your input.';
        case 401:
            return 'Please log in to continue.';
        case 403:
            return 'You do not have permission to perform this action.';
        case 404:
            return 'The requested resource was not found.';
        case 409:
            return 'This resource already exists.';
        case 422:
            return 'Validation failed. Please check your input.';
        case 429:
            return 'Too many requests. Please wait a moment and try again.';
        case 500:
            return 'Server error. Please try again later.';
        case 502:
        case 503:
        case 504:
            return 'Service temporarily unavailable. Please try again later.';
        default:
            return 'An unexpected error occurred. Please try again.';
    }
};

// Request interceptor for adding auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

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

                // Only redirect if not already on login page
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        // Don't show automatic toasts - let components handle their own errors
        // This prevents excessive/duplicate notifications

        // Enhance error with user-friendly message for components to use if needed
        error.userMessage = getErrorMessage(error);
        return Promise.reject(error);
    }
);

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

// Product API
export const productAPI = {
    getProducts: (params) => api.get('/products', { params }),
    getFeatured: (limit = 8) => api.get('/products/featured', { params: { limit } }),
    search: (query, params) => api.get('/products/search', { params: { q: query, ...params } }),
    getBySlug: (slug) => api.get(`/products/slug/${slug}`),
    getById: (id) => api.get(`/products/${id}`),
    // Admin operations
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
};

// Category API
export const categoryAPI = {
    getCategories: () => api.get('/categories'),
    getCategoryTree: () => api.get('/categories/tree'),
    getBySlug: (slug) => api.get(`/categories/slug/${slug}`),
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

// Config API
export const configAPI = {
    getPublic: () => api.get('/config/public'),
    getBranding: () => api.get('/config/branding'),
    getFeatures: () => api.get('/config/features'),
    // Admin config operations
    getConfig: () => api.get('/config/admin'),
    getAdminFeatures: () => api.get('/config/admin/features'),
    updateConfig: (data) => api.post('/config/admin/batch', data),
    toggleFeature: (featureName, enabled) => api.put(`/config/admin/features/${featureName}`, { enabled }),
};

// Feature Cards API (Promotional Banners)
export const featureCardsAPI = {
    getAll: () => api.get('/config/feature-cards'),
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

// Utility to create abort controller for cancellable requests
export const createAbortController = () => {
    const controller = new AbortController();
    return {
        signal: controller.signal,
        cancel: () => controller.abort()
    };
};

export default api;

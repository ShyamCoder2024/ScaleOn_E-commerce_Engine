import express from 'express';
import productService from '../services/productService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { protect, adminOnly, optionalAuth } from '../middleware/auth.js';
import { productValidator, productUpdateValidator, mongoIdValidator, paginationValidator } from '../middleware/validation.js';
import { searchLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Get all products (with filters)
 * @access  Public
 */
router.get('/', paginationValidator, asyncHandler(async (req, res) => {
    const {
        page,
        limit,
        sort,
        status,
        category,
        featured,
        search,
        minPrice,
        maxPrice,
        inStock
    } = req.query;

    const result = await productService.getActiveProducts({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        sort,
        category,
        featured: featured !== undefined ? featured === 'true' : null,
        search,
        minPrice: minPrice ? parseInt(minPrice) : null,
        maxPrice: maxPrice ? parseInt(maxPrice) : null,
        inStock: inStock === 'true'
    });

    res.json({
        success: true,
        data: result
    });
}));

/**
 * @route   GET /api/products/featured
 * @desc    Get featured products
 * @access  Public
 */
router.get('/featured', asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 8;
    const products = await productService.getFeaturedProducts(limit);

    res.json({
        success: true,
        data: { products }
    });
}));

/**
 * @route   GET /api/products/search
 * @desc    Search products
 * @access  Public
 */
router.get('/search', searchLimiter, asyncHandler(async (req, res) => {
    const { q, page, limit, category } = req.query;

    if (!q) {
        return res.status(400).json({
            success: false,
            message: 'Search query is required'
        });
    }

    const products = await productService.searchProducts(q, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        category
    });

    res.json({
        success: true,
        data: { products }
    });
}));

/**
 * @route   GET /api/products/slug/:slug
 * @desc    Get product by slug
 * @access  Public
 */
router.get('/slug/:slug', asyncHandler(async (req, res) => {
    const product = await productService.getProductBySlug(req.params.slug);

    res.json({
        success: true,
        data: { product }
    });
}));

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/:id', mongoIdValidator('id'), asyncHandler(async (req, res) => {
    const product = await productService.getProductById(req.params.id);

    res.json({
        success: true,
        data: { product }
    });
}));

// ========================================
// ADMIN ROUTES
// ========================================

/**
 * @route   GET /api/products/admin/all
 * @desc    Get all products (including drafts, archived) - Admin
 * @access  Admin
 */
router.get('/admin/all', protect, adminOnly, paginationValidator, asyncHandler(async (req, res) => {
    const {
        page,
        limit,
        sort,
        status,
        category,
        search
    } = req.query;

    const result = await productService.getProducts({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        sort,
        status,
        category,
        search
    });

    res.json({
        success: true,
        data: result
    });
}));

/**
 * @route   GET /api/products/admin/low-stock
 * @desc    Get low stock products - Admin
 * @access  Admin
 */
router.get('/admin/low-stock', protect, adminOnly, asyncHandler(async (req, res) => {
    const threshold = req.query.threshold ? parseInt(req.query.threshold) : null;
    const products = await productService.getLowStockProducts(threshold);

    res.json({
        success: true,
        data: { products }
    });
}));

/**
 * @route   GET /api/products/admin/out-of-stock
 * @desc    Get out of stock products - Admin
 * @access  Admin
 */
router.get('/admin/out-of-stock', protect, adminOnly, asyncHandler(async (req, res) => {
    const products = await productService.getOutOfStockProducts();

    res.json({
        success: true,
        data: { products }
    });
}));

/**
 * @route   POST /api/products
 * @desc    Create a new product - Admin
 * @access  Admin
 */
router.post('/', protect, adminOnly, productValidator, asyncHandler(async (req, res) => {
    const product = await productService.createProduct(req.body, req.user._id);

    res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: { product }
    });
}));

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product - Admin
 * @access  Admin
 */
router.put('/:id', protect, adminOnly, mongoIdValidator('id'), productUpdateValidator, asyncHandler(async (req, res) => {
    const product = await productService.updateProduct(req.params.id, req.body, req.user._id);

    res.json({
        success: true,
        message: 'Product updated successfully',
        data: { product }
    });
}));

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete (archive) a product - Admin
 * @access  Admin
 */
router.delete('/:id', protect, adminOnly, mongoIdValidator('id'), asyncHandler(async (req, res) => {
    const result = await productService.deleteProduct(req.params.id, req.user._id);

    res.json({
        success: true,
        message: result.message
    });
}));

/**
 * @route   POST /api/products/:id/restore
 * @desc    Restore an archived product - Admin
 * @access  Admin
 */
router.post('/:id/restore', protect, adminOnly, mongoIdValidator('id'), asyncHandler(async (req, res) => {
    const product = await productService.restoreProduct(req.params.id, req.user._id);

    res.json({
        success: true,
        message: 'Product restored successfully',
        data: { product }
    });
}));

/**
 * @route   POST /api/products/:id/duplicate
 * @desc    Duplicate a product - Admin
 * @access  Admin
 */
router.post('/:id/duplicate', protect, adminOnly, mongoIdValidator('id'), asyncHandler(async (req, res) => {
    const product = await productService.duplicateProduct(req.params.id, req.user._id);

    res.json({
        success: true,
        message: 'Product duplicated successfully',
        data: { product }
    });
}));

/**
 * @route   POST /api/products/bulk/status
 * @desc    Bulk update product status - Admin
 * @access  Admin
 */
router.post('/bulk/status', protect, adminOnly, asyncHandler(async (req, res) => {
    const { productIds, status } = req.body;

    if (!productIds || !Array.isArray(productIds) || !status) {
        return res.status(400).json({
            success: false,
            message: 'productIds array and status are required'
        });
    }

    const result = await productService.bulkUpdateStatus(productIds, status, req.user._id);

    res.json({
        success: true,
        message: `${result.modified} products updated`,
        data: result
    });
}));

export default router;

import express from 'express';
import inventoryService from '../services/inventoryService.js';
import orderWorkflowService from '../services/orderWorkflowService.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { mongoIdValidator, paginationValidator } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   GET /api/inventory/low-stock
 * @desc    Get low stock products
 * @access  Admin
 */
router.get('/low-stock', protect, adminOnly, asyncHandler(async (req, res) => {
    const threshold = parseInt(req.query.threshold) || 5;
    const limit = parseInt(req.query.limit) || 50;

    const products = await inventoryService.getLowStockProducts(threshold, limit);

    res.json({
        success: true,
        data: {
            products,
            count: products.length,
            threshold
        }
    });
}));

/**
 * @route   GET /api/inventory/out-of-stock
 * @desc    Get out of stock products
 * @access  Admin
 */
router.get('/out-of-stock', protect, adminOnly, asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;

    const products = await inventoryService.getOutOfStockProducts(limit);

    res.json({
        success: true,
        data: {
            products,
            count: products.length
        }
    });
}));

/**
 * @route   GET /api/inventory/:productId
 * @desc    Get stock status for a product
 * @access  Admin
 */
router.get('/:productId', protect, adminOnly, mongoIdValidator('productId'), asyncHandler(async (req, res) => {
    const { variantId } = req.query;

    const status = await inventoryService.getStockStatus(req.params.productId, variantId);

    if (!status.exists) {
        throw createError.notFound('Product not found');
    }

    res.json({
        success: true,
        data: status
    });
}));

/**
 * @route   PUT /api/inventory/:productId
 * @desc    Update product inventory
 * @access  Admin
 */
router.put('/:productId', protect, adminOnly, mongoIdValidator('productId'), asyncHandler(async (req, res) => {
    const { quantity, action = 'set', variantId } = req.body;

    if (typeof quantity !== 'number' || quantity < 0) {
        throw createError.badRequest('Valid quantity is required');
    }

    if (!['set', 'add', 'subtract'].includes(action)) {
        throw createError.badRequest('Action must be set, add, or subtract');
    }

    const results = await inventoryService.bulkUpdateInventory(
        [{
            productId: req.params.productId,
            variantId,
            quantity,
            action
        }],
        req.user._id
    );

    if (results[0].success) {
        res.json({
            success: true,
            message: 'Inventory updated'
        });
    } else {
        throw createError.badRequest(results[0].error);
    }
}));

/**
 * @route   POST /api/inventory/bulk-update
 * @desc    Bulk update inventory for multiple products
 * @access  Admin
 */
router.post('/bulk-update', protect, adminOnly, asyncHandler(async (req, res) => {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
        throw createError.badRequest('Updates array is required');
    }

    // Validate updates
    for (const update of updates) {
        if (!update.productId) {
            throw createError.badRequest('productId is required for each update');
        }
        if (typeof update.quantity !== 'number' || update.quantity < 0) {
            throw createError.badRequest('Valid quantity is required for each update');
        }
        if (update.action && !['set', 'add', 'subtract'].includes(update.action)) {
            throw createError.badRequest('Action must be set, add, or subtract');
        }
    }

    const results = await inventoryService.bulkUpdateInventory(updates, req.user._id);

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.json({
        success: true,
        message: `Updated ${successful} products, ${failed} failures`,
        data: {
            results,
            summary: { successful, failed }
        }
    });
}));

/**
 * @route   POST /api/inventory/check-availability
 * @desc    Check availability for multiple items
 * @access  Public (for cart validation)
 */
router.post('/check-availability', asyncHandler(async (req, res) => {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        throw createError.badRequest('Items array is required');
    }

    const result = await inventoryService.checkAvailability(items);

    res.json({
        success: true,
        data: result
    });
}));

/**
 * @route   POST /api/inventory/alerts
 * @desc    Send low stock alerts
 * @access  Admin
 */
router.post('/alerts', protect, adminOnly, asyncHandler(async (req, res) => {
    const lowStockProducts = await orderWorkflowService.checkLowStockAlerts();

    res.json({
        success: true,
        message: lowStockProducts.length > 0
            ? `Alert sent for ${lowStockProducts.length} products`
            : 'No low stock products found',
        data: {
            products: lowStockProducts
        }
    });
}));

export default router;

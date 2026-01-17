import express from 'express';
import orderService from '../services/orderService.js';
import orderWorkflowService from '../services/orderWorkflowService.js';
import notificationService from '../services/notificationService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { updateOrderStatusValidator, mongoIdValidator, paginationValidator } from '../middleware/validation.js';
import { ORDER_STATUS } from '../config/constants.js';

const router = express.Router();

/**
 * @route   GET /api/orders
 * @desc    Get user's orders
 * @access  Private
 */
router.get('/', protect, paginationValidator, asyncHandler(async (req, res) => {
    const { page, limit, status } = req.query;

    const result = await orderService.getUserOrders(req.user._id, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        status
    });

    res.json({
        success: true,
        data: result
    });
}));

/**
 * @route   GET /api/orders/order/:orderId
 * @desc    Get order by order ID string (ORD-XXXXXXXX-XXXXXX)
 * @access  Private (owner or admin)
 */
router.get('/order/:orderId', protect, asyncHandler(async (req, res) => {
    const order = await orderService.getOrderByOrderId(req.params.orderId);

    // Check ownership or admin
    if (!order.user._id.equals(req.user._id) &&
        !['admin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'You do not have access to this order'
        });
    }

    res.json({
        success: true,
        data: { order }
    });
}));

// ========================================
// ADMIN ROUTES - Must be before /:id
// ========================================

/**
 * @route   GET /api/orders/admin/all
 * @desc    Get all orders - Admin
 * @access  Admin
 */
router.get('/admin/all', protect, adminOnly, paginationValidator, asyncHandler(async (req, res) => {
    const { page, limit, status, search, startDate, endDate, sort } = req.query;

    const result = await orderService.getAllOrders({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status,
        search,
        startDate,
        endDate,
        sort
    });

    res.json({
        success: true,
        data: result
    });
}));

/**
 * @route   GET /api/orders/admin/stats
 * @desc    Get order statistics - Admin
 * @access  Admin
 */
router.get('/admin/stats', protect, adminOnly, asyncHandler(async (req, res) => {
    const { period } = req.query;

    const stats = await orderWorkflowService.getOrderStats(period || 'month');
    const statusCounts = await orderService.getStatusCounts();

    res.json({
        success: true,
        data: {
            ...stats.stats,
            statusCounts: stats.statusCounts || statusCounts
        }
    });
}));

/**
 * @route   GET /api/orders/admin/recent
 * @desc    Get recent orders - Admin
 * @access  Admin
 */
router.get('/admin/recent', protect, adminOnly, asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const orders = await orderService.getRecentOrders(limit);

    res.json({
        success: true,
        data: { orders }
    });
}));

/**
 * @route   POST /api/orders/admin/:id/cancel
 * @desc    Cancel order - Admin
 * @access  Admin
 */
router.post('/admin/:id/cancel', protect, adminOnly, mongoIdValidator('id'), asyncHandler(async (req, res) => {
    const { reason } = req.body;

    const order = await orderWorkflowService.cancelOrder(
        req.params.id,
        reason || 'Cancelled by admin',
        req.user._id,
        true // isAdmin
    );

    res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: { order }
    });
}));

// ========================================
// DYNAMIC ID ROUTES - Must be AFTER admin routes
// ========================================

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private (owner or admin)
 */
router.get('/:id', protect, mongoIdValidator('id'), asyncHandler(async (req, res) => {
    const order = await orderService.getOrderById(req.params.id);

    // Check ownership or admin
    if (!order.user._id.equals(req.user._id) &&
        !['admin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'You do not have access to this order'
        });
    }

    res.json({
        success: true,
        data: { order }
    });
}));

/**
 * @route   POST /api/orders/:id/cancel
 * @desc    Cancel order (user can cancel their own pending orders)
 * @access  Private (owner)
 */
router.post('/:id/cancel', protect, mongoIdValidator('id'), asyncHandler(async (req, res) => {
    const order = await orderService.getOrderById(req.params.id);

    // Only owner can cancel
    if (!order.user._id.equals(req.user._id)) {
        return res.status(403).json({
            success: false,
            message: 'You do not have access to this order'
        });
    }

    const { reason } = req.body;

    // Use workflow service for proper inventory release and notifications
    const cancelledOrder = await orderWorkflowService.cancelOrder(
        req.params.id,
        reason || 'Cancelled by customer',
        req.user._id,
        false // not admin
    );

    res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: { order: cancelledOrder }
    });
}));

// Additional admin routes that need /:id param follow:

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status - Admin
 * @access  Admin
 */
router.put('/:id/status', protect, adminOnly, updateOrderStatusValidator, asyncHandler(async (req, res) => {
    const { status, note } = req.body;
    let order;

    // Use workflow service for specific status changes
    switch (status) {
        case ORDER_STATUS.SHIPPED:
            // For shipped, we should use shipOrder with tracking (separate endpoint)
            order = await orderService.updateOrderStatus(
                req.params.id,
                status,
                req.user._id,
                note
            );
            // Send notification in background
            notificationService.sendStatusUpdate(req.params.id, status, note).catch(err => console.error('Bg Notification Error:', err));
            break;

        case ORDER_STATUS.DELIVERED:
            order = await orderWorkflowService.deliverOrder(
                req.params.id,
                req.user._id,
                note
            );
            break;

        case ORDER_STATUS.CANCELLED:
            order = await orderWorkflowService.cancelOrder(
                req.params.id,
                note || 'Cancelled by admin',
                req.user._id,
                true // isAdmin
            );
            break;

        default:
            order = await orderService.updateOrderStatus(
                req.params.id,
                status,
                req.user._id,
                note
            );
            // Send status update notification in background
            notificationService.sendStatusUpdate(req.params.id, status, note).catch(err => console.error('Bg Notification Error:', err));
    }

    res.json({
        success: true,
        message: 'Order status updated',
        data: { order }
    });
}));

/**
 * @route   PUT /api/orders/:id/tracking
 * @desc    Add tracking information and mark as shipped - Admin
 * @access  Admin
 */
router.put('/:id/tracking', protect, adminOnly, mongoIdValidator('id'), asyncHandler(async (req, res) => {
    const { trackingNumber, trackingUrl, carrier } = req.body;

    if (!trackingNumber) {
        return res.status(400).json({
            success: false,
            message: 'Tracking number is required'
        });
    }

    // Use workflow service to ship order with tracking
    const order = await orderWorkflowService.shipOrder(
        req.params.id,
        {
            trackingNumber,
            trackingUrl,
            carrier
        },
        req.user._id
    );

    res.json({
        success: true,
        message: 'Order shipped with tracking information',
        data: { order }
    });
}));

/**
 * @route   POST /api/orders/:id/notes
 * @desc    Add admin note - Admin
 * @access  Admin
 */
router.post('/:id/notes', protect, adminOnly, mongoIdValidator('id'), asyncHandler(async (req, res) => {
    const { note } = req.body;

    if (!note) {
        return res.status(400).json({
            success: false,
            message: 'Note is required'
        });
    }

    const order = await orderService.addAdminNote(
        req.params.id,
        note,
        req.user._id
    );

    res.json({
        success: true,
        message: 'Note added',
        data: { order }
    });
}));

/**
 * @route   POST /api/orders/:id/refund
 * @desc    Process refund - Admin
 * @access  Admin
 */
router.post('/:id/refund', protect, adminOnly, mongoIdValidator('id'), asyncHandler(async (req, res) => {
    const { amount, reason } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Valid refund amount is required'
        });
    }

    // Use workflow service for proper refund handling
    const order = await orderWorkflowService.processRefund(
        req.params.id,
        amount,
        reason || 'Admin initiated refund',
        req.user._id
    );

    res.json({
        success: true,
        message: 'Refund processed',
        data: { order }
    });
}));

/**
 * @route   POST /api/orders/:id/deliver
 * @desc    Mark order as delivered - Admin
 * @access  Admin
 */
router.post('/:id/deliver', protect, adminOnly, mongoIdValidator('id'), asyncHandler(async (req, res) => {
    const { note } = req.body;

    const order = await orderWorkflowService.deliverOrder(
        req.params.id,
        req.user._id,
        note
    );

    res.json({
        success: true,
        message: 'Order marked as delivered',
        data: { order }
    });
}));

export default router;

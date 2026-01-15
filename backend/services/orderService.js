import { Order, Cart, Product, Payment, AuditLog } from '../models/index.js';
import { createError } from '../middleware/errorHandler.js';
import { ORDER_STATUS, AUDIT_ACTIONS, PAGINATION } from '../config/constants.js';
import configService from './configService.js';
import emailService from './emailService.js';

/**
 * Order Service
 * Handles order creation, management, and lifecycle
 */
class OrderService {
    /**
     * Create order from cart after payment success
     */
    async createOrder(userId, cartId, shippingAddress, paymentId, pricing) {
        const cart = await Cart.findById(cartId).populate('items.product');

        if (!cart || cart.items.length === 0) {
            throw createError.badRequest('Cart is empty or not found');
        }

        // Create order
        const order = await Order.createFromCart(cart, { _id: userId }, shippingAddress, pricing, paymentId);

        // Decrement inventory
        const inventoryEnabled = await configService.isFeatureEnabled('inventory');
        if (inventoryEnabled) {
            for (const item of cart.items) {
                const product = await Product.findById(item.product._id || item.product);
                if (product && product.trackInventory) {
                    await product.decrementInventory(
                        item.quantity,
                        item.variant?.sku || null
                    );
                }
            }
        }

        // Clear cart
        await cart.clearCart();

        // Send confirmation email
        const emailEnabled = await configService.isFeatureEnabled('emailNotifications');
        if (emailEnabled) {
            try {
                await emailService.sendOrderConfirmationEmail(order);
            } catch (error) {
                console.error('Failed to send order confirmation email:', error);
            }
        }

        // Send admin notification
        const adminNotifEnabled = await configService.isFeatureEnabled('adminNotifications');
        if (adminNotifEnabled) {
            try {
                await emailService.sendAdminNewOrderNotification(order);
            } catch (error) {
                console.error('Failed to send admin notification:', error);
            }
        }

        // Log action
        await AuditLog.log({
            action: AUDIT_ACTIONS.ORDER_CREATE,
            actor: userId,
            resourceType: 'order',
            resourceId: order._id,
            resourceName: order.orderId,
            details: { total: order.pricing.total, itemCount: order.items.length }
        });

        return order;
    }

    /**
     * Get order by ID
     */
    async getOrderById(orderId, userId = null) {
        const order = await Order.findById(orderId)
            .populate('user', 'email profile.firstName profile.lastName')
            .populate('payment');

        if (!order) {
            throw createError.notFound('Order not found');
        }

        // If userId provided, verify ownership (unless admin)
        if (userId && !order.user._id.equals(userId)) {
            throw createError.forbidden('You do not have access to this order');
        }

        return order;
    }

    /**
     * Get order by order ID string (ORD-XXXXXXXX-XXXXXX)
     */
    async getOrderByOrderId(orderIdString) {
        const order = await Order.findOne({ orderId: orderIdString })
            .populate('user', 'email profile.firstName profile.lastName')
            .populate('payment');

        if (!order) {
            throw createError.notFound('Order not found');
        }

        return order;
    }

    /**
     * Get orders for a user
     */
    async getUserOrders(userId, options = {}) {
        const {
            page = PAGINATION.DEFAULT_PAGE,
            limit = PAGINATION.DEFAULT_LIMIT,
            status = null
        } = options;

        const filter = { user: userId };
        if (status) {
            filter.status = status;
        }

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(filter)
        ]);

        return {
            orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get all orders (admin)
     */
    async getAllOrders(options = {}) {
        const {
            page = PAGINATION.DEFAULT_PAGE,
            limit = PAGINATION.DEFAULT_LIMIT,
            status = null,
            search = null,
            startDate = null,
            endDate = null,
            sort = '-createdAt'
        } = options;

        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (search) {
            filter.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { 'shippingAddress.email': { $regex: search, $options: 'i' } },
                { 'shippingAddress.firstName': { $regex: search, $options: 'i' } },
                { 'shippingAddress.lastName': { $regex: search, $options: 'i' } }
            ];
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate('user', 'email profile.firstName profile.lastName')
                .populate('payment', 'status method provider providerPaymentId providerOrderId')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(filter)
        ]);

        return {
            orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Update order status
     */
    async updateOrderStatus(orderId, newStatus, updatedBy, note = '') {
        const order = await Order.findById(orderId);

        if (!order) {
            throw createError.notFound('Order not found');
        }

        const oldStatus = order.status;

        // If already at target status, just return the order
        if (oldStatus === newStatus) {
            return order;
        }

        try {
            await order.updateStatus(newStatus, updatedBy, note);
        } catch (error) {
            // Provide a more helpful error message
            throw createError.badRequest(error.message);
        }

        // Send status update email
        const emailEnabled = await configService.isFeatureEnabled('emailNotifications');
        if (emailEnabled) {
            try {
                if (newStatus === ORDER_STATUS.SHIPPED) {
                    await emailService.sendOrderShippedEmail(order);
                }
                // Add more status-specific emails as needed
            } catch (error) {
                console.error('Failed to send status update email:', error);
            }
        }

        // Log action
        await AuditLog.log({
            action: AUDIT_ACTIONS.ORDER_STATUS_CHANGE,
            actor: updatedBy,
            resourceType: 'order',
            resourceId: order._id,
            resourceName: order.orderId,
            details: { oldStatus, newStatus, note }
        });

        return order;
    }

    /**
     * Add tracking information
     */
    async addTracking(orderId, trackingNumber, trackingUrl, updatedBy) {
        const order = await Order.findById(orderId);

        if (!order) {
            throw createError.notFound('Order not found');
        }

        await order.addTracking(trackingNumber, trackingUrl);

        // Log action
        await AuditLog.log({
            action: AUDIT_ACTIONS.ORDER_STATUS_CHANGE,
            actor: updatedBy,
            resourceType: 'order',
            resourceId: order._id,
            resourceName: order.orderId,
            details: { action: 'tracking_added', trackingNumber }
        });

        return order;
    }

    /**
     * Add admin note
     */
    async addAdminNote(orderId, note, addedBy) {
        const order = await Order.findById(orderId);

        if (!order) {
            throw createError.notFound('Order not found');
        }

        await order.addAdminNote(note, addedBy);

        return order;
    }

    /**
     * Cancel order
     */
    async cancelOrder(orderId, cancelledBy, reason = '') {
        const order = await Order.findById(orderId);

        if (!order) {
            throw createError.notFound('Order not found');
        }

        if (!order.canCancel) {
            throw createError.badRequest('This order cannot be cancelled');
        }

        // Update status
        await order.updateStatus(ORDER_STATUS.CANCELLED, cancelledBy, reason);

        // Restore inventory
        const inventoryEnabled = await configService.isFeatureEnabled('inventory');
        if (inventoryEnabled) {
            for (const item of order.items) {
                const product = await Product.findById(item.product);
                if (product && product.trackInventory) {
                    await product.restoreInventory(
                        item.quantity,
                        item.variant?.sku || null
                    );
                }
            }
        }

        // Log action
        await AuditLog.log({
            action: AUDIT_ACTIONS.ORDER_CANCEL,
            actor: cancelledBy,
            resourceType: 'order',
            resourceId: order._id,
            resourceName: order.orderId,
            details: { reason }
        });

        return order;
    }

    /**
     * Process refund
     */
    async processRefund(orderId, amount, reason, processedBy) {
        const order = await Order.findById(orderId).populate('payment');

        if (!order) {
            throw createError.notFound('Order not found');
        }

        if (!order.canRefund) {
            throw createError.badRequest('This order cannot be refunded');
        }

        // Process payment refund if payment exists
        if (order.payment) {
            await order.payment.processRefund(amount, reason);
        }

        // Update order status
        await order.updateStatus(ORDER_STATUS.REFUNDED, processedBy, `Refund: ${reason}`);

        // Restore inventory
        const inventoryEnabled = await configService.isFeatureEnabled('inventory');
        if (inventoryEnabled) {
            for (const item of order.items) {
                const product = await Product.findById(item.product);
                if (product && product.trackInventory) {
                    await product.restoreInventory(
                        item.quantity,
                        item.variant?.sku || null
                    );
                }
            }
        }

        // Log action
        await AuditLog.log({
            action: AUDIT_ACTIONS.ORDER_REFUND,
            actor: processedBy,
            resourceType: 'order',
            resourceId: order._id,
            resourceName: order.orderId,
            details: { amount, reason }
        });

        return order;
    }

    /**
     * Get order statistics for dashboard
     */
    async getOrderStats() {
        return Order.getAdminStats();
    }

    /**
     * Get orders by status counts
     */
    async getStatusCounts() {
        const counts = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const result = {};
        for (const status of Object.values(ORDER_STATUS)) {
            result[status] = 0;
        }
        for (const item of counts) {
            result[item._id] = item.count;
        }

        return result;
    }

    /**
     * Get recent orders
     */
    async getRecentOrders(limit = 10) {
        return Order.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('user', 'email profile.firstName profile.lastName')
            .lean();
    }
}

export default new OrderService();

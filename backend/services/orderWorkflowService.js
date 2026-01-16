/**
 * Order Workflow Service
 * Orchestrates the complete order lifecycle
 */

import { Order, Cart, Payment, AuditLog } from '../models/index.js';
import orderService from './orderService.js';
import inventoryService from './inventoryService.js';
import notificationService from './notificationService.js';
import configService from './configService.js';
import { ORDER_STATUS, PAYMENT_STATUS, AUDIT_ACTIONS } from '../config/constants.js';

class OrderWorkflowService {
    /**
     * Create order from cart
     */
    async createOrderFromCart(cartId, userId, orderData) {
        const cart = await Cart.findById(cartId).populate('items.product');

        if (!cart || cart.items.length === 0) {
            throw new Error('Cart is empty or not found');
        }

        // Validate cart items
        const validation = await cart.validateForCheckout();
        if (!validation.valid) {
            throw new Error('Cart validation failed: ' + validation.errors.join(', '));
        }

        // Calculate pricing
        const pricing = await this.calculateOrderPricing(cart, orderData.shippingAddress);

        // Prepare order items - use pricePerUnit as required by Order model
        const items = cart.items.map(item => {
            const pricePerUnit = item.priceAtAdd || item.price || item.product.price;
            // Get product image - prefer stored image, fallback to product's images array
            const productImage = item.image ||
                item.product?.images?.[0]?.url ||
                (item.product?.images?.find(img => img.isPrimary)?.url) ||
                null;
            return {
                product: item.product._id,
                productName: item.productName || item.product.name,
                productSku: item.product.sku,
                productImage: productImage,
                variant: item.variant,
                quantity: item.quantity,
                pricePerUnit: pricePerUnit,
                subtotal: pricePerUnit * item.quantity
            };
        });

        // Reserve inventory
        const inventoryReservation = await inventoryService.reserveInventory(items, null);
        if (!inventoryReservation.success) {
            throw new Error('Some items are out of stock: ' +
                inventoryReservation.errors.map(e => e.error).join(', '));
        }

        try {
            // Generate order ID
            const orderId = await Order.generateOrderId();

            // Create order - payment will be linked after Payment record is created
            const order = new Order({
                orderId,
                user: userId,
                items,
                shippingAddress: orderData.shippingAddress,
                billingAddress: orderData.billingAddress || orderData.shippingAddress,
                pricing,
                status: ORDER_STATUS.PENDING,
                shippingMethod: orderData.shippingMethod || 'standard',
                discountCode: cart.discountCode,
                discountAmount: cart.discountAmount || 0
            });

            await order.save();

            // Log order creation
            await AuditLog.log({
                action: AUDIT_ACTIONS.ORDER_CREATE,
                actor: userId,
                resourceType: 'order',
                resourceId: order._id,
                resourceName: order.orderId,
                details: {
                    itemCount: items.length,
                    total: pricing.total
                }
            });

            return order;
        } catch (error) {
            // Release inventory if order creation fails
            await inventoryService.releaseInventory(items);
            throw error;
        }
    }

    /**
     * Calculate order pricing
     */
    async calculateOrderPricing(cart, shippingAddress) {
        const subtotal = cart.items.reduce((sum, item) => {
            return sum + (item.price || item.product?.price || 0) * item.quantity;
        }, 0);

        // Apply cart discount first
        const discountAmount = cart.discountAmount || 0;
        const afterDiscount = subtotal - discountAmount;

        // Use configService for shipping calculation (same as cart) for consistency
        const shippingCost = await configService.calculateShipping(afterDiscount);

        // Get tax settings from config
        const taxEnabled = await configService.get('tax.enabled', false);
        const taxRate = await configService.get('tax.rate', 0);
        const taxAmount = taxEnabled ? Math.round((afterDiscount * taxRate) / 100) : 0;

        const total = afterDiscount + shippingCost + taxAmount;

        return {
            subtotal,
            discountAmount,
            discountCode: cart.discountCode,
            shippingCost,
            taxAmount,
            taxRate: taxEnabled ? taxRate : 0,
            total
        };
    }

    /**
     * Process COD order
     */
    async processCODOrder(orderId) {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // Create Payment record for COD with pending status (will be completed on delivery)
        const payment = new Payment({
            order: order._id,
            user: order.user,
            provider: 'cod',
            method: 'cod',
            amount: order.pricing.total,
            currency: 'INR',
            status: PAYMENT_STATUS.PENDING // Will be marked as completed when delivered
        });
        await payment.save();

        // Link payment to order
        order.payment = payment._id;
        await order.save();

        // Update order status to processing
        await order.updateStatus(ORDER_STATUS.PROCESSING, null, 'COD order confirmed');

        // Confirm inventory deduction
        await inventoryService.confirmInventory(order.items, order._id);

        // Clear user's cart
        if (order.user) {
            await Cart.findOneAndDelete({ user: order.user });
        }

        // Send notifications
        await notificationService.sendOrderConfirmation(order._id);
        await notificationService.sendAdminNewOrderNotification(order._id);

        return Order.findById(orderId).populate('payment');
    }

    /**
     * Process online payment order
     */
    async processOnlinePaymentOrder(orderId, paymentDetails) {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // Find existing payment record (created during checkout) instead of creating new one
        let payment = await Payment.findOne({ order: order._id });

        if (payment) {
            // Update existing payment record
            payment.providerPaymentId = paymentDetails.paymentId;
            payment.providerOrderId = paymentDetails.orderId;
            payment.status = PAYMENT_STATUS.COMPLETED;
            payment.completedAt = new Date();
            payment.webhookVerified = true;
            await payment.save();
        } else {
            // Fallback: create payment record if not found (shouldn't happen normally)
            payment = new Payment({
                order: order._id,
                user: order.user,
                amount: order.pricing.total,
                currency: 'INR',
                provider: paymentDetails.provider,
                providerPaymentId: paymentDetails.paymentId,
                providerOrderId: paymentDetails.orderId,
                status: PAYMENT_STATUS.COMPLETED,
                completedAt: new Date()
            });
            await payment.save();
        }

        // Update order payment status
        order.payment = order.payment || {};
        order.payment.status = PAYMENT_STATUS.COMPLETED;
        order.payment.transactionId = paymentDetails.paymentId;
        order.payment.paidAt = new Date();
        await order.updateStatus(ORDER_STATUS.PROCESSING, null, 'Payment confirmed');

        // Confirm inventory
        await inventoryService.confirmInventory(order.items, order._id);

        // Clear cart
        if (order.user) {
            await Cart.findOneAndDelete({ user: order.user });
        }

        // Send notifications
        await notificationService.sendOrderConfirmation(order._id);
        await notificationService.sendAdminNewOrderNotification(order._id);

        return order;
    }

    /**
     * Handle payment failure
     */
    async handlePaymentFailure(orderId, reason = 'Payment failed') {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // Release inventory
        await inventoryService.releaseInventory(order.items, order._id);

        // Update order status
        order.payment.status = PAYMENT_STATUS.FAILED;
        order.payment.failureReason = reason;
        await order.updateStatus(ORDER_STATUS.CANCELLED, null, reason);

        return order;
    }

    /**
     * Ship order
     */
    async shipOrder(orderId, trackingInfo, actorId) {
        let order = await Order.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // Check if order is already shipped or beyond
        if (['shipped', 'delivered', 'completed'].includes(order.status)) {
            // If already shipped, just update tracking info and return
            if (trackingInfo.trackingNumber) {
                await order.addTracking(trackingInfo);
                order = await Order.findById(orderId); // Reload to get fresh state
            }
            return order;
        }

        // Check if we can transition to shipped (must be in processing status)
        if (order.status !== ORDER_STATUS.PROCESSING) {
            throw new Error(`Cannot ship order with status '${order.status}'. Order must be in 'processing' status.`);
        }

        // Add tracking info first (without saving status change)
        order.trackingNumber = trackingInfo.trackingNumber;
        if (trackingInfo.trackingUrl) {
            order.trackingUrl = trackingInfo.trackingUrl;
        }
        if (trackingInfo.carrier) {
            order.shippingMethod = trackingInfo.carrier;
        }
        await order.save();

        // Reload order to ensure we have fresh state
        order = await Order.findById(orderId);

        // Update status to shipped
        await order.updateStatus(ORDER_STATUS.SHIPPED, actorId, 'Order shipped');

        // Log action
        await AuditLog.log({
            action: AUDIT_ACTIONS.ORDER_SHIP,
            actor: actorId,
            resourceType: 'order',
            resourceId: order._id,
            resourceName: order.orderId,
            details: {
                trackingNumber: trackingInfo.trackingNumber,
                carrier: trackingInfo.carrier
            }
        });

        // Send notification
        await notificationService.sendOrderShipped(order._id);

        // Return fresh order
        return Order.findById(orderId);
    }

    /**
     * Mark order as delivered
     */
    async deliverOrder(orderId, actorId, note = '') {
        let order = await Order.findById(orderId).populate('payment');
        if (!order) {
            throw new Error('Order not found');
        }

        // Check if order can be marked as delivered (must be shipped)
        if (order.status !== ORDER_STATUS.SHIPPED) {
            throw new Error(`Cannot mark as delivered. Order must be shipped first (current status: ${order.status})`);
        }

        await order.updateStatus(ORDER_STATUS.DELIVERED, actorId, note || 'Order delivered');

        // If COD, mark payment as completed
        if (order.payment && order.payment.method === 'cod' && order.payment.status !== PAYMENT_STATUS.COMPLETED) {
            order.payment.status = PAYMENT_STATUS.COMPLETED;
            order.payment.paidAt = new Date();
            await order.payment.save();
        }

        // Log action
        await AuditLog.log({
            action: AUDIT_ACTIONS.ORDER_DELIVER,
            actor: actorId,
            resourceType: 'order',
            resourceId: order._id,
            resourceName: order.orderId
        });

        // Send notification
        await notificationService.sendOrderDelivered(order._id);

        return Order.findById(orderId);
    }

    /**
     * Cancel order
     */
    async cancelOrder(orderId, reason, actorId = null, isAdmin = false) {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // Check if order can be cancelled
        if (!isAdmin && !order.canCancel) {
            throw new Error('Order cannot be cancelled at this stage');
        }

        // Release inventory
        await inventoryService.releaseInventory(order.items, order._id, actorId);

        // Update status
        await order.updateStatus(ORDER_STATUS.CANCELLED, actorId, reason);

        // Log action
        await AuditLog.log({
            action: AUDIT_ACTIONS.ORDER_CANCEL,
            actor: actorId,
            resourceType: 'order',
            resourceId: order._id,
            resourceName: order.orderId,
            details: { reason }
        });

        // Send notification
        await notificationService.sendOrderCancelled(order._id, reason);

        return order;
    }

    /**
     * Process refund
     */
    async processRefund(orderId, refundAmount, reason, actorId) {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // Only refund if payment was online
        if (order.payment.method === 'cod') {
            throw new Error('COD orders cannot be refunded online');
        }

        // Create refund record
        const refundDetails = {
            amount: refundAmount,
            reason,
            processedAt: new Date(),
            processedBy: actorId
        };

        // Update order
        order.payment.refundAmount = (order.payment.refundAmount || 0) + refundAmount;
        order.payment.refundReason = reason;
        order.payment.refundedAt = new Date();

        if (order.payment.refundAmount >= order.pricing.total) {
            order.payment.status = PAYMENT_STATUS.REFUNDED;
            await order.updateStatus(ORDER_STATUS.REFUNDED, actorId, reason);
        }

        await order.save();

        // Release inventory if not already released
        await inventoryService.releaseInventory(order.items, order._id, actorId);

        // Log action
        await AuditLog.log({
            action: AUDIT_ACTIONS.ORDER_REFUND,
            actor: actorId,
            resourceType: 'order',
            resourceId: order._id,
            resourceName: order.orderId,
            details: { refundAmount, reason }
        });

        // Send notification
        await notificationService.sendRefundNotification(order._id, refundAmount);

        return order;
    }

    /**
     * Get order statistics
     */
    async getOrderStats(period = 'today') {
        const now = new Date();
        let startDate;

        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(0);
        }

        const stats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: { $nin: ['cancelled', 'refunded'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$pricing.total' },
                    avgOrderValue: { $avg: '$pricing.total' },
                    totalItems: { $sum: { $size: '$items' } }
                }
            }
        ]);

        const statusCounts = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        return {
            period,
            stats: stats[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0, totalItems: 0 },
            statusCounts: statusCounts.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {})
        };
    }

    /**
     * Check and send low stock alerts
     */
    async checkLowStockAlerts() {
        const threshold = await configService.get('inventory.lowStockThreshold', 5);
        const lowStockProducts = await inventoryService.getLowStockProducts(threshold);

        if (lowStockProducts.length > 0) {
            await notificationService.sendLowStockAlert(lowStockProducts);
        }

        return lowStockProducts;
    }
}

export default new OrderWorkflowService();

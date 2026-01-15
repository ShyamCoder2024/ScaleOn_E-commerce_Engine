/**
 * Notification Service
 * Handles all order-related notifications (email, etc.)
 */

import emailService from './emailService.js';
import configService from './configService.js';
import { User, Order } from '../models/index.js';

class NotificationService {
    /**
     * Send order confirmation to customer
     */
    async sendOrderConfirmation(orderId) {
        try {
            const order = await Order.findById(orderId)
                .populate('user', 'email profile.firstName');

            if (!order || !order.user?.email) {
                console.log('Cannot send confirmation: Order or user email not found');
                return { success: false, error: 'User email not found' };
            }

            const storeName = await configService.get('store.name', 'Our Store');

            await emailService.sendOrderConfirmation(order.user.email, {
                orderId: order.orderId,
                customerName: order.user.profile?.firstName || 'Customer',
                items: order.items.map(item => ({
                    name: item.productName,
                    quantity: item.quantity,
                    price: item.price / 100
                })),
                subtotal: order.pricing.subtotal / 100,
                shipping: order.pricing.shippingCost / 100,
                tax: order.pricing.taxAmount / 100,
                total: order.pricing.total / 100,
                shippingAddress: order.shippingAddress,
                estimatedDelivery: this.getEstimatedDelivery()
            });

            console.log(`Order confirmation sent for ${order.orderId}`);
            return { success: true };
        } catch (error) {
            console.error('Failed to send order confirmation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send order shipped notification
     */
    async sendOrderShipped(orderId) {
        try {
            const order = await Order.findById(orderId)
                .populate('user', 'email profile.firstName');

            if (!order || !order.user?.email) {
                return { success: false, error: 'User email not found' };
            }

            await emailService.sendOrderShipped(order.user.email, {
                orderId: order.orderId,
                customerName: order.user.profile?.firstName || 'Customer',
                trackingNumber: order.shipping?.trackingNumber,
                trackingUrl: order.shipping?.trackingUrl,
                carrier: order.shipping?.carrier || 'Our shipping partner',
                estimatedDelivery: this.getEstimatedDelivery(3)
            });

            console.log(`Shipping notification sent for ${order.orderId}`);
            return { success: true };
        } catch (error) {
            console.error('Failed to send shipping notification:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send order delivered notification
     */
    async sendOrderDelivered(orderId) {
        try {
            const order = await Order.findById(orderId)
                .populate('user', 'email profile.firstName');

            if (!order || !order.user?.email) {
                return { success: false, error: 'User email not found' };
            }

            const storeName = await configService.get('store.name', 'Our Store');

            await emailService.sendEmail({
                to: order.user.email,
                subject: `Your order ${order.orderId} has been delivered!`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1f2937;">Order Delivered! 🎉</h1>
            <p>Hi ${order.user.profile?.firstName || 'there'},</p>
            <p>Great news! Your order <strong>${order.orderId}</strong> has been delivered.</p>
            <p>We hope you love your purchase! If you have any questions or concerns, please don't hesitate to reach out.</p>
            <p style="margin-top: 20px;">Thank you for shopping with ${storeName}!</p>
          </div>
        `
            });

            console.log(`Delivery notification sent for ${order.orderId}`);
            return { success: true };
        } catch (error) {
            console.error('Failed to send delivery notification:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send order cancelled notification
     */
    async sendOrderCancelled(orderId, reason = '') {
        try {
            const order = await Order.findById(orderId)
                .populate('user', 'email profile.firstName');

            if (!order || !order.user?.email) {
                return { success: false, error: 'User email not found' };
            }

            const storeName = await configService.get('store.name', 'Our Store');

            await emailService.sendEmail({
                to: order.user.email,
                subject: `Order ${order.orderId} has been cancelled`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1f2937;">Order Cancelled</h1>
            <p>Hi ${order.user.profile?.firstName || 'there'},</p>
            <p>Your order <strong>${order.orderId}</strong> has been cancelled.</p>
            ${reason ? `<p>Reason: ${reason}</p>` : ''}
            <p>If you paid online, a refund will be processed within 5-7 business days.</p>
            <p style="margin-top: 20px;">If you have any questions, please contact our support team.</p>
            <p>Thank you,<br>${storeName}</p>
          </div>
        `
            });

            console.log(`Cancellation notification sent for ${order.orderId}`);
            return { success: true };
        } catch (error) {
            console.error('Failed to send cancellation notification:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send refund notification
     */
    async sendRefundNotification(orderId, refundAmount) {
        try {
            const order = await Order.findById(orderId)
                .populate('user', 'email profile.firstName');

            if (!order || !order.user?.email) {
                return { success: false, error: 'User email not found' };
            }

            const storeName = await configService.get('store.name', 'Our Store');

            await emailService.sendEmail({
                to: order.user.email,
                subject: `Refund processed for order ${order.orderId}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1f2937;">Refund Processed</h1>
            <p>Hi ${order.user.profile?.firstName || 'there'},</p>
            <p>A refund of <strong>₹${(refundAmount / 100).toFixed(2)}</strong> has been processed for your order <strong>${order.orderId}</strong>.</p>
            <p>The refund will appear in your account within 5-7 business days, depending on your bank.</p>
            <p style="margin-top: 20px;">If you have any questions, please contact our support team.</p>
            <p>Thank you,<br>${storeName}</p>
          </div>
        `
            });

            console.log(`Refund notification sent for ${order.orderId}`);
            return { success: true };
        } catch (error) {
            console.error('Failed to send refund notification:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send new order notification to admin
     */
    async sendAdminNewOrderNotification(orderId) {
        try {
            const order = await Order.findById(orderId)
                .populate('user', 'email profile.firstName profile.lastName');

            if (!order) {
                return { success: false, error: 'Order not found' };
            }

            await emailService.sendAdminNewOrderNotification({
                orderId: order.orderId,
                customerName: `${order.user?.profile?.firstName || ''} ${order.user?.profile?.lastName || ''}`.trim() || 'Guest',
                customerEmail: order.user?.email,
                total: order.pricing.total / 100,
                itemCount: order.items.length
            });

            console.log(`Admin notification sent for ${order.orderId}`);
            return { success: true };
        } catch (error) {
            console.error('Failed to send admin notification:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send order status update notification
     */
    async sendStatusUpdate(orderId, newStatus, note = '') {
        try {
            const order = await Order.findById(orderId)
                .populate('user', 'email profile.firstName');

            if (!order || !order.user?.email) {
                return { success: false, error: 'User email not found' };
            }

            const statusMessages = {
                processing: 'is now being processed',
                shipped: 'has been shipped',
                delivered: 'has been delivered',
                completed: 'is complete',
                on_hold: 'is on hold',
                cancelled: 'has been cancelled',
                refunded: 'has been refunded'
            };

            const message = statusMessages[newStatus] || `status updated to ${newStatus}`;
            const storeName = await configService.get('store.name', 'Our Store');

            await emailService.sendEmail({
                to: order.user.email,
                subject: `Order ${order.orderId} ${message}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1f2937;">Order Update</h1>
            <p>Hi ${order.user.profile?.firstName || 'there'},</p>
            <p>Your order <strong>${order.orderId}</strong> ${message}.</p>
            ${note ? `<p>Note: ${note}</p>` : ''}
            ${order.shipping?.trackingNumber ? `
              <p>Tracking Number: <strong>${order.shipping.trackingNumber}</strong></p>
              ${order.shipping.trackingUrl ? `<p><a href="${order.shipping.trackingUrl}">Track your order →</a></p>` : ''}
            ` : ''}
            <p style="margin-top: 20px;">Thank you for shopping with ${storeName}!</p>
          </div>
        `
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to send status update:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send low stock alert to admin
     */
    async sendLowStockAlert(products) {
        try {
            const adminEmail = await configService.get('store.email');
            if (!adminEmail) {
                return { success: false, error: 'Admin email not configured' };
            }

            const storeName = await configService.get('store.name', 'Our Store');

            const productList = products.map(p =>
                `<li>${p.name} (SKU: ${p.sku}) - ${p.inventory} remaining</li>`
            ).join('');

            await emailService.sendEmail({
                to: adminEmail,
                subject: `⚠️ Low Stock Alert - ${products.length} products`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b;">Low Stock Alert</h1>
            <p>The following products are running low on stock:</p>
            <ul>${productList}</ul>
            <p><a href="${process.env.FRONTEND_URL}/admin/products">View in Admin Panel →</a></p>
          </div>
        `
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to send low stock alert:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Helper: Get estimated delivery date
     */
    getEstimatedDelivery(daysFromNow = 7) {
        const date = new Date();
        date.setDate(date.getDate() + daysFromNow);
        return date.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

export default new NotificationService();

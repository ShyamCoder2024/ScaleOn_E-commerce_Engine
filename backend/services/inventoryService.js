/**
 * Inventory Service
 * Manages product inventory operations
 */

import { Product, AuditLog } from '../models/index.js';
import { AUDIT_ACTIONS } from '../config/constants.js';

class InventoryService {
    /**
     * Reserve inventory for an order (before payment)
     */
    async reserveInventory(items, orderId) {
        const reservations = [];
        const errors = [];

        for (const item of items) {
            try {
                const product = await Product.findById(item.product);

                if (!product) {
                    errors.push({ productId: item.product, error: 'Product not found' });
                    continue;
                }

                // Check if product has variants
                if (item.variantId && product.hasVariants) {
                    const variant = product.variants.id(item.variantId);
                    if (!variant) {
                        errors.push({ productId: item.product, error: 'Variant not found' });
                        continue;
                    }

                    if (variant.inventory < item.quantity) {
                        errors.push({
                            productId: item.product,
                            variantId: item.variantId,
                            error: 'Insufficient stock',
                            available: variant.inventory,
                            requested: item.quantity
                        });
                        continue;
                    }

                    // Reserve variant inventory
                    variant.inventory -= item.quantity;
                    await product.save();

                    reservations.push({
                        productId: item.product,
                        variantId: item.variantId,
                        quantity: item.quantity
                    });
                } else {
                    // Non-variant product
                    if (product.trackInventory && product.inventory < item.quantity) {
                        errors.push({
                            productId: item.product,
                            error: 'Insufficient stock',
                            available: product.inventory,
                            requested: item.quantity
                        });
                        continue;
                    }

                    if (product.trackInventory) {
                        product.inventory -= item.quantity;
                        await product.save();
                    }

                    reservations.push({
                        productId: item.product,
                        quantity: item.quantity
                    });
                }
            } catch (error) {
                errors.push({ productId: item.product, error: error.message });
            }
        }

        return { reservations, errors, success: errors.length === 0 };
    }

    /**
     * Release reserved inventory (if order cancelled/failed)
     */
    async releaseInventory(items, orderId, actorId = null) {
        for (const item of items) {
            try {
                const product = await Product.findById(item.product);

                if (!product) continue;

                if (item.variantId && product.hasVariants) {
                    const variant = product.variants.id(item.variantId);
                    if (variant) {
                        variant.inventory += item.quantity;
                        await product.save();
                    }
                } else if (product.trackInventory) {
                    product.inventory += item.quantity;
                    await product.save();
                }

                // Log the release
                if (actorId) {
                    await AuditLog.log({
                        action: AUDIT_ACTIONS.INVENTORY_UPDATE,
                        actor: actorId,
                        resourceType: 'product',
                        resourceId: product._id,
                        resourceName: product.name,
                        details: {
                            change: `+${item.quantity}`,
                            reason: 'Order cancelled/refunded',
                            orderId: orderId?.toString()
                        }
                    });
                }
            } catch (error) {
                console.error('Failed to release inventory:', error);
            }
        }
    }

    /**
     * Confirm inventory deduction (after successful payment)
     */
    async confirmInventory(items, orderId, actorId = null) {
        for (const item of items) {
            try {
                const product = await Product.findById(item.product);

                if (!product) continue;

                // Update sales count
                product.salesCount = (product.salesCount || 0) + item.quantity;
                await product.save();

                // Log the confirmation
                if (actorId) {
                    await AuditLog.log({
                        action: AUDIT_ACTIONS.INVENTORY_UPDATE,
                        actor: actorId,
                        resourceType: 'product',
                        resourceId: product._id,
                        resourceName: product.name,
                        details: {
                            change: `-${item.quantity}`,
                            reason: 'Order confirmed',
                            orderId: orderId?.toString()
                        }
                    });
                }
            } catch (error) {
                console.error('Failed to confirm inventory:', error);
            }
        }
    }

    /**
     * Get stock status for a product
     */
    async getStockStatus(productId, variantId = null) {
        const product = await Product.findById(productId);

        if (!product) {
            return { exists: false, inStock: false, quantity: 0 };
        }

        if (variantId && product.hasVariants) {
            const variant = product.variants.id(variantId);
            if (!variant) {
                return { exists: false, inStock: false, quantity: 0 };
            }
            return {
                exists: true,
                inStock: variant.inventory > 0,
                quantity: variant.inventory,
                lowStock: variant.inventory <= (product.lowStockThreshold || 5)
            };
        }

        return {
            exists: true,
            inStock: !product.trackInventory || product.inventory > 0,
            quantity: product.trackInventory ? product.inventory : Infinity,
            lowStock: product.trackInventory && product.inventory <= (product.lowStockThreshold || 5)
        };
    }

    /**
     * Bulk update inventory
     */
    async bulkUpdateInventory(updates, actorId) {
        const results = [];

        for (const update of updates) {
            try {
                const product = await Product.findById(update.productId);

                if (!product) {
                    results.push({ productId: update.productId, success: false, error: 'Not found' });
                    continue;
                }

                const previousInventory = product.inventory;

                if (update.variantId && product.hasVariants) {
                    const variant = product.variants.id(update.variantId);
                    if (!variant) {
                        results.push({ productId: update.productId, success: false, error: 'Variant not found' });
                        continue;
                    }

                    if (update.action === 'set') {
                        variant.inventory = update.quantity;
                    } else if (update.action === 'add') {
                        variant.inventory += update.quantity;
                    } else if (update.action === 'subtract') {
                        variant.inventory = Math.max(0, variant.inventory - update.quantity);
                    }
                } else {
                    if (update.action === 'set') {
                        product.inventory = update.quantity;
                    } else if (update.action === 'add') {
                        product.inventory += update.quantity;
                    } else if (update.action === 'subtract') {
                        product.inventory = Math.max(0, product.inventory - update.quantity);
                    }
                }

                await product.save();

                // Log the update
                await AuditLog.log({
                    action: AUDIT_ACTIONS.INVENTORY_UPDATE,
                    actor: actorId,
                    resourceType: 'product',
                    resourceId: product._id,
                    resourceName: product.name,
                    details: {
                        previousInventory,
                        newInventory: product.inventory,
                        action: update.action,
                        quantity: update.quantity
                    }
                });

                results.push({ productId: update.productId, success: true });
            } catch (error) {
                results.push({ productId: update.productId, success: false, error: error.message });
            }
        }

        return results;
    }

    /**
     * Get low stock products
     */
    async getLowStockProducts(threshold = 5, limit = 50) {
        return await Product.find({
            status: 'active',
            trackInventory: true,
            inventory: { $lte: threshold, $gt: 0 }
        })
            .sort({ inventory: 1 })
            .limit(limit)
            .select('name sku inventory lowStockThreshold images')
            .lean();
    }

    /**
     * Get out of stock products
     */
    async getOutOfStockProducts(limit = 50) {
        return await Product.find({
            status: 'active',
            trackInventory: true,
            inventory: { $lte: 0 }
        })
            .sort({ updatedAt: -1 })
            .limit(limit)
            .select('name sku inventory images')
            .lean();
    }

    /**
     * Check if items are available
     */
    async checkAvailability(items) {
        const results = [];

        for (const item of items) {
            const status = await this.getStockStatus(item.productId, item.variantId);
            results.push({
                ...item,
                ...status,
                available: status.inStock && status.quantity >= item.quantity
            });
        }

        return {
            items: results,
            allAvailable: results.every(r => r.available)
        };
    }
}

export default new InventoryService();

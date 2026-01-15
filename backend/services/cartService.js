import { Cart, Product } from '../models/index.js';
import { createError } from '../middleware/errorHandler.js';
import configService from './configService.js';

/**
 * Cart Service
 * Handles shopping cart operations
 */
class CartService {
    /**
     * Get or create cart for user/session
     */
    async getCart(userId = null, sessionId = null) {
        if (!userId && !sessionId) {
            throw createError.badRequest('User ID or Session ID is required');
        }

        const cart = await Cart.getOrCreate(userId, sessionId);
        return this.populateCart(cart);
    }

    /**
     * Populate cart with product details
     */
    async populateCart(cart) {
        await cart.populate({
            path: 'items.product',
            select: 'name slug price images status trackInventory inventory hasVariants variants'
        });

        return cart;
    }

    /**
     * Add item to cart
     */
    async addToCart(userId = null, sessionId = null, productId, quantity = 1, variant = null) {
        const cart = await Cart.getOrCreate(userId, sessionId);

        await cart.addItem(productId, quantity, variant);

        return this.populateCart(cart);
    }

    /**
     * Update item quantity in cart
     */
    async updateCartItem(userId = null, sessionId = null, itemId, quantity) {
        const cart = await this.getCartRaw(userId, sessionId);

        if (!cart) {
            throw createError.notFound('Cart not found');
        }

        await cart.updateItemQuantity(itemId, quantity);

        return this.populateCart(cart);
    }

    /**
     * Remove item from cart
     */
    async removeFromCart(userId = null, sessionId = null, itemId) {
        const cart = await this.getCartRaw(userId, sessionId);

        if (!cart) {
            throw createError.notFound('Cart not found');
        }

        await cart.removeItem(itemId);

        return this.populateCart(cart);
    }

    /**
     * Clear cart
     */
    async clearCart(userId = null, sessionId = null) {
        const cart = await this.getCartRaw(userId, sessionId);

        if (!cart) {
            throw createError.notFound('Cart not found');
        }

        await cart.clearCart();

        return this.populateCart(cart);
    }

    /**
     * Apply discount code
     */
    async applyDiscount(userId = null, sessionId = null, discountCode) {
        const cart = await this.getCartRaw(userId, sessionId);

        if (!cart) {
            throw createError.notFound('Cart not found');
        }

        // Check if discounts feature is enabled
        const discountsEnabled = await configService.isFeatureEnabled('discounts');
        if (!discountsEnabled) {
            throw createError.badRequest('Discounts are not enabled');
        }

        // TODO: Implement discount validation and calculation
        // For now, we'll just store the code
        cart.discountCode = discountCode.toUpperCase();
        cart.discountAmount = 0; // Calculate based on discount rules

        await cart.save();

        return this.populateCart(cart);
    }

    /**
     * Remove discount code
     */
    async removeDiscount(userId = null, sessionId = null) {
        const cart = await this.getCartRaw(userId, sessionId);

        if (!cart) {
            throw createError.notFound('Cart not found');
        }

        cart.discountCode = null;
        cart.discountAmount = 0;

        await cart.save();

        return this.populateCart(cart);
    }

    /**
     * Validate cart for checkout
     */
    async validateCart(userId = null, sessionId = null) {
        const cart = await this.getCartRaw(userId, sessionId);

        if (!cart) {
            throw createError.notFound('Cart not found');
        }

        if (!cart.items || cart.items.length === 0) {
            throw createError.badRequest('Cart is empty');
        }

        const validation = await cart.validateForCheckout();

        if (validation.unavailableItems.length > 0 || validation.priceChanges.length > 0) {
            await cart.save();
        }

        return {
            valid: validation.valid,
            errors: validation.errors,
            priceChanges: validation.priceChanges,
            unavailableItems: validation.unavailableItems,
            cart: await this.populateCart(cart)
        };
    }

    /**
     * Calculate cart totals
     */
    async calculateTotals(userId = null, sessionId = null) {
        const cart = await this.getCart(userId, sessionId);

        // Calculate subtotal from populated items
        let subtotal = 0;
        for (const item of cart.items) {
            const price = item.product?.price || item.priceAtAdd;
            subtotal += price * item.quantity;
        }

        // Get config for calculations
        const discountAmount = cart.discountAmount || 0;
        const afterDiscount = subtotal - discountAmount;

        const shippingCost = await configService.calculateShipping(afterDiscount);
        const taxAmount = await configService.calculateTax(afterDiscount);

        const total = afterDiscount + shippingCost + taxAmount;

        return {
            itemCount: cart.itemCount,
            subtotal,
            discountCode: cart.discountCode,
            discountAmount,
            shippingCost,
            taxAmount,
            total
        };
    }

    /**
     * Merge guest cart with user cart (on login)
     */
    async mergeGuestCart(userId, sessionId) {
        if (!userId || !sessionId) {
            return null;
        }

        const [userCart, guestCart] = await Promise.all([
            Cart.findOne({ user: userId }),
            Cart.findOne({ sessionId, user: null })
        ]);

        if (!guestCart || guestCart.items.length === 0) {
            // No guest cart or empty, just return user cart
            if (guestCart) {
                await guestCart.deleteOne();
            }
            return userCart ? this.populateCart(userCart) : null;
        }

        if (!userCart) {
            // No user cart, assign guest cart to user
            guestCart.user = userId;
            guestCart.sessionId = null;
            await guestCart.save();
            return this.populateCart(guestCart);
        }

        // Merge guest cart into user cart
        const mergedCart = await guestCart.mergeWith(userCart);
        return this.populateCart(mergedCart);
    }

    /**
     * Transfer guest cart to user (after registration)
     */
    async transferToUser(userId, sessionId) {
        if (!sessionId) return null;

        const guestCart = await Cart.findOne({ sessionId, user: null });

        if (!guestCart) return null;

        guestCart.user = userId;
        guestCart.sessionId = null;
        await guestCart.save();

        return this.populateCart(guestCart);
    }

    /**
     * Get raw cart without population
     */
    async getCartRaw(userId = null, sessionId = null) {
        if (!userId && !sessionId) {
            return null;
        }

        const filter = userId ? { user: userId } : { sessionId };
        return Cart.findOne(filter);
    }

    /**
     * Get cart summary (for header display)
     */
    async getCartSummary(userId = null, sessionId = null) {
        const cart = await this.getCartRaw(userId, sessionId);

        if (!cart) {
            return { itemCount: 0, subtotal: 0 };
        }

        return {
            itemCount: cart.itemCount,
            subtotal: cart.items.reduce((sum, item) => sum + (item.priceAtAdd * item.quantity), 0)
        };
    }
}

export default new CartService();

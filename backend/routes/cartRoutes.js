import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import cartService from '../services/cartService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { addToCartValidator, updateCartItemValidator } from '../middleware/validation.js';

const router = express.Router();

/**
 * Get session ID from cookies or create new one
 */
const getSessionId = (req, res) => {
    let sessionId = req.cookies?.sessionId;

    if (!sessionId && !req.user) {
        sessionId = uuidv4();
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
    }

    return sessionId;
};

/**
 * @route   GET /api/cart
 * @desc    Get current cart
 * @access  Public (with optional auth)
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
    const sessionId = getSessionId(req, res);
    const userId = req.user?._id || null;

    const cart = await cartService.getCart(userId, sessionId);
    const totals = await cartService.calculateTotals(userId, sessionId);

    res.json({
        success: true,
        data: {
            cart,
            ...totals
        }
    });
}));

/**
 * @route   GET /api/cart/summary
 * @desc    Get cart summary (for header)
 * @access  Public (with optional auth)
 */
router.get('/summary', optionalAuth, asyncHandler(async (req, res) => {
    const sessionId = getSessionId(req, res);
    const userId = req.user?._id || null;

    const summary = await cartService.getCartSummary(userId, sessionId);

    res.json({
        success: true,
        data: summary
    });
}));

/**
 * @route   POST /api/cart/add
 * @desc    Add item to cart
 * @access  Public (with optional auth)
 */
router.post('/add', optionalAuth, addToCartValidator, asyncHandler(async (req, res) => {
    const sessionId = getSessionId(req, res);
    const userId = req.user?._id || null;
    const { productId, quantity, variant } = req.body;

    const cart = await cartService.addToCart(userId, sessionId, productId, quantity, variant);
    const totals = await cartService.calculateTotals(userId, sessionId);

    res.json({
        success: true,
        message: 'Item added to cart',
        data: {
            cart,
            ...totals
        }
    });
}));

/**
 * @route   PUT /api/cart/items/:itemId
 * @desc    Update item quantity
 * @access  Public (with optional auth)
 */
router.put('/items/:itemId', optionalAuth, updateCartItemValidator, asyncHandler(async (req, res) => {
    const sessionId = req.cookies?.sessionId;
    const userId = req.user?._id || null;
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await cartService.updateCartItem(userId, sessionId, itemId, quantity);
    const totals = await cartService.calculateTotals(userId, sessionId);

    res.json({
        success: true,
        message: quantity > 0 ? 'Cart updated' : 'Item removed from cart',
        data: {
            cart,
            ...totals
        }
    });
}));

/**
 * @route   DELETE /api/cart/items/:itemId
 * @desc    Remove item from cart
 * @access  Public (with optional auth)
 */
router.delete('/items/:itemId', optionalAuth, asyncHandler(async (req, res) => {
    const sessionId = req.cookies?.sessionId;
    const userId = req.user?._id || null;
    const { itemId } = req.params;

    const cart = await cartService.removeFromCart(userId, sessionId, itemId);
    const totals = await cartService.calculateTotals(userId, sessionId);

    res.json({
        success: true,
        message: 'Item removed from cart',
        data: {
            cart,
            ...totals
        }
    });
}));

/**
 * @route   DELETE /api/cart
 * @desc    Clear cart
 * @access  Public (with optional auth)
 */
router.delete('/', optionalAuth, asyncHandler(async (req, res) => {
    const sessionId = req.cookies?.sessionId;
    const userId = req.user?._id || null;

    await cartService.clearCart(userId, sessionId);

    res.json({
        success: true,
        message: 'Cart cleared',
        data: {
            cart: { items: [] },
            itemCount: 0,
            subtotal: 0,
            total: 0
        }
    });
}));

/**
 * @route   POST /api/cart/discount
 * @desc    Apply discount code
 * @access  Public (with optional auth)
 */
router.post('/discount', optionalAuth, asyncHandler(async (req, res) => {
    const sessionId = req.cookies?.sessionId;
    const userId = req.user?._id || null;
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({
            success: false,
            message: 'Discount code is required'
        });
    }

    const cart = await cartService.applyDiscount(userId, sessionId, code);
    const totals = await cartService.calculateTotals(userId, sessionId);

    res.json({
        success: true,
        message: 'Discount applied',
        data: {
            cart,
            ...totals
        }
    });
}));

/**
 * @route   DELETE /api/cart/discount
 * @desc    Remove discount code
 * @access  Public (with optional auth)
 */
router.delete('/discount', optionalAuth, asyncHandler(async (req, res) => {
    const sessionId = req.cookies?.sessionId;
    const userId = req.user?._id || null;

    const cart = await cartService.removeDiscount(userId, sessionId);
    const totals = await cartService.calculateTotals(userId, sessionId);

    res.json({
        success: true,
        message: 'Discount removed',
        data: {
            cart,
            ...totals
        }
    });
}));

/**
 * @route   POST /api/cart/validate
 * @desc    Validate cart before checkout
 * @access  Private
 */
router.post('/validate', protect, asyncHandler(async (req, res) => {
    const validation = await cartService.validateCart(req.user._id, null);

    res.json({
        success: true,
        data: validation
    });
}));

export default router;

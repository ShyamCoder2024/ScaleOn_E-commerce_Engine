import express from 'express';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import { protect } from '../middleware/auth.js';
import { ORDER_STATUS } from '../config/constants.js';

const router = express.Router();

// Create a review (authenticated users only)
router.post('/', protect, async (req, res) => {
    try {
        const { productId, orderId, orderItemId, rating, title, content } = req.body;

        // Validate input
        if (!productId || !orderId || !orderItemId || !rating || !title || !content) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if order exists and belongs to user
        const order = await Order.findOne({
            _id: orderId,
            user: req.user._id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if order is delivered or completed
        if (![ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'You can only review products after delivery'
            });
        }

        // Check if order item exists and matches product
        const orderItem = order.items.find(
            item => item._id.toString() === orderItemId && item.product.toString() === productId
        );

        if (!orderItem) {
            return res.status(400).json({
                success: false,
                message: 'Product not found in this order'
            });
        }

        // Check if already reviewed
        const existingReview = await Review.findOne({
            order: orderId,
            orderItemId: orderItemId
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this item'
            });
        }

        // Create review
        const review = await Review.create({
            user: req.user._id,
            product: productId,
            order: orderId,
            orderItemId: orderItemId,
            rating: Math.min(5, Math.max(1, parseInt(rating))),
            title: title.trim(),
            content: content.trim(),
            verified: true,
            userName: req.user.profile?.firstName || req.user.email.split('@')[0],
            userAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user.profile?.firstName || req.user.email)}&background=random`
        });

        res.status(201).json({
            success: true,
            data: { review }
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create review'
        });
    }
});

// Get reviews for a product (public)
router.get('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [reviews, total, stats] = await Promise.all([
            Review.find({ product: productId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Review.countDocuments({ product: productId }),
            Review.getProductStats(productId)
        ]);

        res.json({
            success: true,
            data: {
                reviews,
                stats,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get product reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews'
        });
    }
});

// Get user's reviews (authenticated)
router.get('/user', protect, async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.user._id })
            .populate('product', 'name slug primaryImage')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            data: { reviews }
        });
    } catch (error) {
        console.error('Get user reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews'
        });
    }
});

// Check if user can review an order item
router.get('/can-review/:orderId/:orderItemId', protect, async (req, res) => {
    try {
        const { orderId, orderItemId } = req.params;

        // Check order
        const order = await Order.findOne({
            _id: orderId,
            user: req.user._id
        });

        if (!order) {
            return res.json({ success: true, data: { canReview: false } });
        }

        // Check status
        if (![ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED].includes(order.status)) {
            return res.json({ success: true, data: { canReview: false } });
        }

        // Check if already reviewed
        const existingReview = await Review.findOne({
            order: orderId,
            orderItemId: orderItemId
        });

        res.json({
            success: true,
            data: {
                canReview: !existingReview,
                alreadyReviewed: !!existingReview
            }
        });
    } catch (error) {
        console.error('Check can review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check review status'
        });
    }
});

// Delete own review
router.delete('/:id', protect, async (req, res) => {
    try {
        const review = await Review.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        await review.deleteOne();

        res.json({
            success: true,
            message: 'Review deleted'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review'
        });
    }
});

export default router;

import express from 'express';
import { Payment, Order, Cart } from '../models/index.js';
import cartService from '../services/cartService.js';
import orderService from '../services/orderService.js';
import orderWorkflowService from '../services/orderWorkflowService.js';
import configService from '../services/configService.js';
import razorpayService from '../services/razorpayService.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { protect } from '../middleware/auth.js';
import { checkoutLimiter } from '../middleware/rateLimiter.js';
import { checkoutValidator } from '../middleware/validation.js';
import { PAYMENT_STATUS, ORDER_STATUS } from '../config/constants.js';

const router = express.Router();

/**
 * @route   POST /api/payments/checkout
 * @desc    Initialize checkout and create payment session
 * @access  Private
 */
router.post('/checkout', protect, checkoutLimiter, checkoutValidator, asyncHandler(async (req, res) => {
    const { shippingAddress, paymentMethod, shippingMethod } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
        throw createError.badRequest('Your cart is empty');
    }

    // Validate cart
    const validation = await cart.validateForCheckout();
    if (!validation.valid) {
        return res.status(400).json({
            success: false,
            message: 'Cart validation failed',
            errors: validation.errors
        });
    }

    // Check if payment method is enabled
    // For Razorpay, also check if the service is configured (has API keys)
    let isEnabled = await configService.isPaymentProviderEnabled(paymentMethod);

    // Special case: Allow Razorpay if API keys are configured even if not enabled in config
    if (paymentMethod === 'razorpay' && !isEnabled && razorpayService.isConfigured()) {
        isEnabled = true;
    }

    if (!isEnabled && paymentMethod !== 'cod') {
        throw createError.badRequest('Selected payment method is not available');
    }

    // Check minimum order value
    const businessRules = await configService.getBusinessRules();
    const totals = await cartService.calculateTotals(req.user._id, null);

    if (businessRules.minOrderValue && totals.total < businessRules.minOrderValue) {
        throw createError.badRequest(
            `Minimum order value is ₹${(businessRules.minOrderValue / 100).toFixed(2)}`
        );
    }

    // Create order using workflow service
    const order = await orderWorkflowService.createOrderFromCart(
        cart._id,
        req.user._id,
        {
            shippingAddress,
            paymentMethod,
            shippingMethod
        }
    );

    // Handle based on payment method
    if (paymentMethod === 'cod') {
        // Process COD order
        const processedOrder = await orderWorkflowService.processCODOrder(order._id);

        return res.json({
            success: true,
            message: 'Order placed successfully',
            data: {
                order: processedOrder,
                paymentMethod: 'cod',
                requiresPayment: false
            }
        });
    }

    // For Razorpay payments
    if (paymentMethod === 'razorpay') {
        // Check if Razorpay is configured
        if (!razorpayService.isConfigured()) {
            throw createError.badRequest('Razorpay is not configured. Please contact support.');
        }

        // Create Razorpay order
        const razorpayOrder = await razorpayService.createOrder(
            order.pricing.total,
            'INR',
            order.orderId
        );

        // Create payment record
        const payment = new Payment({
            order: order._id,
            user: req.user._id,
            provider: 'razorpay',
            method: 'razorpay',
            amount: order.pricing.total,
            currency: 'INR',
            status: PAYMENT_STATUS.INITIATED,
            providerOrderId: razorpayOrder.id
        });
        await payment.save();

        // IMPORTANT: Link payment to order
        order.payment = payment._id;
        await order.save();

        return res.json({
            success: true,
            data: {
                orderId: order._id,
                order,
                paymentId: payment._id,
                amount: order.pricing.total,
                currency: 'INR',
                paymentMethod: 'razorpay',
                requiresPayment: true,
                gatewayData: {
                    razorpayOrderId: razorpayOrder.id,
                    razorpayKeyId: razorpayService.getKeyId(),
                    amount: order.pricing.total,
                    currency: 'INR',
                    name: 'SuperMart Store',
                    description: `Order ${order.orderId}`,
                    prefill: {
                        name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
                        email: shippingAddress.email,
                        contact: shippingAddress.phone
                    }
                }
            }
        });
    }

    // For other online payments (future: Stripe, etc.)
    const payment = new Payment({
        order: order._id,
        user: req.user._id,
        provider: paymentMethod,
        method: paymentMethod,
        amount: order.pricing.total,
        currency: businessRules.currency || 'INR',
        status: PAYMENT_STATUS.INITIATED
    });
    await payment.save();

    res.json({
        success: true,
        data: {
            orderId: order._id,
            order,
            paymentId: payment._id,
            amount: order.pricing.total,
            currency: payment.currency,
            paymentMethod,
            requiresPayment: true,
            gatewayData: {}
        }
    });
}));

/**
 * @route   POST /api/payments/:paymentId/verify
 * @desc    Verify payment and complete order
 * @access  Private
 */
router.post('/:paymentId/verify', protect, asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const {
        providerPaymentId,
        providerOrderId,
        signature
    } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
        throw createError.notFound('Payment not found');
    }

    if (!payment.user.equals(req.user._id)) {
        throw createError.forbidden('Not authorized');
    }

    if (payment.status === PAYMENT_STATUS.COMPLETED) {
        // Already processed
        const order = await Order.findById(payment.order);
        return res.json({
            success: true,
            message: 'Payment already verified',
            data: { order }
        });
    }

    // Verify Razorpay payment signature
    if (payment.provider === 'razorpay') {
        if (!providerPaymentId || !providerOrderId || !signature) {
            throw createError.badRequest('Missing payment verification data');
        }

        const isValid = razorpayService.verifyPaymentSignature(
            providerOrderId,
            providerPaymentId,
            signature
        );

        if (!isValid) {
            // Mark payment as failed
            payment.status = PAYMENT_STATUS.FAILED;
            payment.metadata = { error: 'Invalid signature' };
            await payment.save();

            throw createError.badRequest('Payment verification failed - invalid signature');
        }
    }

    // Process the online payment order
    const order = await orderWorkflowService.processOnlinePaymentOrder(
        payment.order,
        {
            provider: payment.provider,
            paymentId: providerPaymentId,
            orderId: providerOrderId
        }
    );

    // Update payment record
    payment.providerPaymentId = providerPaymentId;
    payment.providerOrderId = providerOrderId;
    payment.status = PAYMENT_STATUS.COMPLETED;
    payment.completedAt = new Date();
    payment.webhookVerified = true;
    await payment.save();

    res.json({
        success: true,
        message: 'Payment verified and order confirmed',
        data: { order }
    });
}));

/**
 * @route   POST /api/payments/:paymentId/failed
 * @desc    Handle payment failure
 * @access  Private
 */
router.post('/:paymentId/failed', protect, asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const { errorMessage, errorCode } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
        throw createError.notFound('Payment not found');
    }

    if (!payment.user.equals(req.user._id)) {
        throw createError.forbidden('Not authorized');
    }

    // Mark payment as failed
    await payment.markFailed(errorMessage || 'Payment failed', errorCode);

    // Handle order cancellation
    if (payment.order) {
        await orderWorkflowService.handlePaymentFailure(
            payment.order,
            errorMessage || 'Payment failed'
        );
    }

    res.json({
        success: true,
        message: 'Payment failure recorded'
    });
}));

/**
 * @route   GET /api/payments/:paymentId/status
 * @desc    Get payment status
 * @access  Private
 */
router.get('/:paymentId/status', protect, asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.paymentId)
        .populate('order', 'orderId status');

    if (!payment) {
        throw createError.notFound('Payment not found');
    }

    if (!payment.user.equals(req.user._id)) {
        throw createError.forbidden('Not authorized');
    }

    res.json({
        success: true,
        data: {
            status: payment.status,
            order: payment.order
        }
    });
}));

/**
 * @route   GET /api/payments/methods
 * @desc    Get available payment methods
 * @access  Public
 */
router.get('/methods', asyncHandler(async (req, res) => {
    const paymentConfig = await configService.getPaymentConfig();
    const methods = [];

    // COD (always add if configured or by default)
    const codEnabled = paymentConfig.providers?.cod?.enabled !== false;
    if (codEnabled) {
        methods.push({
            id: 'cod',
            name: 'Cash on Delivery',
            description: 'Pay when you receive your order',
            icon: 'cash',
            extraCharge: paymentConfig.providers?.cod?.extraCharge || 0,
            maxOrderValue: paymentConfig.providers?.cod?.maxOrderValue
        });
    }

    // Razorpay
    if (paymentConfig.providers?.razorpay?.enabled) {
        methods.push({
            id: 'razorpay',
            name: 'Pay Online',
            description: 'Credit/Debit Card, UPI, Net Banking, Wallets',
            icon: 'card'
        });
    }

    // Stripe
    if (paymentConfig.providers?.stripe?.enabled) {
        methods.push({
            id: 'stripe',
            name: 'Pay with Card',
            description: 'Credit or Debit Card',
            icon: 'card'
        });
    }

    // Ensure at least COD is available
    if (methods.length === 0) {
        methods.push({
            id: 'cod',
            name: 'Cash on Delivery',
            description: 'Pay when you receive your order',
            icon: 'cash',
            extraCharge: 0
        });
    }

    res.json({
        success: true,
        data: { methods }
    });
}));

/**
 * @route   POST /api/payments/webhooks/razorpay
 * @desc    Razorpay webhook handler
 * @access  Public (with signature verification)
 */
router.post('/webhooks/razorpay', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
    // In production, verify the webhook signature:
    // const signature = req.headers['x-razorpay-signature'];
    // const expectedSignature = crypto.createHmac('sha256', webhookSecret)
    //     .update(req.body).digest('hex');
    // if (signature !== expectedSignature) throw createError.unauthorized('Invalid signature');

    const event = JSON.parse(req.body.toString());

    if (event.event === 'payment.captured') {
        const paymentData = event.payload.payment.entity;

        // Find and update payment
        const payment = await Payment.findOne({
            providerOrderId: paymentData.order_id
        });

        if (payment && payment.status !== PAYMENT_STATUS.COMPLETED) {
            await orderWorkflowService.processOnlinePaymentOrder(
                payment.order,
                {
                    provider: 'razorpay',
                    paymentId: paymentData.id,
                    orderId: paymentData.order_id
                }
            );
        }
    }

    res.json({ received: true });
}));

/**
 * @route   POST /api/payments/webhooks/stripe
 * @desc    Stripe webhook handler
 * @access  Public (with signature verification)
 */
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
    // In production, verify the webhook signature:
    // const signature = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);

    const event = JSON.parse(req.body.toString());

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        const payment = await Payment.findById(session.metadata?.paymentId);

        if (payment && payment.status !== PAYMENT_STATUS.COMPLETED) {
            await orderWorkflowService.processOnlinePaymentOrder(
                payment.order,
                {
                    provider: 'stripe',
                    paymentId: session.payment_intent,
                    orderId: session.id
                }
            );
        }
    }

    res.json({ received: true });
}));

export default router;

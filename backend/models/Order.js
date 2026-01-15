import mongoose from 'mongoose';
import { ORDER_STATUS, ORDER_STATUS_TRANSITIONS } from '../config/constants.js';
import { v4 as uuidv4 } from 'uuid';

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    // Snapshots at time of order (immutable)
    productName: {
        type: String,
        required: true
    },
    productImage: String,
    productSku: String,
    variant: {
        sku: String,
        options: {
            type: Map,
            of: String
        }
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    pricePerUnit: {
        type: Number,
        required: true
    },
    subtotal: {
        type: Number,
        required: true
    }
}, { _id: true });

const statusHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    note: String
}, { _id: false });

const adminNoteSchema = new mongoose.Schema({
    note: {
        type: String,
        required: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Shipping info (copied at order time - immutable)
    shippingAddress: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, default: 'India' }
    },

    // Line items (immutable after creation)
    items: [orderItemSchema],

    // Pricing breakdown (all in smallest currency unit - paise/cents)
    pricing: {
        subtotal: { type: Number, required: true },
        discountCode: String,
        discountAmount: { type: Number, default: 0 },
        shippingCost: { type: Number, required: true },
        taxAmount: { type: Number, default: 0 },
        total: { type: Number, required: true }
    },

    // Status
    status: {
        type: String,
        enum: Object.values(ORDER_STATUS),
        default: ORDER_STATUS.PENDING
    },
    statusHistory: [statusHistorySchema],

    // Shipping details
    shippingMethod: String,
    trackingNumber: String,
    trackingUrl: String,
    estimatedDelivery: Date,

    // Payment reference
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },

    // Admin notes (internal, not visible to customer)
    adminNotes: [adminNoteSchema],

    // Timestamps
    shippedAt: Date,
    deliveredAt: Date,
    completedAt: Date,
    cancelledAt: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
// Note: orderId index is automatically created by unique: true constraint
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'shippingAddress.email': 1 });
orderSchema.index({ 'pricing.total': 1 });

// Virtual for item count
orderSchema.virtual('itemCount').get(function () {
    return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual to check if order can be cancelled
orderSchema.virtual('canCancel').get(function () {
    return ORDER_STATUS_TRANSITIONS[this.status]?.includes(ORDER_STATUS.CANCELLED) || false;
});

// Virtual to check if order can be refunded
orderSchema.virtual('canRefund').get(function () {
    return ORDER_STATUS_TRANSITIONS[this.status]?.includes(ORDER_STATUS.REFUNDED) || false;
});

// Pre-save to add initial status history
orderSchema.pre('save', function (next) {
    if (this.isNew && this.statusHistory.length === 0) {
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date(),
            note: 'Order created'
        });
    }
    next();
});

// Method to update order status
orderSchema.methods.updateStatus = async function (newStatus, updatedBy, note = '') {
    const currentStatus = this.status;
    const validTransitions = ORDER_STATUS_TRANSITIONS[currentStatus] || [];

    if (!validTransitions.includes(newStatus)) {
        throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }

    this.status = newStatus;
    this.statusHistory.push({
        status: newStatus,
        timestamp: new Date(),
        updatedBy,
        note
    });

    // Set specific timestamps
    switch (newStatus) {
        case ORDER_STATUS.SHIPPED:
            this.shippedAt = new Date();
            break;
        case ORDER_STATUS.DELIVERED:
            this.deliveredAt = new Date();
            break;
        case ORDER_STATUS.COMPLETED:
            this.completedAt = new Date();
            break;
        case ORDER_STATUS.CANCELLED:
            this.cancelledAt = new Date();
            break;
    }

    return this.save();
};

// Method to add tracking info
orderSchema.methods.addTracking = async function (trackingInfoOrNumber, trackingUrl = null) {
    // Support both object and individual arguments
    if (typeof trackingInfoOrNumber === 'object') {
        this.trackingNumber = trackingInfoOrNumber.trackingNumber;
        if (trackingInfoOrNumber.trackingUrl) {
            this.trackingUrl = trackingInfoOrNumber.trackingUrl;
        }
        if (trackingInfoOrNumber.carrier) {
            this.shippingMethod = trackingInfoOrNumber.carrier;
        }
    } else {
        this.trackingNumber = trackingInfoOrNumber;
        if (trackingUrl) {
            this.trackingUrl = trackingUrl;
        }
    }
    return this.save();
};

// Method to add admin note
orderSchema.methods.addAdminNote = async function (note, addedBy) {
    this.adminNotes.push({
        note,
        addedBy,
        addedAt: new Date()
    });
    return this.save();
};

// Static method to generate order ID
orderSchema.statics.generateOrderId = function () {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = uuidv4().slice(0, 6).toUpperCase();
    return `ORD-${dateStr}-${random}`;
};

// Static method to create order from cart
orderSchema.statics.createFromCart = async function (cart, user, shippingAddress, pricing, paymentId = null) {
    const Product = mongoose.model('Product');

    // Build order items from cart
    const items = [];
    for (const cartItem of cart.items) {
        const product = await Product.findById(cartItem.product);
        if (!product) continue;

        items.push({
            product: product._id,
            productName: product.name,
            productImage: product.primaryImage,
            productSku: product.sku,
            variant: cartItem.variant || undefined,
            quantity: cartItem.quantity,
            pricePerUnit: cartItem.priceAtAdd,
            subtotal: cartItem.priceAtAdd * cartItem.quantity
        });
    }

    const order = new this({
        orderId: this.generateOrderId(),
        user: user._id,
        shippingAddress,
        items,
        pricing: {
            subtotal: pricing.subtotal,
            discountCode: cart.discountCode,
            discountAmount: pricing.discountAmount || 0,
            shippingCost: pricing.shippingCost,
            taxAmount: pricing.taxAmount || 0,
            total: pricing.total
        },
        payment: paymentId,
        status: ORDER_STATUS.PENDING
    });

    return order.save();
};

// Static method to get orders for admin dashboard
orderSchema.statics.getAdminStats = async function () {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all status counts
    const statusAggregation = await this.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Build statusCounts object with all statuses
    const statusCounts = {};
    for (const status of Object.values(ORDER_STATUS)) {
        statusCounts[status] = 0;
    }
    for (const item of statusAggregation) {
        statusCounts[item._id] = item.count;
    }

    // Get total orders and revenue (exclude cancelled/refunded from revenue)
    const [totalStats, todayStats] = await Promise.all([
        this.aggregate([
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: {
                        $sum: {
                            $cond: [
                                // Only count revenue from PAID orders (not pending/cancelled/refunded)
                                { $in: ['$status', ['processing', 'shipped', 'delivered', 'completed']] },
                                '$pricing.total',
                                0
                            ]
                        }
                    }
                }
            }
        ]),
        this.aggregate([
            { $match: { createdAt: { $gte: today } } },
            { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$pricing.total' } } }
        ])
    ]);

    return {
        totalOrders: totalStats[0]?.totalOrders || 0,
        totalRevenue: totalStats[0]?.totalRevenue || 0,
        todayOrders: todayStats[0]?.count || 0,
        todayRevenue: todayStats[0]?.revenue || 0,
        statusCounts,
        pendingCount: statusCounts.pending || 0,
        processingCount: statusCounts.processing || 0
    };
};

const Order = mongoose.model('Order', orderSchema);

export default Order;

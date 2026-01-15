import mongoose from 'mongoose';
import { PAYMENT_STATUS, PAYMENT_PROVIDERS } from '../config/constants.js';

const refundSchema = new mongoose.Schema({
    refundId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 1
    },
    reason: String,
    status: {
        type: String,
        enum: ['requested', 'processing', 'completed', 'failed'],
        default: 'requested'
    },
    providerRefundId: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: Date
}, { _id: true });

const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Provider info
    provider: {
        type: String,
        enum: Object.values(PAYMENT_PROVIDERS),
        required: true
    },
    method: {
        type: String,
        default: 'online' // 'card', 'upi', 'netbanking', 'wallet', 'cod', etc.
    },

    // Amount in smallest currency unit (paise/cents)
    amount: {
        type: Number,
        required: true,
        min: 1
    },
    currency: {
        type: String,
        default: 'INR',
        uppercase: true
    },

    // Provider-specific IDs
    providerPaymentId: String, // Payment ID from gateway
    providerSessionId: String, // Session/Order ID from gateway
    providerOrderId: String, // Order ID from gateway (Razorpay specific)

    // Status
    status: {
        type: String,
        enum: Object.values(PAYMENT_STATUS),
        default: PAYMENT_STATUS.INITIATED
    },

    // Refunds
    refunds: [refundSchema],
    totalRefunded: {
        type: Number,
        default: 0
    },

    // Metadata (provider-specific data)
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },

    // Error tracking
    errorMessage: String,
    errorCode: String,

    // Webhook verification
    webhookVerified: {
        type: Boolean,
        default: false
    },

    // Timestamps
    authorizedAt: Date,
    capturedAt: Date,
    completedAt: Date,
    failedAt: Date
}, {
    timestamps: true
});

// Indexes
paymentSchema.index({ order: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ provider: 1 });
paymentSchema.index({ providerPaymentId: 1 });
paymentSchema.index({ providerSessionId: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for refundable amount
paymentSchema.virtual('refundableAmount').get(function () {
    if (this.status !== PAYMENT_STATUS.COMPLETED && this.status !== PAYMENT_STATUS.CAPTURED) {
        return 0;
    }
    return this.amount - this.totalRefunded;
});

// Virtual to check if fully refunded
paymentSchema.virtual('isFullyRefunded').get(function () {
    return this.totalRefunded >= this.amount;
});

// Method to mark as completed
paymentSchema.methods.markCompleted = async function (providerPaymentId) {
    if (this.status === PAYMENT_STATUS.COMPLETED) {
        return this; // Already completed
    }

    this.status = PAYMENT_STATUS.COMPLETED;
    this.providerPaymentId = providerPaymentId || this.providerPaymentId;
    this.completedAt = new Date();
    this.webhookVerified = true;

    return this.save();
};

// Method to mark as failed
paymentSchema.methods.markFailed = async function (errorMessage, errorCode = null) {
    this.status = PAYMENT_STATUS.FAILED;
    this.errorMessage = errorMessage;
    this.errorCode = errorCode;
    this.failedAt = new Date();

    return this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = async function (amount, reason = '', providerRefundId = null) {
    if (this.status !== PAYMENT_STATUS.COMPLETED && this.status !== PAYMENT_STATUS.CAPTURED) {
        throw new Error('Cannot refund a payment that is not completed');
    }

    if (amount > this.refundableAmount) {
        throw new Error('Refund amount exceeds refundable amount');
    }

    const refundId = `REF-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    this.refunds.push({
        refundId,
        amount,
        reason,
        providerRefundId,
        status: providerRefundId ? 'completed' : 'requested',
        completedAt: providerRefundId ? new Date() : undefined
    });

    this.totalRefunded += amount;

    if (this.totalRefunded >= this.amount) {
        this.status = PAYMENT_STATUS.REFUNDED;
    } else if (this.totalRefunded > 0) {
        this.status = PAYMENT_STATUS.PARTIALLY_REFUNDED;
    }

    return this.save();
};

// Method to update refund status
paymentSchema.methods.updateRefundStatus = async function (refundId, status, providerRefundId = null) {
    const refund = this.refunds.find(r => r.refundId === refundId);

    if (!refund) {
        throw new Error('Refund not found');
    }

    refund.status = status;
    if (providerRefundId) {
        refund.providerRefundId = providerRefundId;
    }
    if (status === 'completed') {
        refund.completedAt = new Date();
    }

    return this.save();
};

// Static method to find by provider session
paymentSchema.statics.findByProviderSession = function (sessionId) {
    return this.findOne({ providerSessionId: sessionId });
};

// Static method to find by provider payment ID
paymentSchema.statics.findByProviderPaymentId = function (paymentId) {
    return this.findOne({ providerPaymentId: paymentId });
};

// Static method for payment stats
paymentSchema.statics.getStats = async function (startDate, endDate) {
    const match = {
        status: PAYMENT_STATUS.COMPLETED,
        createdAt: { $gte: startDate, $lte: endDate }
    };

    const stats = await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$provider',
                count: { $sum: 1 },
                total: { $sum: '$amount' }
            }
        }
    ]);

    return stats;
};

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;

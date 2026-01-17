import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    orderItemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        required: true,
        maxlength: 200,
        trim: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 2000,
        trim: true
    },
    verified: {
        type: Boolean,
        default: true // Always true since we require order
    },
    helpful: {
        type: Number,
        default: 0
    },
    // User snapshot at time of review
    userName: {
        type: String,
        required: true
    },
    userAvatar: String
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ order: 1, orderItemId: 1 }, { unique: true }); // One review per order item

// Static to get product review stats
reviewSchema.statics.getProductStats = async function (productId) {
    const stats = await this.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(productId) } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
                rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
                rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
                rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
                rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
                rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
            }
        }
    ]);

    if (!stats.length) {
        return {
            averageRating: 0,
            totalReviews: 0,
            distribution: [
                { stars: 5, count: 0, percent: 0 },
                { stars: 4, count: 0, percent: 0 },
                { stars: 3, count: 0, percent: 0 },
                { stars: 2, count: 0, percent: 0 },
                { stars: 1, count: 0, percent: 0 }
            ]
        };
    }

    const s = stats[0];
    const total = s.totalReviews || 1;

    return {
        averageRating: Math.round(s.averageRating * 10) / 10,
        totalReviews: s.totalReviews,
        distribution: [
            { stars: 5, count: s.rating5, percent: Math.round((s.rating5 / total) * 100) },
            { stars: 4, count: s.rating4, percent: Math.round((s.rating4 / total) * 100) },
            { stars: 3, count: s.rating3, percent: Math.round((s.rating3 / total) * 100) },
            { stars: 2, count: s.rating2, percent: Math.round((s.rating2 / total) * 100) },
            { stars: 1, count: s.rating1, percent: Math.round((s.rating1 / total) * 100) }
        ]
    };
};

const Review = mongoose.model('Review', reviewSchema);

export default Review;

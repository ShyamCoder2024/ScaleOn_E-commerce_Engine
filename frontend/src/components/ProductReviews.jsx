import { Star, MessageSquare, X, Loader2, ThumbsUp, CheckCircle } from "lucide-react";
import { useState, useEffect } from 'react';
import { reviewAPI } from '../services/api';

const ProductReviews = ({ productId }) => {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({
        averageRating: 0,
        totalReviews: 0,
        distribution: [
            { stars: 5, count: 0, percent: 0 },
            { stars: 4, count: 0, percent: 0 },
            { stars: 3, count: 0, percent: 0 },
            { stars: 2, count: 0, percent: 0 },
            { stars: 1, count: 0, percent: 0 }
        ]
    });
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(3);
    const [likedReviews, setLikedReviews] = useState(new Set());
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

    useEffect(() => {
        if (productId) {
            fetchReviews();
        }
    }, [productId]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const response = await reviewAPI.getByProduct(productId, { limit: 50 });
            const data = response.data.data;
            setReviews(data.reviews || []);
            setStats(data.stats || stats);
            setPagination(data.pagination || pagination);
        } catch (err) {
            console.error('Failed to fetch reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        setVisibleCount(prev => Math.min(prev + 3, reviews.length));
    };

    const handleShowLess = () => {
        setVisibleCount(3);
    };

    const handleHelpful = (reviewId) => {
        setLikedReviews(prev => {
            const newSet = new Set(prev);
            if (newSet.has(reviewId)) {
                newSet.delete(reviewId);
            } else {
                newSet.add(reviewId);
            }
            return newSet;
        });
    };

    const formatDate = (date) => {
        const now = new Date();
        const reviewDate = new Date(date);
        const diffMs = now - reviewDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return reviewDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const visibleReviews = reviews.slice(0, visibleCount);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-10 mt-12">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-10 mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                Customer Reviews
                <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {stats.totalReviews} reviews
                </span>
            </h2>

            <div className="grid lg:grid-cols-3 gap-12">
                {/* Left Column: Summary & Distribution */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Overall Rating */}
                    <div className="bg-gray-50 p-6 rounded-xl text-center">
                        <div className="text-5xl font-extrabold text-gray-900 mb-2">
                            {stats.averageRating || '0.0'}
                        </div>
                        <div className="flex justify-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={20}
                                    className={i < Math.round(stats.averageRating)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'fill-gray-200 text-gray-200'
                                    }
                                />
                            ))}
                        </div>
                        <p className="text-gray-500 text-sm">Based on {stats.totalReviews} reviews</p>
                    </div>

                    {/* Star Distribution */}
                    <div className="space-y-3">
                        {stats.distribution.map((item) => (
                            <div key={item.stars} className="flex items-center gap-3 text-sm">
                                <div className="flex items-center gap-1 w-16 text-gray-600">
                                    <span className="font-medium">{item.stars}</span>
                                    <Star size={12} className="fill-gray-400 text-gray-400" />
                                </div>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-yellow-400 rounded-full"
                                        style={{ width: `${item.percent}%` }}
                                    />
                                </div>
                                <div className="w-10 text-right text-gray-400 text-xs">
                                    {item.percent}%
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-xs text-center text-gray-400 px-4">
                        Only verified buyers can leave reviews
                    </div>
                </div>

                {/* Right Column: Review List */}
                <div className="lg:col-span-2 space-y-8">
                    {reviews.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                            <p className="text-gray-500">Be the first to review this product after purchase!</p>
                        </div>
                    ) : (
                        <>
                            {visibleReviews.map((review) => (
                                <div key={review._id} className="border-b border-gray-100 pb-8 last:border-0 last:pb-0">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={review.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userName)}&background=random`}
                                                alt={review.userName}
                                                className="w-12 h-12 rounded-full object-cover border border-gray-200"
                                            />
                                            <div>
                                                <h4 className="font-bold text-gray-900">{review.userName}</h4>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <span>{formatDate(review.createdAt)}</span>
                                                    {review.verified && (
                                                        <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs font-medium border border-green-100">
                                                            <CheckCircle size={10} /> Verified Purchase
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={16}
                                                    className={`${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-gray-900 mb-2 text-lg">
                                        {review.title}
                                    </h3>

                                    <p className="text-gray-600 leading-relaxed mb-4">
                                        {review.content}
                                    </p>

                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => handleHelpful(review._id)}
                                            className={`flex items-center gap-2 text-sm transition-colors group ${likedReviews.has(review._id) ? 'text-primary-600 font-medium' : 'text-gray-500 hover:text-gray-900'}`}
                                        >
                                            <ThumbsUp size={16} className={`group-hover:text-primary-600 ${likedReviews.has(review._id) ? 'fill-primary-100' : ''}`} />
                                            Helpful ({(review.helpful || 0) + (likedReviews.has(review._id) ? 1 : 0)})
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {visibleCount < reviews.length ? (
                                <button
                                    onClick={handleLoadMore}
                                    className="w-full py-4 text-primary-600 font-medium hover:bg-primary-50 rounded-xl transition-colors border border-primary-100 hover:border-primary-200"
                                >
                                    Load More Reviews ({reviews.length - visibleCount} remaining)
                                </button>
                            ) : reviews.length > 3 ? (
                                <button
                                    onClick={handleShowLess}
                                    className="w-full py-4 text-gray-500 font-medium hover:bg-gray-50 rounded-xl transition-colors border border-gray-200 hover:border-gray-300"
                                >
                                    Show Less
                                </button>
                            ) : null}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductReviews;

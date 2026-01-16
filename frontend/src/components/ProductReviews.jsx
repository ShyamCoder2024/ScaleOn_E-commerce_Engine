import { Star, MessageSquare, X, Loader2, ChevronLeft, ChevronRight, Search, Filter, CheckCircle, ThumbsUp, ShieldCheck, Headphones, Lock, Calendar, Truck, Clock, ExternalLink, Eye, Ban, ChevronDown } from "lucide-react";
import { useState } from 'react';
import toast from 'react-hot-toast';

// Expanded Mock Data
const INITIAL_REVIEWS = [
    {
        id: 1,
        user: "Sarah Jenkins",
        avatar: "https://ui-avatars.com/api/?name=Sarah+Jenkins&background=0D8ABC&color=fff",
        rating: 5,
        date: "2 days ago",
        verified: true,
        title: "Absolutely love it! 😍",
        content: "I've been using this for a week now and I'm blown away by the quality. It exceeded my expectations in every way. The shipping was super fast too!",
        helpful: 12
    },
    {
        id: 2,
        user: "Michael Chen",
        avatar: "https://ui-avatars.com/api/?name=Michael+Chen&background=random",
        rating: 5,
        date: "1 week ago",
        verified: true,
        title: "Best purchase of the year",
        content: "The attention to detail is remarkable. I was hesitant at first because of the price, but it's totally worth it. Highly recommended for anyone looking for premium quality.",
        helpful: 8
    },
    {
        id: 3,
        user: "Emma Wilson",
        avatar: "https://ui-avatars.com/api/?name=Emma+Wilson&background=random",
        rating: 4,
        date: "2 weeks ago",
        verified: true,
        title: "Great, but minor packaging issue",
        content: "The product itself is fantastic, 5 stars for that. Taking off one star because the box was slightly dented when it arrived. But the item was safe!",
        helpful: 5
    },
    {
        id: 4,
        user: "David Miller",
        avatar: "https://ui-avatars.com/api/?name=David+Miller&background=random",
        rating: 5,
        date: "3 weeks ago",
        verified: true,
        title: "Exactly as described",
        content: "Perfect fit and finish. It integrates seamlessly with my existing setup. Will definitely buy from this brand again.",
        helpful: 3
    },
    {
        id: 5,
        user: "Lisa Anderson",
        avatar: "https://ui-avatars.com/api/?name=Lisa+Anderson&background=random",
        rating: 5,
        date: "1 month ago",
        verified: true,
        title: "Worth every penny",
        content: "I was looking for something like this for ages. Finally found the perfect match. The quality is top notch.",
        helpful: 2
    },
    {
        id: 6,
        user: "James Wilson",
        avatar: "https://ui-avatars.com/api/?name=James+Wilson&background=random",
        rating: 4,
        date: "1 month ago",
        verified: true,
        title: "Good value for money",
        content: "Decent quality for the price point. Customer service was very helpful when I had a question.",
        helpful: 1
    },
    {
        id: 7,
        user: "Robert Taylor",
        avatar: "https://ui-avatars.com/api/?name=Robert+Taylor&background=random",
        rating: 3,
        date: "2 months ago",
        verified: false,
        title: "It's okay",
        content: "Not bad, not great. It does the job but I expected a bit more premium feel given the description.",
        helpful: 0
    },
    {
        id: 8,
        user: "Jennifer Martinez",
        avatar: "https://ui-avatars.com/api/?name=Jennifer+Martinez&background=random",
        rating: 5,
        date: "3 months ago",
        verified: true,
        title: "Highly impressed",
        content: "Superb functionality and aesthetic. Fits perfectly in my modern kitchen.",
        helpful: 4
    }
];

const STAR_DISTRIBUTION = [
    { stars: 5, percent: 75, count: 18 },
    { stars: 4, percent: 15, count: 4 },
    { stars: 3, percent: 5, count: 1 },
    { stars: 2, percent: 3, count: 1 },
    { stars: 1, percent: 2, count: 0 },
];

const ProductReviews = () => {
    // State
    const [reviews, setReviews] = useState(INITIAL_REVIEWS);
    const [visibleCount, setVisibleCount] = useState(3);
    const [likedReviews, setLikedReviews] = useState(new Set());

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newReview, setNewReview] = useState({
        rating: 5,
        title: '',
        content: ''
    });

    // Handlers
    const handleLoadMore = () => {
        setVisibleCount(prev => Math.min(prev + 3, reviews.length));
    };

    const handleShowLess = () => {
        setVisibleCount(3);
        // Optional: Scroll back to top of reviews or keep position? 
        // Usually better to just collapse.
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

    const handleSubmitReview = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate network delay
        setTimeout(() => {
            const review = {
                id: Date.now(),
                user: "You (Verified Buyer)",
                avatar: "https://ui-avatars.com/api/?name=You&background=000&color=fff",
                rating: newReview.rating,
                date: "Just now",
                verified: true,
                title: newReview.title,
                content: newReview.content,
                helpful: 0
            };

            setReviews(prev => [review, ...prev]);
            setIsSubmitting(false);
            setShowModal(false);
            setNewReview({ rating: 5, title: '', content: '' });
            toast.success("Review submitted successfully!");
        }, 1500);
    };

    const visibleReviews = reviews.slice(0, visibleCount);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-10 mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                Customer Reviews
                <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {reviews.length} reviews
                </span>
            </h2>

            <div className="grid lg:grid-cols-3 gap-12">
                {/* Left Column: Summary & Distribution */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Overall Rating */}
                    <div className="bg-gray-50 p-6 rounded-xl text-center">
                        <div className="text-5xl font-extrabold text-gray-900 mb-2">4.8</div>
                        <div className="flex justify-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={20} className="fill-yellow-400 text-yellow-400" />
                            ))}
                        </div>
                        <p className="text-gray-500 text-sm">Based on {reviews.length} reviews</p>
                    </div>

                    {/* Star Distribution */}
                    <div className="space-y-3">
                        {STAR_DISTRIBUTION.map((item) => (
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

                    {/* Write Review Button */}
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-full btn-secondary py-3 text-gray-900 font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <MessageSquare size={18} />
                        Write a Review
                    </button>

                    <div className="text-xs text-center text-gray-400 px-4">
                        Share your thoughts with other customers
                    </div>
                </div>

                {/* Right Column: Review List */}
                <div className="lg:col-span-2 space-y-8">
                    {visibleReviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 pb-8 last:border-0 last:pb-0">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={review.avatar}
                                        alt={review.user}
                                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                                    />
                                    <div>
                                        <h4 className="font-bold text-gray-900">{review.user}</h4>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <span>{review.date}</span>
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
                                    onClick={() => handleHelpful(review.id)}
                                    className={`flex items-center gap-2 text-sm transition-colors group ${likedReviews.has(review.id) ? 'text-primary-600 font-medium' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    <ThumbsUp size={16} className={`group-hover:text-primary-600 ${likedReviews.has(review.id) ? 'fill-primary-100' : ''}`} />
                                    Helpful ({review.helpful + (likedReviews.has(review.id) ? 1 : 0)})
                                </button>
                                <button className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                                    Report
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
                </div>
            </div>

            {/* Write Review Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-1">Write a Review</h3>
                            <p className="text-gray-500 mb-6">Share your experience with this product</p>

                            <form onSubmit={handleSubmitReview} className="space-y-6">
                                {/* Star Rating Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setNewReview({ ...newReview, rating: star })}
                                                className="transition-transform hover:scale-110 focus:outline-none"
                                            >
                                                <Star
                                                    size={32}
                                                    className={`${star <= newReview.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-100 text-gray-200'}`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Title Input */}
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                        Review Headline
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        required
                                        placeholder="What's most important to know?"
                                        value={newReview.title}
                                        onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all outline-none"
                                    />
                                </div>

                                {/* Content Input */}
                                <div>
                                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                                        Your Review
                                    </label>
                                    <textarea
                                        id="content"
                                        required
                                        rows={4}
                                        placeholder="What did you like or dislike?"
                                        value={newReview.content}
                                        onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all outline-none resize-none"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 size={20} className="animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            'Submit Review'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductReviews;

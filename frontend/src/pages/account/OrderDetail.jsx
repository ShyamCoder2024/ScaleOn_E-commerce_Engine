import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
    ChevronLeft,
    Package,
    Truck,
    Check,
    MapPin,
    CreditCard,
    Clock,
    XCircle,
    ExternalLink,
    Star,
    X,
    Loader2
} from 'lucide-react';
import { orderAPI, reviewAPI } from '../../services/api';
import { useConfig } from '../../context/ConfigContext';
import toast from 'react-hot-toast';

const OrderDetail = () => {
    const { id } = useParams();
    const location = useLocation();
    const { formatPrice, isFeatureEnabled } = useConfig();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);

    // Review states
    const reviewsEnabled = isFeatureEnabled('reviews');
    const [reviewedItems, setReviewedItems] = useState(new Set());
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewingItem, setReviewingItem] = useState(null);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [newReview, setNewReview] = useState({
        rating: 5,
        title: '',
        content: ''
    });

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        setLoading(true);
        try {
            const response = await orderAPI.getById(id);
            const orderData = response.data.data.order;
            setOrder(orderData);

            // Check which items are already reviewed
            if (reviewsEnabled && canReview(orderData)) {
                checkReviewedItems(orderData);
            }
        } catch (err) {
            console.error('Failed to fetch order:', err);
            toast.error('Order not found');
        } finally {
            setLoading(false);
        }
    };

    const checkReviewedItems = async (orderData) => {
        const reviewed = new Set();
        for (const item of orderData.items || []) {
            try {
                const response = await reviewAPI.canReview(orderData._id, item._id);
                if (response.data.data.alreadyReviewed) {
                    reviewed.add(item._id);
                }
            } catch (err) {
                // Ignore errors
            }
        }
        setReviewedItems(reviewed);
    };

    const canReview = (orderData) => {
        // Only allow reviews after delivery
        return ['delivered', 'completed'].includes(orderData?.status);
    };

    const handleCancelOrder = async () => {
        if (!confirm('Are you sure you want to cancel this order?')) return;

        setCancelling(true);
        try {
            await orderAPI.cancel(id, 'Customer requested cancellation');
            toast.success('Order cancelled');
            fetchOrder();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel order');
        } finally {
            setCancelling(false);
        }
    };

    const openReviewModal = (item) => {
        setReviewingItem(item);
        setNewReview({ rating: 5, title: '', content: '' });
        setShowReviewModal(true);
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!reviewingItem || !order) return;

        setSubmittingReview(true);
        try {
            await reviewAPI.create({
                productId: reviewingItem.product,
                orderId: order._id,
                orderItemId: reviewingItem._id,
                rating: newReview.rating,
                title: newReview.title,
                content: newReview.content
            });

            toast.success('Review submitted successfully!');
            setShowReviewModal(false);
            setReviewedItems(prev => new Set([...prev, reviewingItem._id]));
            setReviewingItem(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'text-yellow-600',
            processing: 'text-blue-600',
            shipped: 'text-purple-600',
            delivered: 'text-green-600',
            completed: 'text-green-600',
            cancelled: 'text-red-600',
            refunded: 'text-gray-600',
        };
        return colors[status] || 'text-gray-600';
    };

    const getStatusIcon = (status) => {
        const icons = {
            pending: Clock,
            processing: Package,
            shipped: Truck,
            delivered: Check,
            completed: Check,
            cancelled: XCircle,
        };
        return icons[status] || Package;
    };

    if (loading) {
        return (
            <div className="container-custom py-8">
                <div className="skeleton h-8 w-48 mb-8" />
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="card p-6">
                            <div className="skeleton h-6 w-32 mb-4" />
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="skeleton w-16 h-16 rounded" />
                                        <div className="flex-1">
                                            <div className="skeleton h-4 w-3/4 mb-2" />
                                            <div className="skeleton h-4 w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="skeleton h-64 rounded-xl" />
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container-custom py-16 text-center">
                <h1 className="text-2xl font-bold mb-4">Order not found</h1>
                <Link to="/orders" className="btn-primary">View All Orders</Link>
            </div>
        );
    }

    const StatusIcon = getStatusIcon(order.status);
    const showReviewButtons = reviewsEnabled && canReview(order);

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container-custom py-8">
                {/* Back Button */}
                <Link
                    to="/orders"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ChevronLeft size={20} />
                    Back to Orders
                </Link>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Order {order.orderId}
                        </h1>
                        <p className="text-gray-500">
                            Placed on {formatDate(order.createdAt)}
                        </p>
                    </div>

                    <div className={`flex items-center gap-2 ${getStatusColor(order.status)}`}>
                        <StatusIcon size={24} />
                        <span className="text-lg font-semibold capitalize">
                            {order.status}
                        </span>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Order Items */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card p-6">
                            <h2 className="font-bold text-gray-900 mb-4">
                                Order Items ({order.items?.length || 0})
                            </h2>

                            <div className="divide-y">
                                {order.items?.map((item, idx) => (
                                    <div key={idx} className="py-4 first:pt-0 last:pb-0">
                                        <div className="flex gap-4">
                                            <img
                                                src={item.productImage || item.image || 'https://placehold.co/80x80/e2e8f0/475569'}
                                                alt={item.productName}
                                                className="w-20 h-20 object-cover rounded-lg"
                                            />
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900">{item.productName}</h3>
                                                {item.variant && (
                                                    <p className="text-sm text-gray-500">
                                                        {Object.entries(item.variant.options || item.variant).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                    </p>
                                                )}
                                                <div className="flex items-center justify-between mt-2">
                                                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                    <p className="font-medium">{formatPrice(item.subtotal)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Write Review Button - Only show after delivery */}
                                        {showReviewButtons && (
                                            <div className="mt-3 ml-24">
                                                {reviewedItems.has(item._id) ? (
                                                    <span className="inline-flex items-center gap-1.5 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                                                        <Check size={14} />
                                                        Reviewed
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => openReviewModal(item)}
                                                        className="inline-flex items-center gap-1.5 text-sm text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                                                    >
                                                        <Star size={14} />
                                                        Write a Review
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Status Timeline */}
                        {order.statusHistory && order.statusHistory.length > 0 && (
                            <div className="card p-6">
                                <h2 className="font-bold text-gray-900 mb-4">Order Timeline</h2>
                                <div className="space-y-0">
                                    {order.statusHistory.map((entry, idx) => {
                                        const isLast = idx === order.statusHistory.length - 1;

                                        return (
                                            <div key={idx} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-3 h-3 rounded-full ${isLast
                                                        ? 'bg-primary-600 ring-4 ring-primary-100'
                                                        : 'bg-green-500'
                                                        }`} />
                                                    {!isLast && (
                                                        <div className="w-0.5 h-12 bg-green-300 my-1" />
                                                    )}
                                                </div>
                                                <div className="flex-1 pb-4">
                                                    <p className={`font-medium capitalize ${isLast ? 'text-primary-600' : 'text-gray-900'
                                                        }`}>
                                                        {entry.status?.replace('_', ' ')}
                                                    </p>
                                                    {entry.note && (
                                                        <p className="text-sm text-gray-500">{entry.note}</p>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {formatDate(entry.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Tracking Info */}
                        {order.trackingNumber && (
                            <div className="card p-6">
                                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Truck className="text-purple-600" size={20} />
                                    Shipping Information
                                </h2>
                                <div className="space-y-4">
                                    {order.shippingMethod && (
                                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                            <div>
                                                <p className="text-sm text-gray-500">Courier Partner</p>
                                                <p className="font-semibold text-purple-700">{order.shippingMethod}</p>
                                            </div>
                                            <Truck className="text-purple-400" size={24} />
                                        </div>
                                    )}

                                    <div>
                                        <p className="text-sm text-gray-500">Tracking / AWB Number</p>
                                        <p className="font-mono font-medium text-lg">{order.trackingNumber}</p>
                                    </div>

                                    {order.trackingUrl ? (
                                        <a
                                            href={order.trackingUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full btn-primary flex items-center justify-center gap-2"
                                        >
                                            Track Your Order
                                            <ExternalLink size={16} />
                                        </a>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">
                                            Tracking link not available. Please contact support for tracking updates.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Order Summary */}
                        <div className="card p-6">
                            <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span>{formatPrice(order.pricing?.subtotal)}</span>
                                </div>
                                {order.pricing?.discountAmount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>-{formatPrice(order.pricing.discountAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Shipping</span>
                                    <span>
                                        {order.pricing?.shippingCost > 0
                                            ? formatPrice(order.pricing.shippingCost)
                                            : 'Free'
                                        }
                                    </span>
                                </div>
                                {order.pricing?.taxAmount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tax</span>
                                        <span>{formatPrice(order.pricing.taxAmount)}</span>
                                    </div>
                                )}
                                <div className="border-t pt-2 mt-2">
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span>{formatPrice(order.pricing?.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="card p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin className="text-gray-400" size={20} />
                                <h2 className="font-bold text-gray-900">Shipping Address</h2>
                            </div>
                            <div className="text-sm text-gray-600">
                                <p className="font-medium text-gray-900">
                                    {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                                </p>
                                <p>{order.shippingAddress?.street}</p>
                                <p>
                                    {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
                                </p>
                                <p>{order.shippingAddress?.country}</p>
                                {order.shippingAddress?.phone && (
                                    <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
                                )}
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="card p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <CreditCard className="text-gray-400" size={20} />
                                <h2 className="font-bold text-gray-900">Payment</h2>
                            </div>
                            <div className="text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">
                                        {order.payment?.method === 'cod' || !order.payment?.method
                                            ? '💵 Cash on Delivery'
                                            : order.payment?.method === 'razorpay'
                                                ? '💳 Razorpay'
                                                : order.payment?.method === 'stripe'
                                                    ? '💳 Stripe'
                                                    : order.payment?.method?.charAt(0).toUpperCase() + order.payment?.method?.slice(1)}
                                    </span>
                                </div>
                                <p className={`mt-2 font-medium ${order.payment?.status === 'completed' ? 'text-green-600' :
                                    order.payment?.method === 'cod' || !order.payment?.method ? 'text-blue-600' : 'text-yellow-600'
                                    }`}>
                                    {order.payment?.status === 'completed'
                                        ? '✓ Paid'
                                        : order.payment?.method === 'cod' || !order.payment?.method
                                            ? order.status === 'delivered' || order.status === 'completed'
                                                ? '✓ Collected on Delivery'
                                                : '⏳ Pay on Delivery'
                                            : '⏳ Payment Pending'}
                                </p>
                            </div>
                        </div>

                        {/* Cancel Button */}
                        {order.canCancel && (
                            <button
                                onClick={handleCancelOrder}
                                disabled={cancelling}
                                className="w-full btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                            >
                                {cancelling ? 'Cancelling...' : 'Cancel Order'}
                            </button>
                        )}

                        {/* Help */}
                        <div className="text-center text-sm text-gray-500">
                            <p>Need help with this order?</p>
                            <a href="mailto:support@store.com" className="text-primary-600 hover:underline">
                                Contact Support
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Review Modal */}
            {showReviewModal && reviewingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowReviewModal(false)} />
                    <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <button
                            onClick={() => setShowReviewModal(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-1">Write a Review</h3>
                            <p className="text-gray-500 mb-6">for {reviewingItem.productName}</p>

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
                                        onClick={() => setShowReviewModal(false)}
                                        className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingReview}
                                        className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {submittingReview ? (
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

export default OrderDetail;

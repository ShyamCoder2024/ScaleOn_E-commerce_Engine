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
    Loader2,
    Calendar,
    ShoppingBag,
    Printer,
    HelpCircle
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
        rating: 0,
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
        setNewReview({ rating: 0, title: '', content: '' });
        setShowReviewModal(true);
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!reviewingItem || !order) return;

        if (newReview.rating === 0) {
            toast.error('Please select a star rating');
            return;
        }

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
            pending: 'text-yellow-600 bg-yellow-50 border-yellow-100',
            processing: 'text-blue-600 bg-blue-50 border-blue-100',
            shipped: 'text-purple-600 bg-purple-50 border-purple-100',
            delivered: 'text-green-600 bg-green-50 border-green-100',
            completed: 'text-green-600 bg-green-50 border-green-100',
            cancelled: 'text-red-600 bg-red-50 border-red-100',
            refunded: 'text-gray-600 bg-gray-50 border-gray-100',
        };
        return colors[status] || 'text-gray-600 bg-gray-50 border-gray-100';
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

    // Helper for resolving full image URL (reused from ProductCard fix)
    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const serverBase = backendUrl.replace('/api', '');
        return `${serverBase}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    if (loading) {
        return (
            <div className="container-custom py-8 max-w-5xl">
                <div className="skeleton h-8 w-48 mb-8" />
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="skeleton h-48 w-full rounded-2xl" />
                        <div className="skeleton h-96 w-full rounded-2xl" />
                    </div>
                    <div className="skeleton h-64 w-full rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container-custom py-20 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-50 rounded-full mb-6 text-gray-400">
                    <Package size={32} />
                </div>
                <h1 className="text-2xl font-bold mb-4">Order not found</h1>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">We couldn't find the order you're looking for. It might have been deleted or the link is invalid.</p>
                <Link to="/orders" className="btn-primary inline-flex items-center gap-2">
                    <ChevronLeft size={20} />
                    View All Orders
                </Link>
            </div>
        );
    }

    const StatusIcon = getStatusIcon(order.status);
    const showReviewButtons = reviewsEnabled && canReview(order);
    const statusColorClass = getStatusColor(order.status);

    return (
        <div className="bg-gray-50/50 min-h-screen py-6 md:py-10">
            <div className="container-custom max-w-6xl">
                {/* Navigation Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
                    <span>/</span>
                    <Link to="/orders" className="hover:text-primary-600 transition-colors">My Orders</Link>
                    <span>/</span>
                    <span className="text-gray-900 font-medium truncate">Order #{order.orderId}</span>
                </nav>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Content (Left) */}
                    <div className="flex-1 space-y-6">

                        {/* 1. Header Card - Status & Highlights */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 md:p-8 border-b border-gray-50">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 shrink-0">
                                            <ShoppingBag size={24} />
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-heading font-bold text-gray-900">
                                                Order #{order.orderId}
                                            </h1>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                                                <Calendar size={14} />
                                                {formatDate(order.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-2 rounded-full border flex items-center gap-2 self-start md:self-auto ${statusColorClass}`}>
                                        <StatusIcon size={18} />
                                        <span className="font-bold uppercase tracking-wide text-xs md:text-sm">
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Tracker Visualization */}
                            <div className="bg-gray-50/50 p-6 md:p-8 border-b border-gray-50">
                                <div className="relative">
                                    {/* Progress Bar Background */}
                                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 rounded-full hidden md:block" />

                                    <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-0 relative z-10">
                                        {['pending', 'processing', 'shipped', 'delivered'].map((step, idx) => {
                                            const stepIdx = ['pending', 'processing', 'shipped', 'delivered'].indexOf(step);
                                            const currentStatusIdx = ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status);
                                            const isCompleted = currentStatusIdx >= stepIdx;
                                            const isCurrent = currentStatusIdx === stepIdx;

                                            return (
                                                <div key={step} className="flex md:flex-col items-center gap-4 md:gap-2 group">
                                                    <div className={`
                                                        w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0
                                                        ${isCompleted
                                                            ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-500/20'
                                                            : 'bg-white border-gray-300 text-gray-300'
                                                        }
                                                        ${isCurrent && 'ring-4 ring-green-100'}
                                                    `}>
                                                        {isCompleted ? <Check size={14} strokeWidth={3} /> : <div className="w-2 h-2 rounded-full bg-gray-300" />}
                                                    </div>
                                                    <div className="flex flex-col md:items-center md:text-center">
                                                        <span className={`text-sm font-bold capitalize ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                                                            {step}
                                                        </span>
                                                        {isCurrent && (
                                                            <span className="text-xs text-green-600 font-medium animate-pulse">
                                                                In Progress
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {order.trackingUrl && (
                                <div className="p-4 bg-primary-50/30 flex justify-end">
                                    <a
                                        href={order.trackingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-primary bg-white text-primary-600 border border-primary-200 hover:bg-primary-50 shadow-sm text-sm py-2"
                                    >
                                        Track Package <ExternalLink size={16} />
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* 2. Order Items Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Package className="text-gray-400" size={20} />
                                    Items in Your Order
                                </h2>
                                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                    {order.items?.length || 0} Items
                                </span>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {order.items?.map((item, idx) => (
                                    <div key={idx} className="p-6 transition-colors hover:bg-gray-50/50">
                                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                            {/* Product Image */}
                                            <div className="shrink-0 relative group">
                                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gray-100 border border-gray-100 overflow-hidden">
                                                    <img
                                                        src={getImageUrl(item.productImage || item.image) || 'https://placehold.co/100x100/e2e8f0/475569?text=Product'}
                                                        alt={item.productName}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                </div>
                                                <div className="absolute top-0 right-0 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                                                    x{item.quantity}
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 flex flex-col justify-center">
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight hover:text-primary-600 transition-colors">
                                                            <Link to={`/products/${item.product}`}>{item.productName}</Link>
                                                        </h3>
                                                        {item.variant && (
                                                            <div className="flex flex-wrap gap-2 mt-1.5">
                                                                {Object.entries(item.variant.options || item.variant).map(([k, v]) => (
                                                                    <span key={k} className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-md capitalize">
                                                                        {k}: {v}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="font-bold text-gray-900 text-lg">
                                                        {formatPrice(item.price)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between mt-auto">
                                                    <div className="text-sm">
                                                        <span className="text-gray-500">Subtotal:</span>{' '}
                                                        <span className="font-semibold text-gray-900">{formatPrice(item.subtotal)}</span>
                                                    </div>

                                                    {/* Review Button */}
                                                    {showReviewButtons && (
                                                        <div>
                                                            {reviewedItems.has(item._id) ? (
                                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                                                                    <Check size={12} strokeWidth={3} />
                                                                    Reviewed
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => openReviewModal(item)}
                                                                    className="btn-secondary text-xs py-1.5 px-3 h-auto gap-1.5 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200"
                                                                >
                                                                    <Star size={14} className="text-yellow-400 fill-current" />
                                                                    Write Review
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Timeline (Full History) */}
                        {order.statusHistory && order.statusHistory.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100">
                                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                        <Clock className="text-gray-400" size={20} />
                                        Activity Log
                                    </h2>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                        {order.statusHistory.map((entry, idx) => (
                                            <div key={idx} className="relative flex gap-4">
                                                <div className={`
                                                    w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shrink-0 z-10
                                                    ${idx === order.statusHistory.length - 1 ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}
                                                `}>
                                                    <div className={`w-2 h-2 rounded-full ${idx === order.statusHistory.length - 1 ? 'bg-primary-600' : 'bg-gray-400'}`} />
                                                </div>
                                                <div className="pt-2">
                                                    <p className="font-bold text-gray-900 capitalize text-sm">
                                                        {entry.status?.replace('_', ' ')}
                                                    </p>
                                                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                                                        {formatDate(entry.timestamp)}
                                                    </p>
                                                    {entry.note && (
                                                        <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded-lg inline-block border border-gray-100">
                                                            "{entry.note}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar (Right) */}
                    <div className="lg:w-96 space-y-6">

                        {/* Order Summary */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
                            <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
                                <h2 className="font-bold text-gray-900">Order Summary</h2>
                            </div>
                            <div className="p-6 space-y-3">
                                <div className="flex justify-between text-gray-600 text-sm">
                                    <span>Subtotal</span>
                                    <span className="font-medium text-gray-900">{formatPrice(order.pricing?.subtotal)}</span>
                                </div>
                                {order.pricing?.discountAmount > 0 && (
                                    <div className="flex justify-between text-green-600 text-sm">
                                        <span>Discount</span>
                                        <span className="font-medium">-{formatPrice(order.pricing.discountAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-600 text-sm">
                                    <span>Shipping</span>
                                    <span className="font-medium text-gray-900">
                                        {order.pricing?.shippingCost > 0 ? formatPrice(order.pricing.shippingCost) : 'Free'}
                                    </span>
                                </div>
                                {order.pricing?.taxAmount > 0 && (
                                    <div className="flex justify-between text-gray-600 text-sm">
                                        <span>Tax</span>
                                        <span className="font-medium text-gray-900">{formatPrice(order.pricing.taxAmount)}</span>
                                    </div>
                                )}
                                <div className="border-t border-dashed border-gray-200 pt-3 mt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-gray-900 text-lg">Total</span>
                                        <span className="font-bold text-primary-600 text-xl">{formatPrice(order.pricing?.total)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Info inside Summary - Mobile optimization */}
                            <div className="px-6 pb-6 pt-0">
                                <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100">
                                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Payment Method</p>
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <CreditCard size={16} className="text-blue-500" />
                                        <span className="capitalize">
                                            {order.payment?.method === 'cod' ? 'Cash on Delivery' : order.payment?.method || 'N/A'}
                                        </span>
                                    </div>
                                    <p className={`text-xs mt-1 font-bold ${order.payment?.status === 'completed' ? 'text-green-600' : 'text-orange-600'
                                        }`}>
                                        {order.payment?.status === 'completed' ? 'PAID' : 'PENDING'}
                                    </p>
                                </div>
                            </div>

                            {/* Help & Actions */}
                            <div className="p-4 bg-gray-50 border-t border-gray-100 grid gap-3">
                                {order.canCancel && (
                                    <button
                                        onClick={handleCancelOrder}
                                        disabled={cancelling}
                                        className="w-full btn-secondary text-red-600 border-red-200 hover:bg-red-50 py-2.5 text-sm"
                                    >
                                        {cancelling ? 'Cancelling...' : 'Cancel Order'}
                                    </button>
                                )}
                                <a
                                    href="mailto:support@store.com"
                                    className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors"
                                >
                                    <HelpCircle size={16} /> Need help?
                                </a>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                    <MapPin className="text-gray-400" size={20} />
                                    Shipping to
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-base">
                                            {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                                        </p>
                                        <address className="not-italic text-sm text-gray-500 mt-1 space-y-0.5">
                                            <p>{order.shippingAddress?.street}</p>
                                            <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</p>
                                            <p>{order.shippingAddress?.country}</p>
                                            {order.shippingAddress?.phone && (
                                                <p className="font-medium text-gray-700 mt-2">📞 {order.shippingAddress.phone}</p>
                                            )}
                                        </address>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Review Modal */}
            {showReviewModal && reviewingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowReviewModal(false)} />

                    <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">Write Review</h3>
                                <p className="text-sm text-gray-500 truncate max-w-[200px]">{reviewingItem.productName}</p>
                            </div>
                            <button
                                onClick={() => setShowReviewModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                            <form onSubmit={handleSubmitReview} className="space-y-6">
                                {/* Star Rating Input */}
                                <div className="flex flex-col items-center justify-center py-4 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setNewReview({ ...newReview, rating: star })}
                                                className="group p-1 focus:outline-none transition-transform active:scale-95"
                                            >
                                                <Star
                                                    size={40}
                                                    className={`transition-colors duration-200 ${star <= newReview.rating
                                                        ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm'
                                                        : 'fill-gray-100 text-gray-200 group-hover:text-gray-300'
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 mt-2">
                                        {newReview.rating === 0 ? 'Click stars to rate' :
                                            newReview.rating === 5 ? 'Excellent! ★★★★★' :
                                                newReview.rating === 4 ? 'Great! ★★★★' :
                                                    newReview.rating === 3 ? 'Good ★★★' :
                                                        newReview.rating === 2 ? 'Fair ★★' : 'Poor ★'}
                                    </p>
                                </div>

                                {/* Title Input */}
                                <div>
                                    <label htmlFor="title" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                        Headline
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        required
                                        placeholder="What's most important to know?"
                                        value={newReview.title}
                                        onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none text-base font-medium"
                                    />
                                </div>

                                {/* Content Input */}
                                <div>
                                    <label htmlFor="content" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                        Review
                                    </label>
                                    <textarea
                                        id="content"
                                        required
                                        rows={4}
                                        placeholder="What did you like or dislike? Details help other shoppers."
                                        value={newReview.content}
                                        onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none resize-none text-base leading-relaxed"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submittingReview || newReview.rating === 0}
                                    className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-primary-600/20 active:scale-[0.99]"
                                >
                                    {submittingReview ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Publishing...
                                        </>
                                    ) : (
                                        'Submit Review'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderDetail;

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
    ExternalLink
} from 'lucide-react';
import { orderAPI } from '../../services/api';
import { useConfig } from '../../context/ConfigContext';
import toast from 'react-hot-toast';

const OrderDetail = () => {
    const { id } = useParams();
    const location = useLocation();
    const { formatPrice } = useConfig();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        fetchOrder();
        // Note: success toast is already shown in Checkout.jsx
    }, [id]);

    const fetchOrder = async () => {
        setLoading(true);
        try {
            const response = await orderAPI.getById(id);
            setOrder(response.data.data.order);
        } catch (err) {
            console.error('Failed to fetch order:', err);
            toast.error('Order not found');
        } finally {
            setLoading(false);
        }
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
                                    <div key={idx} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                                        <img
                                            src={item.image || 'https://placehold.co/80x80/e2e8f0/475569'}
                                            alt={item.productName}
                                            className="w-20 h-20 object-cover rounded-lg"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900">{item.productName}</h3>
                                            {item.variant && (
                                                <p className="text-sm text-gray-500">
                                                    {Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between mt-2">
                                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                <p className="font-medium">{formatPrice(item.subtotal)}</p>
                                            </div>
                                        </div>
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
                                        const isCompleted = !isLast; // All except last are completed

                                        return (
                                            <div key={idx} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    {/* Status dot */}
                                                    <div className={`w-3 h-3 rounded-full ${isLast
                                                        ? 'bg-primary-600 ring-4 ring-primary-100'
                                                        : 'bg-green-500'
                                                        }`} />
                                                    {/* Connecting line */}
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
                                    {/* Courier Partner */}
                                    {order.shippingMethod && (
                                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                            <div>
                                                <p className="text-sm text-gray-500">Courier Partner</p>
                                                <p className="font-semibold text-purple-700">{order.shippingMethod}</p>
                                            </div>
                                            <Truck className="text-purple-400" size={24} />
                                        </div>
                                    )}

                                    {/* Tracking Number */}
                                    <div>
                                        <p className="text-sm text-gray-500">Tracking / AWB Number</p>
                                        <p className="font-mono font-medium text-lg">{order.trackingNumber}</p>
                                    </div>

                                    {/* Track Order Button */}
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
                                {/* Payment Method */}
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
                                {/* Payment Status */}
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
        </div>
    );
};

export default OrderDetail;

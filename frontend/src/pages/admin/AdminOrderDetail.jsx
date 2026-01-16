import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, Package, TruckCircle,
    MapPin, CreditCard, X, FileText,
    Copy, Mail, Phone,
    AlertTriangle, ShieldChevronDown
, ChevronLeft, ChevronRight, Search, Filter, CheckCircle, ThumbsUp, ShieldCheck, Headphones, Lock, Calendar, Truck, Clock, ExternalLink, Eye, Ban, ChevronDown } from "lucide-react";
import { orderAPI } from '../../services/api';
import toast from 'react-hot-toast';

// --- Components ---

const StatusBadge = ({ status }) => {
    const styles = {
        pending: 'bg-amber-50 text-amber-700 border-amber-200',
        processing: 'bg-blue-50 text-blue-700 border-blue-200',
        shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
        refunded: 'bg-slate-50 text-slate-700 border-slate-200'
    };

    return (
        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full border ${styles[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            {status?.replace('_', ' ')}
        </span>
    );
};

const DetailCard = ({ title, icon: Icon, children, className = "" }) => (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${className}`}>
        {title && (
            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center gap-2.5">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                    <Icon size={18} />
                </div>
                <h2 className="font-semibold text-slate-900 text-sm">{title}</h2>
            </div>
        )}
        <div className="p-6">
            {children}
        </div>
    </div>
);

const AdminOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [statusData, setStatusData] = useState({ status: '', note: '' });
    const [trackingData, setTrackingData] = useState({ trackingNumber: '', trackingUrl: '', carrier: '' });

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const response = await orderAPI.getById(id);
            setOrder(response.data.data.order);
        } catch (err) {
            console.error('Failed to fetch order:', err);
            toast.error('Failed to load order');
            navigate('/admin/orders');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!statusData.status) {
            toast.error('Please select a status');
            return;
        }

        setUpdating(true);
        try {
            await orderAPI.updateStatus(id, statusData.status, statusData.note);
            toast.success('Order status updated');
            setShowStatusModal(false);
            fetchOrder();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const handleAddTracking = async () => {
        if (!trackingData.trackingNumber) {
            toast.error('Please enter tracking number');
            return;
        }

        setUpdating(true);
        try {
            await orderAPI.addTracking(id, trackingData);
            toast.success('Tracking added & order shipped');
            setShowTrackingModal(false);
            fetchOrder();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add tracking');
        } finally {
            setUpdating(false);
        }
    };

    const handleMarkDelivered = async () => {
        setUpdating(true);
        try {
            await orderAPI.markDelivered(id);
            toast.success('Order marked as delivered');
            fetchOrder();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update order');
        } finally {
            setUpdating(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!confirm('Are you sure you want to cancel this order?')) return;
        setUpdating(true);
        try {
            await orderAPI.adminCancel(id, 'Cancelled by admin');
            toast.success('Order cancelled');
            fetchOrder();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel order');
        } finally {
            setUpdating(false);
        }
    };

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied`);
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-8 max-w-6xl mx-auto">
                <div className="h-8 bg-slate-200 rounded w-1/3 mb-8"></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white h-96 rounded-2xl"></div>
                    <div className="bg-white h-96 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="max-w-6xl mx-auto pb-20 space-y-6">
            {/* Header / Top Nav */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <button
                        onClick={() => navigate('/admin/orders')}
                        className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-medium mb-2 transition-colors"
                    >
                        <ArrowLeft size={16} /> Back to Orders
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">#{order.orderId?.slice(-6)}</h1>
                        <StatusBadge status={order.status} />
                    </div>
                    <div className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                        <Calendar size={14} />
                        {formatDate(order.createdAt)}
                    </div>
                </div>

                {/* Primary Actions */}
                <div className="flex flex-wrap gap-3">
                    {order.status === 'processing' && (
                        <button
                            onClick={() => setShowTrackingModal(true)}
                            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <Truck size={18} /> Ship Order
                        </button>
                    )}
                    {order.status === 'shipped' && (
                        <button
                            onClick={handleMarkDelivered}
                            disabled={updating}
                            className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <CheckCircle size={18} /> Mark Delivered
                        </button>
                    )}
                    {['pending', 'processing'].includes(order.status) && (
                        <button
                            onClick={handleCancelOrder}
                            disabled={updating}
                            className="bg-white text-rose-600 border border-rose-200 px-4 py-2.5 rounded-xl font-semibold hover:bg-rose-50 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <X size={18} /> Cancel Order
                        </button>
                    )}
                    <button
                        onClick={() => setShowStatusModal(true)}
                        className="bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2 active:scale-95"
                    >
                        Update Status <ChevronDown size={16} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Order Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items List */}
                    <DetailCard title={`Items (${order.items?.length || 0})`} icon={Package} className="p-0">
                        <div className="divide-y divide-slate-50">
                            {order.items?.map((item, index) => (
                                <div key={index} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                                    <div className="w-20 h-20 shrink-0 rounded-lg bg-slate-100 overflow-hidden border border-slate-100">
                                        {item.productImage ? (
                                            <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Img</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h4 className="font-semibold text-slate-900 text-base leading-tight mb-1">{item.productName}</h4>
                                        <div className="text-sm text-slate-500 space-y-0.5">
                                            {item.variant?.options && (
                                                <p>{Object.entries(item.variant.options).map(([k, v]) => `${k}: ${v}`).join(', ')}</p>
                                            )}
                                            {item.productSku && <p className="font-mono text-xs">SKU: {item.productSku}</p>}
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col justify-center">
                                        <p className="font-bold text-slate-900">₹{(item.subtotal / 100).toFixed(2)}</p>
                                        <p className="text-xs text-slate-500 font-medium">
                                            {item.quantity} x ₹{(item.pricePerUnit / 100).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary Footer */}
                        <div className="mt-6 pt-6 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-6 px-6 pb-6 space-y-3 text-sm">
                            <div className="flex justify-between text-slate-600">
                                <span>Subtotal</span>
                                <span>₹{((order.pricing?.subtotal || 0) / 100).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Shipping</span>
                                <span>{order.pricing?.shippingCost > 0 ? `₹${(order.pricing.shippingCost / 100).toFixed(2)}` : 'Free'}</span>
                            </div>
                            {order.pricing?.discountAmount > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                    <span>Discount</span>
                                    <span>-₹{(order.pricing.discountAmount / 100).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-3 border-t border-slate-200">
                                <span className="font-bold text-lg text-slate-900">Total</span>
                                <span className="font-bold text-lg text-slate-900">₹{((order.pricing?.total || 0) / 100).toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </DetailCard>

                    {/* Timeline */}
                    <DetailCard title="Order History" icon={Clock}>
                        <div className="relative pl-2 border-l-2 border-slate-100 space-y-8 my-2">
                            {order.statusHistory?.map((entry, index) => {
                                const isLatest = index === order.statusHistory.length - 1;
                                return (
                                    <div key={index} className="relative pl-6">
                                        <div className={`
                                            absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 
                                            ${isLatest ? 'bg-blue-600 border-white ring-2 ring-blue-100' : 'bg-slate-200 border-white'}
                                        `} />
                                        <div>
                                            <p className={`font-semibold ${isLatest ? 'text-blue-900' : 'text-slate-700'}`}>
                                                {entry.status?.replace('_', ' ')}
                                            </p>
                                            <p className="text-xs text-slate-500 font-medium font-mono mt-0.5">
                                                {formatDate(entry.timestamp)}
                                            </p>
                                            {entry.note && (
                                                <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                                    {entry.note}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </DetailCard>
                </div>

                {/* Right Column: Meta Info */}
                <div className="space-y-6">
                    {/* Customer */}
                    <DetailCard title="Customer Details" icon={ShieldCheck}>
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center font-bold text-slate-600 text-lg">
                                {order.shippingAddress?.firstName?.[0]}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                                <p className="font-semibold text-slate-900">
                                    {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                                </p>
                                <a href={`mailto:${order.shippingAddress?.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                    <Mail size={14} /> {order.shippingAddress?.email}
                                </a>
                                <a href={`tel:${order.shippingAddress?.phone}`} className="flex items-center gap-2 text-sm text-slate-600">
                                    <Phone size={14} /> {order.shippingAddress?.phone}
                                </a>
                            </div>
                        </div>
                    </DetailCard>

                    {/* Shipping Address */}
                    <DetailCard title="Delivery Address" icon={MapPin}>
                        <div className="text-sm text-slate-600 leading-relaxed relative group">
                            <button
                                onClick={() => copyToClipboard(
                                    `${order.shippingAddress?.firstName} ${order.shippingAddress?.lastName}\n${order.shippingAddress?.street}\n${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.postalCode}`,
                                    "Address"
                                )}
                                className="absolute right-0 top-0 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                title="Copy Address"
                            >
                                <Copy size={14} />
                            </button>
                            <p className="font-medium text-slate-900 mb-1">
                                {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                            </p>
                            <p>{order.shippingAddress?.street}</p>
                            <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</p>
                            <p>{order.shippingAddress?.country}</p>
                        </div>
                    </DetailCard>

                    {/* Payment */}
                    <DetailCard title="Payment Info" icon={CreditCard}>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-sm font-medium text-slate-600">Status</span>
                                <span className={`flex items-center gap-1.5 text-sm font-bold ${order.payment?.status === 'completed' ? 'text-emerald-600' :
                                        order.payment?.status === 'failed' ? 'text-rose-600' :
                                            order.payment?.status === 'pending' ? 'text-amber-600' : 'text-slate-600'
                                    }`}>
                                    {order.payment?.status === 'completed' ? <CheckCircle size={14} /> :
                                        order.payment?.status === 'pending' ? <Clock size={14} /> :
                                            order.payment?.status === 'failed' ? <AlertTriangle size={14} /> : null}
                                    {order.payment?.status?.toUpperCase() || 'N/A'}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Method</span>
                                    <span className="font-medium capitalize">
                                        {order.payment?.method === 'cod' ? 'Cash on Delivery' :
                                            order.payment?.method || 'Unknown'}
                                    </span>
                                </div>
                                {order.payment?.method === 'cod' && order.payment?.status === 'pending' && (
                                    <div className="pt-2 border-t border-slate-100 mt-2">
                                        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                            💵 Payment to be collected on delivery
                                        </p>
                                    </div>
                                )}
                                {order.payment?.method === 'cod' && order.payment?.status === 'completed' && (
                                    <div className="pt-2 border-t border-slate-100 mt-2">
                                        <p className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded">
                                            ✓ Payment collected on delivery
                                        </p>
                                    </div>
                                )}
                                {order.payment?.transactionId && (
                                    <div className="pt-2 border-t border-slate-100 mt-2">
                                        <p className="text-xs text-slate-400 mb-1">Transaction ID</p>
                                        <p className="font-mono text-xs bg-slate-100 p-1.5 rounded text-slate-600 break-all">
                                            {order.payment?.transactionId}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </DetailCard>

                    {/* Admin Notes */}
                    <DetailCard title="Internal Notes" icon={FileText}>
                        {order.adminNotes?.length > 0 ? (
                            <div className="space-y-4">
                                {order.adminNotes.map((note, index) => (
                                    <div key={index} className="text-sm bg-yellow-50/50 p-3 rounded-lg border border-yellow-100">
                                        <p className="text-slate-800">{note.note}</p>
                                        <p className="text-xs text-slate-400 mt-2 text-right">{formatDate(note.createdAt)}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-slate-400 text-sm italic">
                                No admin notes recorded.
                            </div>
                        )}
                    </DetailCard>
                </div>
            </div>

            {/* Modals (Status & Tracking) - Keeping logic simpler for brevity but styled consistently */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl scale-100">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-slate-900">Update Status</h3>
                            <button onClick={() => setShowStatusModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Status</label>
                                <select
                                    value={statusData.status}
                                    onChange={(e) => setStatusData(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                >
                                    <option value="">Select Status...</option>
                                    {['processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'].map(s => (
                                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Note (Optional)</label>
                                <textarea
                                    value={statusData.note}
                                    onChange={(e) => setStatusData(prev => ({ ...prev, note: e.target.value }))}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                    placeholder="Add context about this change..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowStatusModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                                <button onClick={handleStatusUpdate} disabled={updating} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                                    {updating ? 'Updating...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tracking Modal */}
            {showTrackingModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-slate-900">Add Tracking Info</h3>
                            <button onClick={() => setShowTrackingModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tracking Number</label>
                                <input
                                    type="text"
                                    value={trackingData.trackingNumber}
                                    onChange={(e) => setTrackingData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="AWB123456789"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Courier</label>
                                <select
                                    value={trackingData.carrier}
                                    onChange={(e) => setTrackingData(prev => ({ ...prev, carrier: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">Select Partner</option>
                                    <option value="Delhivery">Delhivery</option>
                                    <option value="BlueDart">BlueDart</option>
                                    <option value="Shiprocket">Shiprocket</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tracking URL</label>
                                <input
                                    type="url"
                                    value={trackingData.trackingUrl}
                                    onChange={(e) => setTrackingData(prev => ({ ...prev, trackingUrl: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="https://..."
                                />
                            </div>

                            <button onClick={handleAddTracking} disabled={updating} className="w-full py-3 mt-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
                                {updating ? 'Saving...' : 'Confirm Shipment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrderDetail;

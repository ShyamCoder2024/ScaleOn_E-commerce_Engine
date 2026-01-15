import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, Mail, Phone, Calendar, MapPin,
    ShoppingBag, Package, CreditCard, User,
    Shield, Ban, CheckCircle, ChevronRight, ExternalLink
} from 'lucide-react';
import { adminAPI, orderAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CustomerDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchCustomerData();
    }, [id]);

    const fetchCustomerData = async () => {
        try {
            const customerRes = await adminAPI.getCustomer(id);
            const data = customerRes.data.data;
            setCustomer(data.customer || data);
            setOrders(data.orders || []);
        } catch (err) {
            console.error('Failed to fetch customer:', err);
            toast.error('Failed to load customer details');
            navigate('/admin/customers');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatPrice = (amount) => {
        return `₹${(amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    };

    const handleToggleStatus = async () => {
        if (!customer) return;
        setActionLoading(true);
        try {
            const newStatus = customer.status === 'active' ? 'blocked' : 'active';
            await adminAPI.updateCustomerStatus(id, newStatus);
            setCustomer(prev => ({ ...prev, status: newStatus }));
            toast.success(`Customer ${newStatus === 'blocked' ? 'blocked' : 'activated'}`);
        } catch (err) {
            toast.error('Failed to update customer status');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-6 animate-pulse p-4">
                <div className="h-8 bg-slate-200 rounded-lg w-1/3" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="h-64 bg-slate-200 rounded-2xl" />
                    <div className="lg:col-span-2 h-64 bg-slate-200 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <User className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Customer not found</h2>
                <Link to="/admin/customers" className="text-blue-600 hover:text-blue-700 font-medium mt-2 flex items-center gap-1">
                    <ArrowLeft size={16} />
                    Back to Customers
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/admin/customers')}
                        className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl text-slate-500 hover:text-slate-700 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            {customer.profile?.firstName} {customer.profile?.lastName}
                        </h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-slate-500 font-medium text-sm">{customer.email}</span>
                            {customer.isEmailVerified && <CheckCircle className="w-3.5 h-3.5 text-blue-500" />}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleToggleStatus}
                    disabled={actionLoading}
                    className={`
                        w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all active:scale-95 shadow-sm
                        ${customer.status === 'active'
                            ? 'bg-white text-rose-600 border border-slate-200 hover:bg-rose-50 hover:border-rose-200'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20 shadow-lg'
                        } disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                >
                    {customer.status === 'active' ? (
                        <>
                            <Ban className="w-4 h-4" />
                            Block Customer
                        </>
                    ) : (
                        <>
                            <CheckCircle className="w-4 h-4" />
                            Activate Customer
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Customer Details */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Profile Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-2xl">
                                {customer.profile?.firstName?.[0] || customer.email?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-lg mb-1 ${customer.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                    }`}>
                                    {customer.status || 'active'}
                                </span>
                                <p className="text-xs text-slate-400 font-medium">Customer ID: {customer._id.slice(-6)}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="group flex items-start gap-3 text-slate-600 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                <Mail className="w-5 h-5 text-slate-400 mt-0.5 group-hover:text-blue-500 transition-colors" />
                                <div className="break-all">
                                    <p className="text-xs font-semibold text-slate-400 uppercase mb-0.5">Email</p>
                                    <p className="font-medium text-slate-900">{customer.email}</p>
                                </div>
                            </div>

                            {customer.profile?.phone && (
                                <div className="group flex items-start gap-3 text-slate-600 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                    <Phone className="w-5 h-5 text-slate-400 mt-0.5 group-hover:text-amber-500 transition-colors" />
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase mb-0.5">Phone</p>
                                        <p className="font-medium text-slate-900">{customer.profile.phone}</p>
                                    </div>
                                </div>
                            )}

                            <div className="group flex items-start gap-3 text-slate-600 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                <Calendar className="w-5 h-5 text-slate-400 mt-0.5 group-hover:text-violet-500 transition-colors" />
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase mb-0.5">Joined</p>
                                    <p className="font-medium text-slate-900">{formatDate(customer.createdAt)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Addresses */}
                    {customer.profile?.addresses?.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-slate-400" />
                                Address Book
                            </h3>
                            <div className="space-y-4">
                                {customer.profile.addresses.map((address, index) => (
                                    <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
                                                <MapPin className="w-4 h-4 text-slate-500" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">
                                                    {address.firstName} {address.lastName}
                                                </p>
                                                <p className="text-sm text-slate-600 mt-1">{address.street}</p>
                                                <p className="text-sm text-slate-600">
                                                    {address.city}, {address.state} {address.postalCode}
                                                </p>
                                                {address.phone && (
                                                    <p className="text-xs text-slate-500 mt-2 font-medium flex items-center gap-1">
                                                        <Phone size={12} /> {address.phone}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Order History */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-blue-600" />
                                <h3 className="font-bold text-slate-900">Order History</h3>
                            </div>
                            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm">
                                {orders.length} orders
                            </span>
                        </div>

                        {orders.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShoppingBag className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-slate-900 font-semibold">No orders placed yet</h3>
                                <p className="text-slate-500 mt-1 text-sm">When this customer places an order, it will appear here.</p>
                            </div>
                        ) : (
                            <div>
                                {/* Mobile: Floating Cards */}
                                <div className="md:hidden p-4 space-y-4 bg-slate-50/50">
                                    {orders.map(order => (
                                        <div key={order._id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 text-sm">#{order.orderId?.slice(-6) || 'N/A'}</span>
                                                    <span className="text-xs text-slate-500">{formatDate(order.createdAt)}</span>
                                                </div>
                                                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                                                        order.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                                                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-amber-100 text-amber-800'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between py-3 border-t border-slate-100">
                                                <div className="flex items-center gap-2 text-slate-600 text-sm">
                                                    <Package className="w-4 h-4 text-slate-400" />
                                                    <span>{order.items?.length || 0} items</span>
                                                </div>
                                                <div className="font-bold text-slate-900">
                                                    {formatPrice(order.pricing?.total || 0)}
                                                </div>
                                            </div>

                                            <Link
                                                to={`/admin/orders/${order._id}`}
                                                className="block w-full text-center py-2.5 mt-2 bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-100 transition-colors border border-slate-100"
                                            >
                                                View Details
                                            </Link>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop: Table */}
                                <div className="hidden md:block">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50/80 text-xs font-bold uppercase text-slate-500 border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-4">Order ID</th>
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">Items</th>
                                                <th className="px-6 py-4 text-right">Total</th>
                                                <th className="px-6 py-4"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {orders.map(order => (
                                                <tr key={order._id} className="group hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <Link to={`/admin/orders/${order._id}`} className="font-bold text-slate-900 hover:text-blue-600 transition-colors">
                                                            #{order.orderId?.slice(-6) || 'N/A'}
                                                        </Link>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">
                                                        {formatDate(order.createdAt)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                                                                order.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                                                                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                                        'bg-amber-100 text-amber-800'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">
                                                        {order.items?.length || 0} items
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                                                        {formatPrice(order.pricing?.total || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Link
                                                            to={`/admin/orders/${order._id}`}
                                                            className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        >
                                                            <ExternalLink size={16} />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetail;

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    Eye, Search, Filter, ChevronLeft, ChevronRight,
    Clock, Truck, CheckCircle, XCircle, Package,
    AlertCircle, RefreshCw, ShoppingCart
} from 'lucide-react';
import { orderAPI } from '../../services/api';
import toast from 'react-hot-toast';

const OrderStatusBadge = ({ status }) => {
    const styles = {
        pending: 'bg-amber-50 text-amber-700 border-amber-200',
        processing: 'bg-blue-50 text-blue-700 border-blue-200',
        shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
        refunded: 'bg-slate-50 text-slate-700 border-slate-200',
        on_hold: 'bg-orange-50 text-orange-700 border-orange-200'
    };

    return (
        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${styles[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            {status?.replace('_', ' ')}
        </span>
    );
};

const PaymentStatusBadge = ({ status }) => {
    const styles = {
        pending: 'bg-amber-100 text-amber-800',
        completed: 'bg-emerald-100 text-emerald-800',
        failed: 'bg-rose-100 text-rose-800',
        refunded: 'bg-slate-100 text-slate-800'
    };

    return (
        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
            {status}
        </span>
    );
};

const OrderList = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    // Filters from URL
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page')) || 1;

    useEffect(() => {
        fetchOrders();
    }, [searchParams]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await orderAPI.getAdminOrders({
                search,
                status,
                page,
                limit: 15
            });
            setOrders(response.data.data.orders || []);
            setPagination(response.data.data.pagination || { page: 1, pages: 1, total: 0 });
        } catch (err) {
            console.error('Failed to fetch orders:', err);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const searchValue = formData.get('search');
        setSearchParams(prev => {
            if (searchValue) {
                prev.set('search', searchValue);
            } else {
                prev.delete('search');
            }
            prev.set('page', '1');
            return prev;
        });
    };

    const handleFilterChange = (key, value) => {
        setSearchParams(prev => {
            if (value) {
                prev.set(key, value);
            } else {
                prev.delete(key);
            }
            prev.set('page', '1');
            return prev;
        });
    };

    const handlePageChange = (newPage) => {
        setSearchParams(prev => {
            prev.set('page', newPage.toString());
            return prev;
        });
        window.scrollTo(0, 0);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Orders</h1>
                    <p className="text-slate-500 mt-1">{pagination.total} orders total</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                name="search"
                                defaultValue={search}
                                placeholder="Search by Order ID, Customer Name..."
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                            />
                        </div>
                    </form>

                    {/* Status Filter */}
                    <select
                        value={status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 text-slate-700 font-medium min-w-[160px]"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                    </select>
                </div>
            </div>

            {/* Orders List */}
            <div>
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingCart className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No orders found</h3>
                        <p className="text-slate-500 mt-1">Orders will appear here once customers place them.</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile: Floating Cards View */}
                        <div className="lg:hidden space-y-4">
                            {orders.map(order => (
                                <Link
                                    key={order._id}
                                    to={`/admin/orders/${order._id}`}
                                    className="block bg-white rounded-2xl p-5 shadow-sm border border-slate-100 active:scale-[0.98] transition-transform"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="font-bold text-slate-900 text-base block mb-0.5">#{order.orderId?.slice(-6)}</span>
                                            <span className="text-xs text-slate-500 font-mono">{formatDate(order.createdAt)}</span>
                                        </div>
                                        <OrderStatusBadge status={order.status} />
                                    </div>

                                    <div className="py-3 border-t border-b border-slate-50 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Customer</span>
                                            <span className="font-medium text-slate-900 text-right">{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Total</span>
                                            <span className="font-bold text-slate-900">₹{((order.pricing?.total || 0) / 100).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between text-sm items-center">
                                            <span className="text-slate-500">Payment</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400 uppercase">{order.payment?.method}</span>
                                                <PaymentStatusBadge status={order.payment?.status} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-3 text-xs text-slate-600 font-medium bg-slate-50 p-2 rounded-lg truncate">
                                        <Package size={14} className="text-slate-400" />
                                        <span className="truncate">
                                            {order.items?.map(i => `${i.productName} (${i.quantity})`).join(', ')}
                                        </span>
                                    </div>

                                    <div className="mt-3 text-center text-blue-600 font-semibold text-sm">
                                        View Details
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Desktop: Table View */}
                        <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Order ID</th>
                                        <th className="px-6 py-4">Customer</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Payment</th>
                                        <th className="px-6 py-4 text-right">Total</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {orders.map(order => (
                                        <tr key={order._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <Link to={`/admin/orders/${order._id}`} className="font-bold text-slate-900 hover:text-blue-600 transition-colors">
                                                    #{order.orderId}
                                                </Link>
                                                <p className="text-xs text-slate-400 mt-1 truncate max-w-[180px]">
                                                    {order.items?.length} items
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-slate-900">
                                                    {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                                                </p>
                                                <p className="text-xs text-slate-500">{order.shippingAddress?.email}</p>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {formatDate(order.createdAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <OrderStatusBadge status={order.status} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className="text-xs text-slate-500 uppercase font-medium">{order.payment?.method || '-'}</span>
                                                    <PaymentStatusBadge status={order.payment?.status} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-slate-900">
                                                    ₹{((order.pricing?.total || 0) / 100).toLocaleString('en-IN')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    to={`/admin/orders/${order._id}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-blue-100"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="flex justify-center mt-6">
                                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-2 flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page <= 1}
                                        className="p-2 rounded-lg hover:bg-slate-50 text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <span className="px-4 text-sm font-semibold text-slate-700">
                                        Page {pagination.page} of {pagination.pages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page >= pagination.pages}
                                        className="p-2 rounded-lg hover:bg-slate-50 text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default OrderList;

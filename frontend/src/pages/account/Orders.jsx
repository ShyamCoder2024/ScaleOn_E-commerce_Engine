import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronLeft, ChevronRight, Search, Filter, CheckCircle, ThumbsUp, ShieldCheck, Headphones, Lock, Calendar, Truck, Clock, ExternalLink, Eye, Ban, ChevronDown } from "lucide-react";
import { orderAPI } from '../../services/api';
import { useConfig } from '../../context/ConfigContext';

const Orders = () => {
    const { formatPrice } = useConfig();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1 });
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetchOrders();
    }, [filter]);

    const fetchOrders = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 10 };
            if (filter) params.status = filter;

            const response = await orderAPI.getOrders(params);
            const data = response.data.data;

            setOrders(data.orders || data.items || []);
            setPagination(data.pagination || { page: 1, pages: 1 });
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            shipped: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            refunded: 'bg-gray-100 text-gray-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading && orders.length === 0) {
        return (
            <div className="container-custom py-8">
                <h1 className="text-2xl font-bold mb-8">My Orders</h1>
                <div className="space-y-4">
                    {[...Array(3)].map((_, idx) => (
                        <div key={idx} className="card p-6">
                            <div className="flex justify-between mb-4">
                                <div className="skeleton h-5 w-32" />
                                <div className="skeleton h-5 w-24" />
                            </div>
                            <div className="skeleton h-4 w-48 mb-2" />
                            <div className="skeleton h-4 w-32" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-[80vh]">
            <div className="container-custom py-8">
                {/* Back Button */}
                <Link
                    to="/account"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Account
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>

                    {/* Filter */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter size={18} className="text-gray-400" />
                        </div>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full sm:w-[200px] pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none cursor-pointer transition-all shadow-sm hover:shadow-md hover:border-gray-300"
                        >
                            <option value="">All Orders</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <ChevronDown size={16} className="text-gray-400" />
                        </div>
                    </div>
                </div>

                {orders.length > 0 ? (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <Link
                                key={order._id}
                                to={`/orders/${order._id}`}
                                className="card p-4 sm:p-6 block hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-bold text-gray-900">
                                                {order.orderId}
                                            </span>
                                            <span className={`badge ${getStatusColor(order.status)}`}>
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Placed on {formatDate(order.createdAt)}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-4">
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">
                                                {formatPrice(order.pricing?.total)}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                                            </p>
                                        </div>
                                        <ChevronRight className="text-gray-400" size={20} />
                                    </div>
                                </div>

                                {/* Items Preview */}
                                {order.items && order.items.length > 0 && (
                                    <div className="mt-4 pt-4 border-t flex gap-2 overflow-x-auto">
                                        {order.items.slice(0, 4).map((item, idx) => (
                                            <div key={idx} className="shrink-0">
                                                <img
                                                    src={item.image || 'https://placehold.co/60x60/e2e8f0/475569'}
                                                    alt={item.productName}
                                                    className="w-14 h-14 object-cover rounded"
                                                />
                                            </div>
                                        ))}
                                        {order.items.length > 4 && (
                                            <div className="shrink-0 w-14 h-14 bg-gray-100 rounded flex items-center justify-center text-gray-500 text-sm">
                                                +{order.items.length - 4}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Link>
                        ))}

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                {[...Array(pagination.pages)].map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => fetchOrders(idx + 1)}
                                        className={`w-10 h-10 rounded-lg font-medium ${pagination.page === idx + 1
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-white border hover:bg-gray-50'
                                            }`}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="card p-12 text-center">
                        <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Package className="text-gray-400" size={40} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h2>
                        <p className="text-gray-600 mb-6">
                            When you place orders, they will appear here.
                        </p>
                        <Link to="/products" className="btn-primary">
                            Start Shopping
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Package, ShoppingCart, Users, DollarSign,
    TrendingUp, AlertCircle, ArrowRight,
    Clock, Truck, XCircle, CheckCircle
} from 'lucide-react';
import { adminAPI, orderAPI, productAPI } from '../../services/api';
import toast from 'react-hot-toast';

// --- Premium UI Components ---

const StatCard = ({ title, value, icon: Icon, colorClass, trend }) => (
    <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-slate-100 transition-all duration-300 hover:shadow-[0_8px_30px_-12px_rgba(6,81,237,0.2)] hover:-translate-y-1">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-semibold text-slate-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
                {trend && (
                    <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        <TrendingUp size={14} className={trend < 0 ? 'rotate-180' : ''} />
                        <span>{Math.abs(trend)}% from last month</span>
                    </div>
                )}
            </div>
            <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 ring-1 ring-inset ring-black/5`}>
                <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
            </div>
        </div>
    </div>
);

const SectionHeader = ({ title, link, linkText }) => (
    <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
        {link && (
            <Link
                to={link}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 group"
            >
                {linkText || 'View All'}
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
        )}
    </div>
);

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
        <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border ${styles[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            {status}
        </span>
    );
};

// --- Main Dashboard ---

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        totalProducts: 0,
        totalCustomers: 0,
        statusCounts: {}
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [dashboardRes, ordersRes, productsRes] = await Promise.all([
                adminAPI.getDashboard(),
                orderAPI.getAdminOrders({ limit: 5 }),
                productAPI.getProducts({ limit: 10, sort: 'inventory' })
            ]);

            const dashboard = dashboardRes.data.data;
            setStats({
                totalOrders: dashboard.orders?.totalOrders || 0,
                totalRevenue: dashboard.orders?.totalRevenue || 0,
                totalProducts: dashboard.products?.total || 0,
                totalCustomers: dashboard.customers?.total || 0,
                statusCounts: dashboard.orders?.statusCounts || {}
            });
            setRecentOrders(dashboard.recentOrders || ordersRes.data.data.orders || []);
            setLowStockProducts(
                dashboard.lowStockProducts ||
                productsRes.data.data.products?.filter(p => p.inventory <= 10) || []
            );
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-slate-100 rounded-2xl h-36" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 mt-1"> Overview of your store's performance.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm hidden sm:block">
                        Last refreshed: Just now
                    </span>
                    <Link
                        to="/admin/products/new"
                        className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95 flex items-center gap-2"
                    >
                        <Package size={18} />
                        Add Product
                    </Link>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link to="/admin/revenue" className="block group">
                    <StatCard
                        title="Total Revenue"
                        value={`₹${((stats.totalRevenue || 0) / 100).toLocaleString('en-IN')}`}
                        icon={DollarSign}
                        colorClass="bg-emerald-500 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-emerald-50"
                        trend={12.5}
                    />
                </Link>
                <StatCard
                    title="Total Orders"
                    value={stats.totalOrders}
                    icon={ShoppingCart}
                    colorClass="bg-blue-500 text-blue-600"
                    trend={8.2}
                />
                <StatCard
                    title="Products"
                    value={stats.totalProducts}
                    icon={Package}
                    colorClass="bg-violet-500 text-violet-600"
                />
                <StatCard
                    title="Customers"
                    value={stats.totalCustomers}
                    icon={Users}
                    colorClass="bg-orange-500 text-orange-600"
                    trend={2.4}
                />
            </div>

            {/* Order Status Cards */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
                <SectionHeader title="Order Status Overview" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {[
                        { id: 'pending', label: 'Pending', icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                        { id: 'processing', label: 'Processing', icon: TrendingUp, color: 'text-blue-600 bg-blue-50 border-blue-100' },
                        { id: 'shipped', label: 'Shipped', icon: Truck, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                        { id: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                        { id: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                        { id: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-rose-600 bg-rose-50 border-rose-100' },
                        { id: 'refunded', label: 'Refunded', icon: AlertCircle, color: 'text-slate-600 bg-slate-50 border-slate-100' },
                    ].map((status) => (
                        <div
                            key={status.id}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-colors hover:bg-opacity-80 ${status.color}`}
                        >
                            <status.icon size={24} className="mb-2 opacity-80" />
                            <span className="text-2xl font-bold mb-0.5">{stats.statusCounts?.[status.id] || 0}</span>
                            <span className="text-xs font-semibold opacity-70 uppercase tracking-wider">{status.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Recent Orders */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
                    <div className="p-6 md:p-8 pb-4">
                        <SectionHeader title="Recent Orders" link="/admin/orders" />
                    </div>
                    <div className="flex-1">
                        {/* Mobile: Stacked Cards */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {recentOrders.length === 0 ? (
                                <div className="p-6 text-center text-slate-400 text-sm">No orders found</div>
                            ) : (
                                recentOrders.map((order) => (
                                    <div key={order._id} className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 text-sm">#{order.orderId?.slice(-6) || 'N/A'}</span>
                                                <span className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <StatusBadge status={order.status} />
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600">{order.items?.length || 0} items</span>
                                            <span className="font-bold text-slate-900">₹{((order.pricing?.total || 0) / 100).toLocaleString('en-IN')}</span>
                                        </div>
                                        <Link
                                            to={`/admin/orders/${order._id}`}
                                            className="block w-full text-center py-2 rounded-lg bg-slate-50 text-blue-600 text-sm font-medium hover:bg-slate-100 transition-colors"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Desktop: Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-y border-slate-100 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold tracking-wider">Order ID</th>
                                        <th className="px-6 py-4 font-semibold tracking-wider">Items</th>
                                        <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                                        <th className="px-6 py-4 font-semibold tracking-wider text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {recentOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-slate-400">No orders found</td>
                                        </tr>
                                    ) : (
                                        recentOrders.map((order) => (
                                            <tr key={order._id} className="group hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-4">
                                                    <Link to={`/admin/orders/${order._id}`} className="font-medium text-slate-900 hover:text-blue-600 transition-colors">
                                                        #{order.orderId?.slice(-6) || 'N/A'}
                                                    </Link>
                                                    <div className="text-xs text-slate-400 mt-0.5">
                                                        {new Date(order.createdAt).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {order.items?.length || 0} items
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={order.status} />
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold text-slate-900">
                                                    ₹{((order.pricing?.total || 0) / 100).toLocaleString('en-IN')}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
                    <div className="p-6 md:p-8 pb-4">
                        <SectionHeader title="Low Stock Alerts" link="/admin/products" />
                    </div>
                    <div className="flex-1 px-4 pb-4 space-y-3">
                        {lowStockProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                <CheckCircle size={48} className="mb-4 text-emerald-100" />
                                <p>All items are well stocked</p>
                            </div>
                        ) : (
                            lowStockProducts.map((product) => (
                                <div
                                    key={product._id}
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-rose-50/30 border border-transparent hover:border-rose-100 transition-all group"
                                >
                                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                                        <img
                                            src={product.images?.[0]?.url || '/placeholder.jpg'}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-slate-900 truncate group-hover:text-rose-700 transition-colors">
                                            {product.name}
                                        </h4>
                                        <p className="text-xs text-slate-500">SKU: {product.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold ${product.inventory === 0
                                            ? 'bg-rose-100 text-rose-700'
                                            : 'bg-amber-100 text-amber-800'
                                            }`}>
                                            {product.inventory === 0 ? 'Out of Stock' : `${product.inventory} left`}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

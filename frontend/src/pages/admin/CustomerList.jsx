import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
    Search, ChevronLeft, ChevronRight, Users,
    Mail, Calendar, ShoppingBag, Eye, Phone
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CustomerList = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page')) || 1;

    useEffect(() => {
        fetchCustomers();
    }, [searchParams]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getCustomers({
                search,
                page,
                limit: 15
            });
            setCustomers(response.data.data.customers || []);
            setPagination(response.data.data.pagination || { page: 1, pages: 1, total: 0 });
        } catch (err) {
            console.error('Failed to fetch customers:', err);
            toast.error('Failed to load customers');
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

    const handlePageChange = (newPage) => {
        setSearchParams(prev => {
            prev.set('page', newPage.toString());
            return prev;
        });
        window.scrollTo(0, 0);
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
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
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Customers</h1>
                    <p className="text-slate-500 mt-1">{pagination.total} customers total</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <form onSubmit={handleSearch} className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            name="search"
                            defaultValue={search}
                            placeholder="Search by Name, Email, or Phone..."
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                        />
                    </div>
                </form>
            </div>

            {/* Customers List */}
            <div>
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No customers found</h3>
                        <p className="text-slate-500 mt-1">Customers will appear here when they register on your store.</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile: Floating Cards View */}
                        <div className="lg:hidden space-y-4">
                            {customers.map(customer => (
                                <div key={customer._id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                            <span className="text-xl font-bold text-slate-600">
                                                {customer.profile?.firstName?.[0] || customer.email?.[0]?.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-slate-900 truncate text-lg">
                                                {customer.profile?.firstName} {customer.profile?.lastName}
                                            </h3>
                                            <div className="flex items-center gap-2 text-slate-500 text-sm truncate mt-0.5">
                                                <Mail size={14} />
                                                <span className="truncate">{customer.email}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-slate-50 rounded-xl p-3">
                                            <div className="text-xs text-slate-500 mb-1">Orders</div>
                                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                                <ShoppingBag size={16} className="text-blue-500" />
                                                {customer.orderCount || 0}
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-3">
                                            <div className="text-xs text-slate-500 mb-1">Joined</div>
                                            <div className="font-semibold text-slate-900 text-sm">
                                                {formatDate(customer.createdAt)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-50 flex justify-end">
                                        <Link
                                            to="#"
                                            // Future: Link to Customer Detail Page if implemented
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors"

                                        >
                                            <Eye size={16} /> View Details
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop: Table View */}
                        <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Customer</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">Joined</th>
                                        <th className="px-6 py-4">Orders</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {customers.map(customer => (
                                        <tr key={customer._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                                        <span className="font-bold text-slate-600">
                                                            {customer.profile?.firstName?.[0] || customer.email?.[0]?.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">
                                                            {customer.profile?.firstName} {customer.profile?.lastName}
                                                        </p>
                                                        {customer.profile?.phone && (
                                                            <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                                                                <Phone size={10} />
                                                                <span>{customer.profile.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-600">{customer.email}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-600">{formatDate(customer.createdAt)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 font-medium text-slate-900">
                                                    <ShoppingBag size={14} className="text-slate-400" />
                                                    {customer.orderCount || 0}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                    Active
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    to={`/admin/customers/${customer._id}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-sm font-semibold transition-colors border border-slate-100 hover:border-blue-100"
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

export default CustomerList;

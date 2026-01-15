import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, MapPin, Lock, Package, LogOut, ChevronRight, Edit2, Plus, Trash2, X, Check, Search, Headphones, Mail, Phone, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI, orderAPI } from '../../services/api';
import { useConfig } from '../../context/ConfigContext';
import toast from 'react-hot-toast';

const Account = () => {
    const { user, logout, updateProfile, refetchUser } = useAuth();
    const { formatPrice } = useConfig();
    const location = useLocation();

    // Check for tab in URL
    const searchParams = new URLSearchParams(location.search);
    const initialTab = searchParams.get('tab') || 'profile';

    const [activeTab, setActiveTab] = useState(initialTab);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Orders State
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [ordersPagination, setOrdersPagination] = useState({ page: 1, limit: 10, pages: 1 });

    // Address modal state
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [addressForm, setAddressForm] = useState({
        firstName: '',
        lastName: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        phone: '',
        isDefault: false
    });

    const [formData, setFormData] = useState({
        firstName: user?.profile?.firstName || '',
        lastName: user?.profile?.lastName || '',
        phone: user?.profile?.phone || '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // Fetch Orders when activeTab is orders
    useEffect(() => {
        if (activeTab === 'orders') {
            fetchOrders();
        }
    }, [activeTab]);

    const fetchOrders = async (page = 1) => {
        setOrdersLoading(true);
        try {
            const response = await orderAPI.getOrders({ page, limit: 10 });
            const data = response.data.data;
            setOrders(data.orders || data.items || []);
            setOrdersPagination(data.pagination || { page: 1, limit: 10, pages: 1 });
        } catch (err) {
            console.error('Failed to fetch orders:', err);
            toast.error('Failed to load orders');
        } finally {
            setOrdersLoading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);

        const result = await updateProfile(formData);

        if (result.success) {
            toast.success('Profile updated successfully');
            setEditing(false);
        } else {
            toast.error(result.error);
        }

        setLoading(false);
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            await authAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success('Password changed successfully. Please login again.');
            logout();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to change password');
        }

        setLoading(false);
    };

    // Address handlers
    const openAddAddressModal = () => {
        setEditingAddress(null);
        setAddressForm({
            firstName: user?.profile?.firstName || '',
            lastName: user?.profile?.lastName || '',
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'India',
            phone: user?.profile?.phone || '',
            isDefault: (user?.profile?.addresses?.length || 0) === 0
        });
        setShowAddressModal(true);
    };

    const openEditAddressModal = (address) => {
        setEditingAddress(address);
        setAddressForm({
            firstName: address.firstName || '',
            lastName: address.lastName || '',
            street: address.street || '',
            city: address.city || '',
            state: address.state || '',
            postalCode: address.postalCode || '',
            country: address.country || 'India',
            phone: address.phone || '',
            isDefault: address.isDefault || false
        });
        setShowAddressModal(true);
    };

    const handleAddressFormChange = (field, value) => {
        setAddressForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();

        // Validation
        if (!addressForm.firstName || !addressForm.lastName || !addressForm.street ||
            !addressForm.city || !addressForm.state || !addressForm.postalCode) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);

        try {
            if (editingAddress) {
                await authAPI.updateAddress(editingAddress._id, addressForm);
                toast.success('Address updated successfully');
            } else {
                await authAPI.addAddress(addressForm);
                toast.success('Address added successfully');
            }
            setShowAddressModal(false);
            refetchUser();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save address');
        }

        setLoading(false);
    };

    const handleDeleteAddress = async (addressId) => {
        if (!confirm('Are you sure you want to delete this address?')) return;

        try {
            await authAPI.deleteAddress(addressId);
            toast.success('Address deleted');
            refetchUser();
        } catch (err) {
            toast.error('Failed to delete address');
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

    const tabs = [
        { id: 'profile', name: 'Profile', icon: User },
        { id: 'orders', name: 'My Orders', icon: Package },
        { id: 'addresses', name: 'Addresses', icon: MapPin },
        { id: 'security', name: 'Security', icon: Lock },
    ];

    return (
        <div className="bg-gray-50 min-h-[80vh]">
            <div className="container-custom py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6 lg:mb-8">My Account</h1>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Mobile Navigation (Grid Layout & User Card) */}
                    <div className="lg:hidden flex flex-col gap-4 mb-6">
                        {/* Mobile User Card */}
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                                    {user?.profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-900 leading-tight">
                                        {user?.profile?.firstName || 'User'}
                                    </span>
                                    <span className="text-xs text-gray-500">{user?.email}</span>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-50"
                                title="Logout"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>

                        {/* Navigation Grid (2x2) */}
                        <div className="grid grid-cols-2 gap-2 bg-gray-50">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${activeTab === tab.id
                                        ? 'bg-white border-primary-200 shadow-sm'
                                        : 'bg-white border-gray-100 text-gray-500'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeTab === tab.id ? 'bg-primary-50 text-primary-600' : 'bg-gray-50 text-gray-400'}`}>
                                        <tab.icon size={20} />
                                    </div>
                                    <span className={`text-sm font-bold ${activeTab === tab.id ? 'text-gray-900' : 'text-gray-600'}`}>
                                        {tab.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Desktop Sidebar */}
                    <aside className="hidden lg:block lg:w-72 lg:shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-32">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-xl">
                                    {user?.profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-lg">
                                        {user?.profile?.firstName || 'User'}
                                    </p>
                                    <p className="text-sm text-gray-500">{user?.email}</p>
                                </div>
                            </div>

                            <nav className="space-y-2">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium ${activeTab === tab.id
                                            ? 'bg-primary-50 text-primary-600'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <tab.icon size={20} />
                                        {tab.name}
                                        {activeTab === tab.id && <ChevronRight size={16} className="ml-auto" />}
                                    </button>
                                ))}

                                <div className="my-4 border-t border-gray-100" />

                                <button
                                    onClick={logout}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-600 hover:bg-red-50 font-medium transition-colors"
                                >
                                    <LogOut size={20} />
                                    Logout
                                </button>
                            </nav>
                        </div>
                    </aside>

                    <div className="flex-1 min-w-0">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
                                        <p className="text-gray-500 text-sm mt-1">Manage your personal details</p>
                                    </div>
                                    {!editing && (
                                        <button
                                            onClick={() => setEditing(true)}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                                        >
                                            <Edit2 size={16} />
                                            Edit
                                        </button>
                                    )}
                                </div>

                                {editing ? (
                                    <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-2xl">
                                        <div className="grid sm:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    First Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.firstName}
                                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Last Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.lastName}
                                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                value={user?.email}
                                                disabled
                                                className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl text-gray-500 cursor-not-allowed"
                                            />
                                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                                <Lock size={12} /> Email cannot be changed
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
                                                placeholder="+91 XXXXX XXXXX"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4 pt-4">
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-gray-200"
                                            >
                                                {loading ? 'Saving Changes...' : 'Save Changes'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditing(false)}
                                                className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="bg-gray-50 rounded-2xl p-6 sm:p-8">
                                        <div className="grid sm:grid-cols-2 gap-8 mb-8">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 mb-1">First Name</p>
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {user?.profile?.firstName || '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 mb-1">Last Name</p>
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {user?.profile?.lastName || '-'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-8">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 mb-1">Email Address</p>
                                                <p className="text-lg font-semibold text-gray-900">{user?.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 mb-1">Phone Number</p>
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {user?.profile?.phone || '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Orders Tab */}
                        {activeTab === 'orders' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">My Orders</h2>

                                {ordersLoading ? (
                                    <div className="space-y-4">
                                        {[...Array(3)].map((_, idx) => (
                                            <div key={idx} className="border border-gray-100 rounded-xl p-6">
                                                <div className="flex justify-between mb-4">
                                                    <div className="skeleton h-5 w-32" />
                                                    <div className="skeleton h-5 w-24" />
                                                </div>
                                                <div className="skeleton h-4 w-48 mb-2" />
                                                <div className="skeleton h-4 w-32" />
                                            </div>
                                        ))}
                                    </div>
                                ) : orders.length > 0 ? (
                                    <div className="space-y-4">
                                        {orders.map(order => (
                                            <Link
                                                key={order._id}
                                                to={`/orders/${order._id}`}
                                                className="block border border-gray-100 rounded-xl p-4 sm:p-6 hover:shadow-md hover:border-primary-100 transition-all group"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                                                                {order.orderId}
                                                            </span>
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(order.status)}`}>
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-500">
                                                            Placed on {formatDate(order.createdAt)}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center justify-between sm:justify-end gap-4">
                                                        <div className="text-right">
                                                            <p className="font-bold text-gray-900 text-lg">
                                                                {formatPrice(order.pricing?.total)}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                                                            </p>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                                            <ChevronRight size={18} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Items Preview */}
                                                {order.items && order.items.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-gray-50 flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                                                        {order.items.slice(0, 4).map((item, idx) => (
                                                            <div key={idx} className="shrink-0 relative group/item">
                                                                <img
                                                                    src={item.image || 'https://placehold.co/60x60/e2e8f0/475569'}
                                                                    alt={item.productName}
                                                                    className="w-12 h-12 object-cover rounded-lg border border-gray-100"
                                                                />
                                                            </div>
                                                        ))}
                                                        {order.items.length > 4 && (
                                                            <div className="shrink-0 w-12 h-12 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-xs font-bold">
                                                                +{order.items.length - 4}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Link>
                                        ))}

                                        {/* Pagination */}
                                        {ordersPagination.pages > 1 && (
                                            <div className="flex justify-center gap-2 mt-6">
                                                {[...Array(ordersPagination.pages)].map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => fetchOrders(idx + 1)}
                                                        className={`w-10 h-10 rounded-lg font-bold transition-colors ${ordersPagination.page === idx + 1
                                                            ? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
                                                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {idx + 1}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                            <Package size={24} className="text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">No orders yet</h3>
                                        <p className="text-gray-500 mb-6">When you place orders, they will appear here</p>
                                        <Link to="/products" className="inline-flex px-6 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200">
                                            Start Shopping
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Addresses Tab */}
                        {activeTab === 'addresses' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Saved Addresses</h2>
                                        <p className="text-gray-500 text-sm mt-1">Manage your shipping destinations</p>
                                    </div>
                                    <button
                                        onClick={openAddAddressModal}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-all shadow-lg shadow-gray-200"
                                    >
                                        <Plus size={18} />
                                        Add New
                                    </button>
                                </div>

                                {user?.profile?.addresses?.length > 0 ? (
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {user.profile.addresses.map(address => (
                                            <div key={address._id} className="group border border-gray-200 hover:border-primary-500 rounded-2xl p-5 relative transition-all bg-gray-50 hover:bg-white hover:shadow-md">
                                                {address.isDefault && (
                                                    <span className="absolute top-4 right-4 px-2.5 py-1 bg-primary-100 text-primary-700 text-xs font-bold uppercase tracking-wide rounded-full">
                                                        Default
                                                    </span>
                                                )}
                                                <div className="pr-12">
                                                    <p className="font-bold text-gray-900 text-lg mb-1">
                                                        {address.firstName} {address.lastName}
                                                    </p>
                                                    <p className="text-gray-600 text-sm leading-relaxed">
                                                        {address.street}<br />
                                                        {address.city}, {address.state} {address.postalCode}<br />
                                                        {address.country}
                                                    </p>
                                                    {address.phone && (
                                                        <p className="text-sm text-gray-500 mt-3 flex items-center gap-2">
                                                            <div className="w-1 h-1 rounded-full bg-gray-400" />
                                                            {address.phone}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
                                                    <button
                                                        onClick={() => openEditAddressModal(address)}
                                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all"
                                                    >
                                                        <Edit2 size={16} />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAddress(address._id)}
                                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-red-600 rounded-xl font-medium hover:bg-red-50 hover:border-red-100 transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                            <MapPin size={24} className="text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">No addresses saved</h3>
                                        <p className="text-gray-500 mb-6">Add an address for a faster checkout experience</p>
                                        <button
                                            onClick={openAddAddressModal}
                                            className="text-primary-600 font-medium hover:underline"
                                        >
                                            Add your first address
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                {/* Customer Care Section */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <Headphones size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Customer Care</h2>
                                            <p className="text-gray-500 text-sm">We are here to help you 24/7</p>
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="p-4 border border-gray-100 rounded-xl hover:border-blue-100 hover:bg-blue-50/50 transition-all group cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <Phone size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">Phone Support</p>
                                                    <p className="text-sm text-gray-500">+91 1800-123-4567</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 border border-gray-100 rounded-xl hover:border-purple-100 hover:bg-purple-50/50 transition-all group cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <Mail size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">Email Support</p>
                                                    <p className="text-sm text-gray-500">support@supermart.com</p>
                                                </div>
                                            </div>
                                        </div>


                                    </div>
                                </div>

                                {/* Change Password Section */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                                            <Lock size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
                                            <p className="text-gray-500 text-sm">Update your password securely</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handlePasswordChange} className="max-w-xl space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Current Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    value={passwordData.currentPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                    required
                                                    placeholder="••••••••"
                                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                New Password
                                            </label>
                                            <input
                                                type="password"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                required
                                                minLength={8}
                                                placeholder="••••••••"
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
                                            />
                                            <p className="text-xs text-gray-500 mt-2">Must be at least 8 characters long</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Confirm New Password
                                            </label>
                                            <input
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                required
                                                placeholder="••••••••"
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
                                            />
                                        </div>
                                        <div className="pt-2">
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full sm:w-auto px-8 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-gray-200"
                                            >
                                                {loading ? 'Updating Password...' : 'Update Password'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Premium Address Modal */}
            {showAddressModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowAddressModal(false)}
                    />
                    <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingAddress ? 'Edit Address' : 'Add New Address'}
                            </h3>
                            <button
                                onClick={() => setShowAddressModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6">
                            <form onSubmit={handleSaveAddress} className="space-y-6">
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            First Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={addressForm.firstName}
                                            onChange={(e) => handleAddressFormChange('firstName', e.target.value)}
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Last Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={addressForm.lastName}
                                            onChange={(e) => handleAddressFormChange('lastName', e.target.value)}
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Street Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={addressForm.street}
                                        onChange={(e) => handleAddressFormChange('street', e.target.value)}
                                        required
                                        placeholder="Flat, House no., Building, Company, Apartment"
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            City <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={addressForm.city}
                                            onChange={(e) => handleAddressFormChange('city', e.target.value)}
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            State <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={addressForm.state}
                                            onChange={(e) => handleAddressFormChange('state', e.target.value)}
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Postal Code <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={addressForm.postalCode}
                                            onChange={(e) => handleAddressFormChange('postalCode', e.target.value)}
                                            required
                                            placeholder="400001"
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Country
                                        </label>
                                        <input
                                            type="text"
                                            value={addressForm.country}
                                            onChange={(e) => handleAddressFormChange('country', e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl text-gray-500 cursor-not-allowed"
                                            disabled
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={addressForm.phone}
                                        onChange={(e) => handleAddressFormChange('phone', e.target.value)}
                                        placeholder="+91 XXXXX XXXXX"
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
                                    />
                                </div>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={addressForm.isDefault}
                                            onChange={(e) => handleAddressFormChange('isDefault', e.target.checked)}
                                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-primary-600 checked:bg-primary-600 hover:border-primary-500"
                                        />
                                        <Check size={14} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Set as default address</span>
                                </label>

                                <div className="flex gap-4 pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 px-6 py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-gray-200 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Saving...' : (editingAddress ? 'Update Address' : 'Add Address')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddressModal(false)}
                                        className="flex-1 px-6 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
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

export default Account;

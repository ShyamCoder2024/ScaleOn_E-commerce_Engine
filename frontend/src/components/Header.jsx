import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ShoppingCart, User, Search, Heart, ChevronDown, Package, Settings, LogOut, Grid, List, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useConfig } from '../context/ConfigContext';
import { useWishlist } from '../context/WishlistContext';
import { categoryAPI } from '../services/api';

const Header = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user, isAdmin, logout } = useAuth();
    const { totals } = useCart();
    const { storeName, logo, isFeatureEnabled } = useConfig();
    const { wishlistCount } = useWishlist();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState([]);
    const [showMobileSearch, setShowMobileSearch] = useState(false);

    // Feature flags
    const wishlistEnabled = isFeatureEnabled('wishlist');
    const categoriesEnabled = isFeatureEnabled('categories');
    const searchEnabled = isFeatureEnabled('search');

    // Products Page Logic
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const isProductsPage = location.pathname === '/products';

    // Derived state from URL for sorting/view
    const currentSort = searchParams.get('sort') || '-createdAt';
    const currentView = searchParams.get('view') || 'grid';

    const handleSortChange = (e) => {
        const params = new URLSearchParams(searchParams);
        params.set('sort', e.target.value);
        setSearchParams(params);
    };

    const handleViewChange = (mode) => {
        const params = new URLSearchParams(searchParams);
        params.set('view', mode);
        setSearchParams(params);
    };

    // Sort Options
    const sortOptions = [
        { value: '-createdAt', label: 'Newest First' },
        { value: 'createdAt', label: 'Oldest First' },
        { value: 'price', label: 'Price: Low to High' },
        { value: '-price', label: 'Price: High to Low' },
        { value: 'name', label: 'Name: A-Z' },
        { value: '-name', label: 'Name: Z-A' },
        { value: '-salesCount', label: 'Best Selling' },
    ];

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await categoryAPI.getAll();
                setCategories(response.data.data.categories || []);
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };
        fetchCategories();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            setShowMobileSearch(false);
        }
    };

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="container-custom">
                {/* Main Header Row */}
                <div className="flex items-center justify-between h-14 md:h-16">

                    {/* Left: Logo + Name */}
                    <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
                        {logo && (
                            <img
                                src={logo}
                                alt={storeName}
                                className="h-7 md:h-8 w-auto object-contain transition-transform group-hover:scale-105"
                            />
                        )}
                        <span className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">{storeName}</span>
                    </Link>

                    {/* Center: Search Bar (Desktop Only) - Only show if search feature enabled */}
                    {searchEnabled && (
                        <form onSubmit={handleSearch} className="hidden md:flex flex-1 mx-10 max-w-2xl">
                            <div className="relative w-full">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full pl-14 pr-6 py-2.5 border-none bg-gray-50 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-100 focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                        </form>
                    )}

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3 md:gap-5">

                        {/* Categories Dropdown (Desktop) - Show when NOT on products page */}
                        {!isProductsPage && categories.length > 0 && (
                            <div className="relative hidden md:block">
                                <button
                                    onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
                                    onBlur={() => setTimeout(() => setCategoryMenuOpen(false), 200)}
                                    className="flex items-center gap-1.5 text-gray-700 hover:text-gray-900 font-medium"
                                >
                                    Categories
                                    <ChevronDown size={16} className={`transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {categoryMenuOpen && (
                                    <div className="absolute right-0 mt-3 w-52 bg-white rounded-xl shadow-lg border z-50 py-2">
                                        <Link to="/products" className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50 font-medium" onClick={() => setCategoryMenuOpen(false)}>
                                            All Products
                                        </Link>
                                        <div className="border-t my-1" />
                                        {categories.slice(0, 8).map(cat => (
                                            <Link key={cat._id} to={`/products?category=${cat._id}`} className="block px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900" onClick={() => setCategoryMenuOpen(false)}>
                                                {cat.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Product Controls (Only on Products Page) */}
                        {isProductsPage && (
                            <div className="hidden md:flex items-center gap-3">
                                {/* Sort Dropdown */}
                                <div className="relative">
                                    <select
                                        value={currentSort}
                                        onChange={handleSortChange}
                                        className="appearance-none pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                                    >
                                        {sortOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                                </div>

                                {/* View Toggle */}
                                <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
                                    <button
                                        onClick={() => handleViewChange('grid')}
                                        className={`p-1.5 rounded-md transition-all ${currentView === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                                        title="Grid View"
                                    >
                                        <Grid size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleViewChange('list')}
                                        className={`p-1.5 rounded-md transition-all ${currentView === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                                        title="List View"
                                    >
                                        <List size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Wishlist (Desktop) - Only show if feature enabled */}
                        {wishlistEnabled && (
                            <Link to="/wishlist" className="relative p-2 text-gray-600 hover:text-gray-900 hidden md:flex">
                                <Heart size={24} />
                                {wishlistCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {wishlistCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* Mobile Search Button - Only show if search feature enabled */}
                        {searchEnabled && (
                            <button onClick={() => setShowMobileSearch(!showMobileSearch)} className="md:hidden p-2 text-gray-600 hover:text-gray-900">
                                <Search size={22} />
                            </button>
                        )}
                        {/* Cart */}
                        <Link to="/cart" className="relative p-2 text-gray-600 hover:text-gray-900">
                            <ShoppingCart size={22} className="md:w-6 md:h-6" />
                            {totals.itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {totals.itemCount}
                                </span>
                            )}
                        </Link>

                        {/* Account */}
                        {isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm hover:bg-primary-200 transition-colors"
                                >
                                    {user?.profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                                </button>

                                {userMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border z-50 py-2">
                                            {/* User Info */}
                                            <div className="px-4 py-3 border-b">
                                                <p className="font-semibold text-gray-900 truncate">
                                                    {user?.profile?.firstName || 'User'}
                                                </p>
                                                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                                            </div>

                                            {/* Menu Items */}
                                            <Link to="/account" className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                                                <User size={18} />
                                                My Account
                                            </Link>
                                            <Link to="/orders" className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                                                <Package size={18} />
                                                My Orders
                                            </Link>
                                            {wishlistEnabled && (
                                                <Link to="/wishlist" className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                                                    <Heart size={18} />
                                                    Wishlist
                                                    {wishlistCount > 0 && (
                                                        <span className="ml-auto bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
                                                            {wishlistCount}
                                                        </span>
                                                    )}
                                                </Link>
                                            )}

                                            {isAdmin && (
                                                <>
                                                    <div className="border-t my-1" />
                                                    <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-primary-600 hover:bg-gray-50 font-medium" onClick={() => setUserMenuOpen(false)}>
                                                        <Settings size={18} />
                                                        Admin Panel
                                                    </Link>
                                                </>
                                            )}

                                            <div className="border-t my-1" />
                                            <button onClick={() => { logout(); setUserMenuOpen(false); }} className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-red-600 hover:bg-gray-50">
                                                <LogOut size={18} />
                                                Logout
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="p-2 text-gray-600 hover:text-gray-900">
                                <User size={22} className="md:w-6 md:h-6" />
                            </Link>
                        )}
                    </div>
                </div>

                {/* Mobile Search Bar (Expandable) - Only show if search feature enabled */}
                {searchEnabled && showMobileSearch && (
                    <div className="md:hidden pb-3">
                        <form onSubmit={handleSearch}>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products..."
                                    autoFocus
                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50"
                                />
                            </div>
                        </form>
                    </div>
                )}

                {/* Mobile Filter & Sort Bar (Only on Products Page) */}
                {isProductsPage && (
                    <div className="md:hidden flex items-center gap-3 pb-3">
                        <button
                            onClick={() => window.location.hash = 'filters'}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200"
                        >
                            <Filter size={18} />
                            Filters
                        </button>
                        <select
                            value={currentSort}
                            onChange={handleSortChange}
                            className="flex-1 appearance-none px-4 py-2 bg-gray-100 border-none rounded-lg text-sm font-medium text-gray-700 text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {sortOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Mobile Categories Bar (Hide on Products Page) */}
                {!isProductsPage && (
                    <div className="md:hidden flex items-center gap-2 pb-3 overflow-x-auto scrollbar-hide">
                        {categories.slice(0, 6).map(cat => (
                            <Link
                                key={cat._id}
                                to={`/products?category=${cat._id}`}
                                className="flex-shrink-0 px-4 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 whitespace-nowrap"
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;

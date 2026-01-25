import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ShoppingCart, User, Heart, ChevronDown, Package, Settings, LogOut, Grid, List, Search, Filter, Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useConfig } from '../context/ConfigContext';
import { useWishlist } from '../context/WishlistContext';
import { categoryAPI } from '../services/api';

const CATEGORIES_CACHE_KEY = 'app_categories_cache';
const CATEGORIES_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Get cached categories
const getCachedCategories = () => {
    try {
        const cached = sessionStorage.getItem(CATEGORIES_CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (data && timestamp && Date.now() - timestamp < CATEGORIES_CACHE_EXPIRY) {
                return data;
            }
        }
    } catch (e) {
        console.error('Categories cache read error:', e);
    }
    return null;
};

// Save categories to cache
const setCachedCategories = (data) => {
    try {
        sessionStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch (e) {
        console.error('Categories cache write error:', e);
    }
};

const Header = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user, isAdmin, logout } = useAuth();
    const { totals } = useCart();
    const { storeName, logo, isFeatureEnabled } = useConfig();
    const { wishlistCount } = useWishlist();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState(() => getCachedCategories() || []);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const hasFetchedCategories = useRef(!!getCachedCategories());
    const [scrolled, setScrolled] = useState(false);

    // Feature flags
    const wishlistEnabled = isFeatureEnabled('wishlist');
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

    // Fetch categories only if not cached
    useEffect(() => {
        if (hasFetchedCategories.current) return;

        const fetchCategories = async () => {
            try {
                const response = await categoryAPI.getCategories();
                const cats = response.data.data.categories || [];
                setCategories(cats);
                setCachedCategories(cats);
                hasFetchedCategories.current = true;
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };
        fetchCategories();
    }, []);

    // Scroll effect for glass header
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
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
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-[height] duration-300 ${scrolled ? 'h-16 md:h-20' : 'h-16 md:h-20'}`}
        >
            <div className={`absolute inset-0 -z-10 transition-all duration-300 ${scrolled ? 'glass' : 'bg-white/80 backdrop-blur-md border-b border-gray-100'}`} />
            <div className="container-custom h-full relative z-10">
                <div className="flex items-center justify-between h-full gap-4">

                    {/* Left: Logo */}
                    <Link to="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0 group z-10">
                        {logo ? (
                            <img
                                src={logo}
                                alt={storeName}
                                className="h-8 md:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-heading font-bold text-lg sm:text-xl shadow-lg shadow-primary-500/20">
                                {storeName.charAt(0)}
                            </div>
                        )}
                        <span className="text-lg sm:text-xl md:text-2xl font-heading font-bold text-gray-900 tracking-tight group-hover:text-primary-600 transition-colors">
                            {storeName}
                        </span>
                    </Link>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 z-10">

                        {/* Search Icon (Mobile & Desktop Toggle) */}
                        {searchEnabled && (
                            <button
                                onClick={() => setShowMobileSearch(!showMobileSearch)}
                                className="p-2 sm:p-2.5 rounded-full text-gray-700 hover:bg-gray-100 transition-all active:scale-95"
                            >
                                <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        )}

                        {/* Search Overlay (if needed) - Keeping it simple for now, just toggling state or showing input conditionally? 
                           If I remove the form completely, where does search happen? 
                           User said "remove that search section". 
                           But also "there is a search icon".
                           I will assume clicking it toggles a search bar OR navigates to search.
                           I'll leave the toggle logic if existing, or just the icon. 
                           I'll assume `showSearch` state exists or needs to be added? 
                           The previous code had `handleSearch` but no `showSearch` state visible in slice.
                           I'll check if I need to add state.
                        */}

                        {/* Categories (Desktop) */}
                        {!isProductsPage && categories.length > 0 && (
                            <div className="relative hidden lg:block">
                                <button
                                    onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
                                    onBlur={() => setTimeout(() => setCategoryMenuOpen(false), 200)} // Delay for click
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                >
                                    Categories
                                    <ChevronDown size={14} className={`transition-transform duration-200 ${categoryMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {categoryMenuOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-56 animate-scale-in glass rounded-2xl shadow-xl overflow-hidden py-2 border border-white/20">
                                        <Link to="/products" className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                                            All Products
                                        </Link>
                                        <div className="h-px bg-gray-100 my-1" />
                                        {categories.slice(0, 8).map(cat => (
                                            <Link
                                                key={cat._id}
                                                to={`/products?category=${cat._id}`}
                                                className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                            >
                                                {cat.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Product View Controls (Desktop) */}
                        {isProductsPage && (
                            <div className="hidden lg:flex items-center gap-3 bg-gray-100/50 p-1.5 rounded-xl border border-gray-200/50">
                                <div className="relative">
                                    <select
                                        value={currentSort}
                                        onChange={handleSortChange}
                                        className="appearance-none pl-3 pr-8 py-1.5 bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer hover:text-primary-600"
                                    >
                                        {sortOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
                                </div>
                                <div className="h-4 w-px bg-gray-300" />
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleViewChange('grid')}
                                        className={`p-1.5 rounded-lg transition-all duration-200 ${currentView === 'grid' ? 'bg-white shadow text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <Grid size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleViewChange('list')}
                                        className={`p-1.5 rounded-lg transition-all duration-200 ${currentView === 'list' ? 'bg-white shadow text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <List size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Wishlist */}
                        {wishlistEnabled && (
                            <Link
                                to="/wishlist"
                                className="relative p-2.5 rounded-full text-gray-600 hover:bg-gray-100 hover:text-red-500 transition-all hidden md:flex"
                                title="Wishlist"
                            >
                                <Heart size={22} strokeWidth={2} />
                                {wishlistCount > 0 && (
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
                                )}
                            </Link>
                        )}

                        {/* Cart Button */}
                        <Link
                            to="/cart"
                            className="relative p-2.5 rounded-full text-gray-600 hover:bg-gray-100 hover:text-primary-600 transition-all group"
                        >
                            <ShoppingCart size={22} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
                            {totals.itemCount > 0 && (
                                <span className="absolute top-1 -right-0.5 min-w-[18px] h-[18px] bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white animate-scale-in">
                                    {totals.itemCount}
                                </span>
                            )}
                        </Link>

                        {/* User Menu */}
                        {isAuthenticated ? (
                            <div className="relative ml-1">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="relative w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-primary-100 transition-all shrink-0"
                                >
                                    <div className="w-full h-full bg-gradient-to-br from-primary-100 to-indigo-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                                        {user?.profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                                    </div>
                                </button>

                                {userMenuOpen && (
                                    <>
                                        {/* Mobile Menu - Portaled to Body to avoid Z-Index/Stacking Context issues */}
                                        {createPortal(
                                            <>
                                                {/* Backdrop */}
                                                <div className="fixed inset-0 z-[100] bg-black/10 backdrop-blur-[2px] md:hidden" onClick={() => setUserMenuOpen(false)} />

                                                {/* Mobile Dropdown - Top Right Positioned */}
                                                <div className="fixed top-[4.5rem] right-4 z-[101] w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-scale-in md:hidden origin-top-right">

                                                    {/* User Info Header */}
                                                    <div className="px-5 py-4 bg-gray-50/80 border-b border-gray-100">
                                                        <p className="font-heading font-bold text-gray-900 truncate text-sm">
                                                            {user?.profile?.firstName || 'Valued Customer'}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 truncate mt-0.5 font-medium uppercase tracking-wide">
                                                            {user?.email}
                                                        </p>
                                                    </div>

                                                    {/* Menu Items */}
                                                    <div className="p-1.5 space-y-0.5">
                                                        <Link to="/account" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors" onClick={() => setUserMenuOpen(false)}>
                                                            <User size={16} className="text-gray-400" />
                                                            My Profile
                                                        </Link>
                                                        <Link to="/orders" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors" onClick={() => setUserMenuOpen(false)}>
                                                            <Package size={16} className="text-gray-400" />
                                                            My Orders
                                                        </Link>

                                                        {wishlistEnabled && (
                                                            <Link to="/wishlist" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors" onClick={() => setUserMenuOpen(false)}>
                                                                <Heart size={16} className="text-gray-400" />
                                                                Wishlist
                                                            </Link>
                                                        )}

                                                        {isAdmin && (
                                                            <Link to="/admin" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-primary-600 bg-primary-50/50 hover:bg-primary-100 transition-colors my-1" onClick={() => setUserMenuOpen(false)}>
                                                                <Settings size={16} />
                                                                Admin Dashboard
                                                            </Link>
                                                        )}

                                                        <button
                                                            onClick={() => { logout(); setUserMenuOpen(false); }}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                                        >
                                                            <LogOut size={16} />
                                                            Logout
                                                        </button>
                                                    </div>
                                                </div>
                                            </>,
                                            document.body
                                        )}

                                        {/* Desktop Menu - Kept Inline */}
                                        <div className="hidden md:block absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-2xl p-0 overflow-hidden ring-1 ring-black/5 animate-scale-in z-50">
                                            <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100">
                                                <p className="font-heading font-bold text-gray-900 truncate">
                                                    {user?.profile?.firstName || 'Valued Customer'}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                                            </div>

                                            <div className="p-2 space-y-1">
                                                <Link to="/account" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors" onClick={() => setUserMenuOpen(false)}>
                                                    <User size={18} />
                                                    My Profile
                                                </Link>
                                                <Link to="/orders" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors" onClick={() => setUserMenuOpen(false)}>
                                                    <Package size={18} />
                                                    My Orders
                                                </Link>

                                                {wishlistEnabled && (
                                                    <Link to="/wishlist" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors" onClick={() => setUserMenuOpen(false)}>
                                                        <Heart size={18} />
                                                        Wishlist
                                                    </Link>
                                                )}

                                                {isAdmin && (
                                                    <Link to="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-primary-600 bg-primary-50/50 hover:bg-primary-100 transition-colors mt-2 mb-2" onClick={() => setUserMenuOpen(false)}>
                                                        <Settings size={18} />
                                                        Admin Dashboard
                                                    </Link>
                                                )}

                                                <button
                                                    onClick={() => { logout(); setUserMenuOpen(false); }}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-1"
                                                >
                                                    <LogOut size={18} />
                                                    Logout
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="p-2.5 rounded-full text-gray-600 hover:bg-gray-100 hover:text-primary-600 transition-all shrink-0"
                                title="Login"
                            >
                                <User size={22} strokeWidth={2} />
                            </Link>
                        )}
                    </div>
                </div>

                {/* Mobile Search & Controls Panel */}
                {(showMobileSearch || isProductsPage) && (
                    <div className="md:hidden py-3 animate-slide-up border-t border-gray-100">
                        {searchEnabled && showMobileSearch && (
                            <form onSubmit={handleSearch} className="mb-3">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search products..."
                                        autoFocus
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </form>
                        )}

                        {isProductsPage && (
                            <div className="hidden"></div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;

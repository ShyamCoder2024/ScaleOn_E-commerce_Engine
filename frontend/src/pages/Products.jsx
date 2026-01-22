import { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { X, ChevronDown, ChevronLeft, ChevronRight, Filter, Search, SlidersHorizontal, ArrowUpDown, Check } from "lucide-react";
import { productAPI, categoryAPI } from '../services/api';
import ProductCard from '../components/ProductCard';

const Products = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [showFilters, setShowFilters] = useState(false);
    const [showSort, setShowSort] = useState(false);

    // Filters State
    const [filters, setFilters] = useState({
        category: searchParams.get('category') || '',
        search: searchParams.get('search') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        sort: searchParams.get('sort') || '-createdAt',
        inStock: searchParams.get('inStock') === 'true',
    });

    const [viewMode, setViewMode] = useState(searchParams.get('view') || 'grid');

    // Sync from URL
    useEffect(() => {
        const view = searchParams.get('view');
        if (view) setViewMode(view);

        setFilters(prev => ({
            ...prev,
            category: searchParams.get('category') || '',
            search: searchParams.get('search') || '',
            minPrice: searchParams.get('minPrice') || '',
            maxPrice: searchParams.get('maxPrice') || '',
            sort: searchParams.get('sort') || '-createdAt',
            inStock: searchParams.get('inStock') === 'true',
        }));
    }, [searchParams]);

    // Mobile hash listeners
    useEffect(() => {
        if (location.hash === '#filters') setShowFilters(true);
    }, [location.hash]);

    const closeMobileMenus = () => {
        setShowFilters(false);
        setShowSort(false);
        if (window.location.hash === '#filters') {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    };

    // Data Fetching
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await categoryAPI.getCategoryTree();
                setCategories(response.data.data.categories || []);
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params = {
                    page: searchParams.get('page') || 1,
                    limit: 12,
                    ...filters
                };

                const response = await productAPI.getProducts(params);
                // Ultra-safe data extraction
                const data = response?.data?.data || {};

                // Ensure products is ALWAYS an array
                const productsList = Array.isArray(data.products) ? data.products : (Array.isArray(data.items) ? data.items : []);
                setProducts(productsList);

                // Ensure pagination is valid object
                setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
            } catch (err) {
                console.error('Failed to fetch products', err);
                // Fallback to prevent crash
                setProducts([]);
                setPagination({ page: 1, pages: 1, total: 0 });
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [searchParams, filters.category, filters.sort, filters.minPrice, filters.maxPrice, filters.inStock, filters.search]); // Depend on flattened filters or searchParams

    const updateFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const applyFilters = () => {
        const params = new URLSearchParams(searchParams);
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== 'false') params.set(key, value);
            else params.delete(key);
        });
        setSearchParams(params);
        closeMobileMenus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearFilters = () => {
        setFilters({
            category: '',
            search: '',
            minPrice: '',
            maxPrice: '',
            sort: '-createdAt',
            inStock: false,
        });
        setSearchParams({});
        closeMobileMenus();
    };

    const handlePageChange = (newPage) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', newPage.toString());
        setSearchParams(params);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Category Renderer Safe-Guard
    const renderCategoryOptions = (cats, depth = 0) => {
        // Prevent infinite recursion or non-array access
        if (!Array.isArray(cats) || depth > 5) return [];

        return cats.flatMap(cat => {
            if (!cat || !cat._id) return [];
            return [
                <option key={cat._id} value={cat._id}>
                    {'— '.repeat(depth)}{cat.name}
                </option>,
                ...(cat.children ? renderCategoryOptions(cat.children, depth + 1) : [])
            ];
        });
    };

    const sortOptions = [
        { value: '-createdAt', label: 'Newest First' },
        { value: 'createdAt', label: 'Oldest First' },
        { value: 'price', label: 'Price: Low to High' },
        { value: '-price', label: 'Price: High to Low' },
        { value: 'name', label: 'Name: A-Z' },
        { value: '-salesCount', label: 'Best Selling' },
    ];

    const hasActiveFilters = filters.category || filters.minPrice || filters.maxPrice || filters.inStock || filters.search;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="container-custom py-8">

                {/* Mobile Toolbar - Sticky Top under Header */}
                <div className="lg:hidden sticky top-16 z-30 bg-white/80 backdrop-blur-md -mx-4 px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3 mb-6 transition-all duration-300 shadow-sm">
                    <button
                        onClick={() => setShowFilters(true)}
                        className="flex-1 flex items-center justify-center gap-2 h-10 bg-gray-100/80 rounded-xl text-sm font-semibold text-gray-700 active:scale-95 transition-transform"
                    >
                        <Filter size={16} /> Filters
                        {hasActiveFilters && <span className="w-2 h-2 bg-primary-500 rounded-full" />}
                    </button>
                    <div className="w-px h-6 bg-gray-300" />
                    <button
                        onClick={() => setShowSort(true)}
                        className="flex-1 flex items-center justify-center gap-2 h-10 bg-gray-100/80 rounded-xl text-sm font-semibold text-gray-700 active:scale-95 transition-transform"
                    >
                        <ArrowUpDown size={16} /> Sort
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Desktop Sidebar */}
                    <aside className="hidden lg:block w-72 shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-heading font-bold text-gray-900 text-lg">Filters</h2>
                                {hasActiveFilters && (
                                    <button onClick={clearFilters} className="text-xs font-bold text-primary-600 hover:text-primary-700 uppercase tracking-wide">
                                        Reset
                                    </button>
                                )}
                            </div>

                            {/* Categories */}
                            <div className="mb-8">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Categories</h3>
                                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                    {/* Custom styled radio/checkbox for categories could go here, relying on select for now for reliability */}
                                    <div className="relative">
                                        <select
                                            value={filters.category}
                                            onChange={(e) => { updateFilter('category', e.target.value); setTimeout(applyFilters, 0); }}
                                            className="w-full appearance-none pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all cursor-pointer"
                                        >
                                            <option value="">All Categories</option>
                                            {renderCategoryOptions(categories)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="mb-8">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Price Range</h3>
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                        <input
                                            type="number"
                                            value={filters.minPrice}
                                            onChange={(e) => updateFilter('minPrice', e.target.value)}
                                            onBlur={applyFilters}
                                            placeholder="Min"
                                            className="w-full pl-6 pr-2 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all"
                                        />
                                    </div>
                                    <span className="text-gray-300">-</span>
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                        <input
                                            type="number"
                                            value={filters.maxPrice}
                                            onChange={(e) => updateFilter('maxPrice', e.target.value)}
                                            onBlur={applyFilters}
                                            placeholder="Max"
                                            className="w-full pl-6 pr-2 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* In Stock */}
                            <div className="mb-6">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${filters.inStock ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-300 group-hover:border-primary-400'}`}>
                                        {filters.inStock && <Check size={12} className="text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={filters.inStock}
                                        onChange={(e) => { updateFilter('inStock', e.target.checked); setTimeout(applyFilters, 0); }}
                                    />
                                    <span className="text-sm font-medium text-gray-700">In Stock Only</span>
                                </label>
                            </div>

                            <button onClick={applyFilters} className="w-full btn-primary py-3 rounded-xl shadow-lg shadow-primary-500/20">
                                Apply Filters
                            </button>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Header Count & Sort (Desktop) */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <p className="text-gray-500 font-medium text-sm">
                                Found <span className="text-gray-900 font-bold">{pagination.total}</span> products
                            </p>

                            {/* Tags / Active Filters */}
                            {hasActiveFilters && (
                                <div className="flex flex-wrap gap-2">
                                    {filters.inStock && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-700">
                                            In Stock <X size={12} className="cursor-pointer" onClick={() => { updateFilter('inStock', false); setTimeout(applyFilters, 0); }} />
                                        </span>
                                    )}
                                    {/* Add more tags as needed */}
                                    <button onClick={clearFilters} className="text-xs text-primary-600 underline ml-1">Clear all</button>
                                </div>
                            )}

                            <div className="hidden sm:flex items-center gap-3">
                                <span className="text-sm text-gray-500">Sort by:</span>
                                <div className="relative">
                                    <select
                                        value={filters.sort}
                                        onChange={(e) => { updateFilter('sort', e.target.value); setTimeout(applyFilters, 0); }}
                                        className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-100 cursor-pointer"
                                    >
                                        {sortOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                </div>
                            </div>
                        </div>

                        {/* Grid */}
                        {loading ? (
                            <div className={`grid gap-3 sm:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                                {[...Array(8)].map((_, idx) => (
                                    <div key={idx} className="bg-white rounded-2xl h-[350px] animate-pulse bg-gray-100" />
                                ))}
                            </div>
                        ) : Array.isArray(products) && products.length > 0 ? (
                            <>
                                <div className={`grid gap-3 sm:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                                    {products
                                        .filter(p => p && p._id) // Strict Filtering
                                        .map(product => (
                                            <ProductCard
                                                key={product._id}
                                                product={product}
                                                viewMode={viewMode}
                                            />
                                        ))}
                                </div>

                                {/* Pagination */}
                                {pagination.pages > 1 && (
                                    <div className="mt-12 flex justify-center">
                                        <div className="flex items-center gap-2 p-1 bg-white border border-gray-100 rounded-xl shadow-sm">
                                            <button
                                                onClick={() => handlePageChange(pagination.page - 1)}
                                                disabled={pagination.page === 1}
                                                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent text-gray-600"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                            <div className="px-4 font-bold text-gray-900">
                                                Page {pagination.page} of {pagination.pages}
                                            </div>
                                            <button
                                                onClick={() => handlePageChange(pagination.page + 1)}
                                                disabled={pagination.page === pagination.pages}
                                                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent text-gray-600"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="col-span-full py-20 text-center">
                                <div className="bg-white rounded-3xl p-8 sm:p-12 border border-dashed border-gray-200 shadow-sm max-w-lg mx-auto">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                                        <Search size={32} />
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">No products found</h3>
                                    <p className="text-gray-500 mb-8 mx-auto leading-relaxed">
                                        We couldn't find any products matching your filters. <br className="hidden sm:block" />
                                        Try adjusting your search or category.
                                    </p>
                                    <button
                                        onClick={clearFilters}
                                        className="btn-primary py-3 px-8 rounded-xl shadow-lg shadow-primary-500/20 hover:-translate-y-0.5 transition-all"
                                    >
                                        Clear Valid Filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Sheet */}
            {showFilters && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm animate-fade-in" onClick={closeMobileMenus} />
                    <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-slide-up max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                            <button onClick={closeMobileMenus} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-8">
                            {/* Category */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Category</h3>
                                <div className="relative">
                                    <select
                                        value={filters.category}
                                        onChange={(e) => updateFilter('category', e.target.value)}
                                        className="w-full appearance-none pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium"
                                    >
                                        <option value="">All Categories</option>
                                        {renderCategoryOptions(categories)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                </div>
                            </div>

                            {/* Price */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Price Range</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                        <input
                                            type="number"
                                            value={filters.minPrice}
                                            onChange={(e) => updateFilter('minPrice', e.target.value)}
                                            placeholder="Min"
                                            className="w-full pl-6 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                        />
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                        <input
                                            type="number"
                                            value={filters.maxPrice}
                                            onChange={(e) => updateFilter('maxPrice', e.target.value)}
                                            placeholder="Max"
                                            className="w-full pl-6 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* In Stock */}
                            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <span className="font-medium text-gray-900">In Stock Only</span>
                                <input
                                    type="checkbox"
                                    checked={filters.inStock}
                                    onChange={(e) => updateFilter('inStock', e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                            </label>
                        </div>

                        <div className="p-5 border-t border-gray-100 bg-white pb-safe">
                            <div className="flex gap-3">
                                {hasActiveFilters && (
                                    <button onClick={clearFilters} className="px-6 py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100">
                                        Reset
                                    </button>
                                )}
                                <button onClick={applyFilters} className="flex-1 btn-primary py-3.5 rounded-xl font-bold shadow-lg">
                                    Show Results
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Mobile Sort Sheet */}
            {showSort && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm animate-fade-in" onClick={closeMobileMenus} />
                    <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-slide-up pb-safe">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">Sort By</h2>
                            <button onClick={closeMobileMenus} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-2 max-h-[60vh] overflow-y-auto">
                            {sortOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => { updateFilter('sort', opt.value); setTimeout(applyFilters, 50); }}
                                    className={`w-full flex items-center justify-between p-4 text-left ${filters.sort === opt.value ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {opt.label}
                                    {filters.sort === opt.value && <Check size={18} />}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

        </div>
    );
};

export default Products;

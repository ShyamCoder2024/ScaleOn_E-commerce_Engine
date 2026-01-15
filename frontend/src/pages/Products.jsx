import { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Filter, X, ChevronDown, Search, Grid, List } from 'lucide-react';
import { productAPI, categoryAPI } from '../services/api';
import { useConfig } from '../context/ConfigContext';
import ProductCard from '../components/ProductCard';

const Products = () => {
    const { formatPrice } = useConfig();
    const [searchParams, setSearchParams] = useSearchParams();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [showFilters, setShowFilters] = useState(false);

    // Filters State
    const [filters, setFilters] = useState({
        category: searchParams.get('category') || '',
        search: searchParams.get('search') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        sort: searchParams.get('sort') || '-createdAt',
        inStock: searchParams.get('inStock') === 'true',
    });
    // View Mode from URL
    const [viewMode, setViewMode] = useState(searchParams.get('view') || 'grid');

    // Sync view mode when URL changes
    useEffect(() => {
        const view = searchParams.get('view');
        if (view) setViewMode(view);
    }, [searchParams]);

    // Listen for hash changes to open mobile filters
    const location = useLocation();
    useEffect(() => {
        if (location.hash === '#filters') {
            setShowFilters(true);
        }
    }, [location.hash]);

    const closeFilters = () => {
        setShowFilters(false);
        // Remove hash without reloading
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
    };

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
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [searchParams]);

    const fetchCategories = async () => {
        try {
            const response = await categoryAPI.getCategoryTree();
            setCategories(response.data.data.categories || []);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = {
                page: searchParams.get('page') || 1,
                limit: 12,
                sort: searchParams.get('sort') || '-createdAt',
            };

            if (searchParams.get('category')) params.category = searchParams.get('category');
            if (searchParams.get('search')) params.search = searchParams.get('search');
            if (searchParams.get('minPrice')) params.minPrice = searchParams.get('minPrice');
            if (searchParams.get('maxPrice')) params.maxPrice = searchParams.get('maxPrice');
            if (searchParams.get('inStock')) params.inStock = searchParams.get('inStock');

            const response = await productAPI.getProducts(params);
            const data = response.data.data;

            setProducts(data.products || data.items || []);
            setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
        } catch (err) {
            console.error('Failed to fetch products:', err);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const updateFilters = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
    };

    const applyFilters = () => {
        const params = new URLSearchParams(searchParams);

        if (filters.category) params.set('category', filters.category);
        if (filters.search) params.set('search', filters.search);
        if (filters.minPrice) params.set('minPrice', filters.minPrice);
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);

        // Note: Sort is handled by header now, but we keep it here for safety
        if (filters.inStock) params.set('inStock', 'true');

        setSearchParams(params);
        closeFilters();
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
    };

    const hasActiveFilters = filters.category || filters.search || filters.minPrice || filters.maxPrice || filters.inStock;

    const handlePageChange = (newPage) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', newPage.toString());
        setSearchParams(params);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Recursive category renderer
    const renderCategoryOption = (cat, depth = 0) => (
        <option key={cat._id} value={cat._id}>
            {'— '.repeat(depth)}{cat.name}
        </option>
    );

    const renderCategoryOptions = (cats, depth = 0) => {
        return cats.flatMap(cat => [
            renderCategoryOption(cat, depth),
            ...(cat.children ? renderCategoryOptions(cat.children, depth + 1) : [])
        ]);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Removed - merged into Global Header */}

            <div className="container-custom py-8">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Filters Sidebar */}
                    <aside className={`
            fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:shadow-none lg:w-72 lg:shrink-0 lg:z-10
            ${showFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
                        <div className="h-full overflow-y-auto lg:overflow-visible lg:h-auto p-6 lg:p-0">
                            {/* Mobile Header */}
                            <div className="flex items-center justify-between mb-8 lg:hidden">
                                <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                                <button onClick={() => setShowFilters(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Desktop Filter Card */}
                            <div className="lg:bg-white lg:rounded-2xl lg:shadow-sm lg:border lg:border-gray-100 lg:p-6 lg:sticky lg:top-32">
                                <div className="hidden lg:flex items-center justify-between mb-6">
                                    <h2 className="font-bold text-gray-900">Filters</h2>
                                    {hasActiveFilters && (
                                        <button
                                            onClick={clearFilters}
                                            className="text-xs font-medium text-red-500 hover:text-red-600"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>

                                {/* Category Filter */}
                                <div className="mb-8">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Category</h3>
                                    <div className="relative">
                                        <select
                                            value={filters.category}
                                            onChange={(e) => updateFilters('category', e.target.value)}
                                            className="w-full appearance-none px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all cursor-pointer"
                                        >
                                            <option value="">All Categories</option>
                                            {renderCategoryOptions(categories)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                </div>

                                {/* Price Range */}
                                <div className="mb-8">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Price Range</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                            <input
                                                type="number"
                                                value={filters.minPrice}
                                                onChange={(e) => updateFilters('minPrice', e.target.value)}
                                                placeholder="Min"
                                                className="w-full pl-6 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                                            />
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                            <input
                                                type="number"
                                                value={filters.maxPrice}
                                                onChange={(e) => updateFilters('maxPrice', e.target.value)}
                                                placeholder="Max"
                                                className="w-full pl-6 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* In Stock */}
                                <div className="mb-8">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={filters.inStock}
                                                onChange={(e) => updateFilters('inStock', e.target.checked)}
                                                className="peer w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-all cursor-pointer"
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">In Stock Only</span>
                                    </label>
                                </div>

                                {/* Mobile Sort */}
                                <div className="mb-8 lg:hidden">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Sort By</h3>
                                    <div className="relative">
                                        <select
                                            value={filters.sort}
                                            onChange={(e) => updateFilters('sort', e.target.value)}
                                            className="w-full appearance-none px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all cursor-pointer"
                                        >
                                            {sortOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                </div>

                                {/* Mobile Actions */}
                                <div className="flex lg:hidden gap-3">
                                    <button onClick={applyFilters} className="btn-primary flex-1 py-3 rounded-xl">
                                        Show Results
                                    </button>
                                    {hasActiveFilters && (
                                        <button onClick={clearFilters} className="btn-secondary py-3 rounded-xl px-4">
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Backdrop */}
                    {showFilters && (
                        <div
                            className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                            onClick={() => setShowFilters(false)}
                        />
                    )}

                    {/* Products Grid */}
                    <div className="flex-1">
                        {/* Results Count */}
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-gray-600">
                                {loading ? 'Loading...' : `${pagination.total} products found`}
                            </p>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                                >
                                    <X size={14} />
                                    Clear all filters
                                </button>
                            )}
                        </div>

                        {/* Loading State */}
                        {loading ? (
                            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
                                {[...Array(8)].map((_, idx) => (
                                    <div key={idx} className="card p-4">
                                        <div className="skeleton aspect-square mb-4" />
                                        <div className="skeleton h-4 w-3/4 mb-2" />
                                        <div className="skeleton h-4 w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : products.length > 0 ? (
                            <>
                                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
                                    {products.map(product => (
                                        <ProductCard
                                            key={product._id}
                                            product={product}
                                            viewMode={viewMode}
                                        />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {pagination.pages > 1 && (
                                    <div className="mt-8 flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => handlePageChange(pagination.page - 1)}
                                            disabled={pagination.page === 1}
                                            className="btn-secondary px-4 py-2 disabled:opacity-50"
                                        >
                                            Previous
                                        </button>

                                        <div className="flex items-center gap-1">
                                            {[...Array(pagination.pages)].map((_, idx) => {
                                                const page = idx + 1;
                                                if (
                                                    page === 1 ||
                                                    page === pagination.pages ||
                                                    (page >= pagination.page - 1 && page <= pagination.page + 1)
                                                ) {
                                                    return (
                                                        <button
                                                            key={page}
                                                            onClick={() => handlePageChange(page)}
                                                            className={`w-10 h-10 rounded-lg font-medium ${page === pagination.page
                                                                ? 'bg-primary-600 text-white'
                                                                : 'hover:bg-gray-100'
                                                                }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    );
                                                }
                                                if (
                                                    page === pagination.page - 2 ||
                                                    page === pagination.page + 2
                                                ) {
                                                    return <span key={page} className="px-2">...</span>;
                                                }
                                                return null;
                                            })}
                                        </div>

                                        <button
                                            onClick={() => handlePageChange(pagination.page + 1)}
                                            disabled={pagination.page === pagination.pages}
                                            className="btn-secondary px-4 py-2 disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-16">
                                <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <Search className="text-gray-400" size={40} />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                                <p className="text-gray-500 mb-4">Try adjusting your filters or search terms</p>
                                <button onClick={clearFilters} className="btn-primary">
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Products;

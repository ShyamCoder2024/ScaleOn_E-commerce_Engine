import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    Plus, Search, Filter, Edit2, Trash2,
    MoreVertical, Package, Eye, ChevronLeft, ChevronRight,
    Image as ImageIcon, Archive, ExternalLink
} from 'lucide-react';
import { productAPI, categoryAPI, adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ProductList = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [showDeleteModal, setShowDeleteModal] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Filters from URL
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page')) || 1;

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [searchParams]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getProducts({
                search,
                category,
                status,
                page,
                limit: 10
            });
            setProducts(response.data.data.products || []);
            setPagination(response.data.data.pagination || { page: 1, pages: 1, total: 0 });
        } catch (err) {
            console.error('Failed to fetch products:', err);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await categoryAPI.getCategoryTree();
            setCategories(response.data.data.categories || []);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
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

    const handleDelete = async (productId) => {
        setDeleting(true);
        try {
            await productAPI.delete(productId);
            toast.success('Product deleted');
            setShowDeleteModal(null);
            fetchProducts();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete product');
        } finally {
            setDeleting(false);
        }
    };

    const handlePageChange = (newPage) => {
        setSearchParams(prev => {
            prev.set('page', newPage.toString());
            return prev;
        });
        window.scrollTo(0, 0);
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Products</h1>
                    <p className="text-slate-500 mt-1">{pagination.total} products total</p>
                </div>
                <Link
                    to="/admin/products/new"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 text-sm font-bold active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Add Product
                </Link>
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
                                placeholder="Search products..."
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                            />
                        </div>
                    </form>

                    {/* Category Filter */}
                    <select
                        value={category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px] bg-slate-50 outline-none text-slate-700 font-medium"
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        value={status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px] bg-slate-50 outline-none text-slate-700 font-medium"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>

            {/* Products List */}
            <div>
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No products found</h3>
                        <p className="text-slate-500 mt-1 mb-6">Start by adding your first product to the store.</p>
                        <Link
                            to="/admin/products/new"
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Add Product
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Mobile: Floating Cards View */}
                        <div className="lg:hidden space-y-4">
                            {products.map(product => (
                                <div key={product._id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-blue-100 group">
                                    <div className="flex gap-4">
                                        {/* Image */}
                                        <div className="shrink-0">
                                            {product.images?.[0]?.url ? (
                                                <img
                                                    src={product.images[0].url}
                                                    alt={product.name}
                                                    className="w-20 h-20 rounded-xl object-cover bg-slate-100 shadow-inner"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                                    <ImageIcon className="w-8 h-8 text-slate-300" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div className="min-w-0 pr-2">
                                                    <h3 className="font-bold text-slate-900 truncate text-base mb-0.5">{product.name}</h3>
                                                    <p className="text-xs text-slate-500 font-mono">{product.sku}</p>
                                                </div>
                                                <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${product.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                                    product.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {product.status}
                                                </span>
                                            </div>

                                            <div className="flex items-end justify-between mt-3">
                                                <div>
                                                    <div className="font-bold text-slate-900 text-lg">
                                                        ₹{(product.price / 100).toLocaleString('en-IN')}
                                                    </div>
                                                    <div className={`text-xs font-semibold mt-0.5 ${product.inventory <= 0 ? 'text-rose-600' :
                                                        product.inventory <= 10 ? 'text-amber-600' : 'text-emerald-600'
                                                        }`}>
                                                        {product.inventory} in stock
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile Actions */}
                                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-50">
                                        <Link
                                            to={`/admin/products/${product._id}/edit`}
                                            className="flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors"
                                        >
                                            <Edit2 size={16} /> Edit
                                        </Link>
                                        <Link
                                            to={`/products/${product.slug}`}
                                            className="flex items-center justify-center gap-2 py-2.5 bg-slate-50 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
                                        >
                                            <Eye size={16} /> View
                                        </Link>
                                        <button
                                            onClick={() => setShowDeleteModal(product)}
                                            className="flex items-center justify-center gap-2 py-2.5 bg-rose-50 text-rose-600 rounded-lg text-sm font-medium hover:bg-rose-100 transition-colors"
                                        >
                                            <Trash2 size={16} /> Del
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop: Table View */}
                        <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Product</th>
                                        <th className="px-6 py-4">SKU</th>
                                        <th className="px-6 py-4">Price</th>
                                        <th className="px-6 py-4">Stock</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {products.map(product => (
                                        <tr key={product._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-lg bg-slate-100 shrink-0 overflow-hidden border border-slate-100">
                                                        {product.images?.[0]?.url ? (
                                                            <img
                                                                src={product.images[0].url}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                <ImageIcon size={20} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 max-w-[240px]">
                                                        <p className="font-semibold text-slate-900 truncate">{product.name}</p>
                                                        <p className="text-xs text-slate-500 truncate">
                                                            {product.categories?.[0]?.name || 'Uncategorized'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{product.sku}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <span className="font-bold text-slate-900">
                                                        ₹{(product.price / 100).toFixed(2)}
                                                    </span>
                                                    {product.compareAtPrice > product.price && (
                                                        <p className="text-xs text-slate-400 line-through">
                                                            ₹{(product.compareAtPrice / 100).toFixed(2)}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-semibold text-sm ${product.inventory <= 0 ? 'text-rose-600' :
                                                    product.inventory <= 10 ? 'text-amber-600' : 'text-emerald-600'
                                                    }`}>
                                                    {product.inventory}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wide rounded-full border ${product.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    product.status === 'draft' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        'bg-slate-50 text-slate-600 border-slate-100'
                                                    }`}>
                                                    {product.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        to={`/products/${product.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View on Store"
                                                    >
                                                        <ExternalLink size={18} />
                                                    </Link>
                                                    <Link
                                                        to={`/admin/products/${product._id}/edit`}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={18} />
                                                    </Link>
                                                    <button
                                                        onClick={() => setShowDeleteModal(product)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
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

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl scale-100">
                        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4 text-rose-600">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Delete Product?</h3>
                        <p className="text-slate-500 mt-2 mb-6">
                            Are you sure you want to delete <span className="font-semibold text-slate-900">"{showDeleteModal.name}"</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(null)}
                                disabled={deleting}
                                className="flex-1 py-2.5 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(showDeleteModal._id)}
                                disabled={deleting}
                                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-500/20 transition-colors"
                            >
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductList;

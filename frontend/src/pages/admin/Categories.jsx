import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FolderTree, Plus, Edit2, Trash2, Search, ChevronRight, ChevronDown,
    Package, Eye, EyeOff, AlertCircle
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Categories = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedIds, setExpandedIds] = useState(new Set());

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getAllCategories();
            setCategories(response.data.data.categories || []);
            // Auto-expand root categories
            const rootIds = (response.data.data.categories || []).map(cat => cat._id);
            setExpandedIds(new Set(rootIds));
        } catch (err) {
            console.error('Failed to fetch categories:', err);
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (category) => {
        if (category.children && category.children.length > 0) {
            toast.error('Cannot delete category with subcategories. Delete subcategories first.');
            return;
        }

        if (!confirm(`Are you sure you want to delete "${category.name}"? This will archive the category.`)) {
            return;
        }

        try {
            await adminAPI.deleteCategory(category._id);
            toast.success('Category archived successfully');
            fetchCategories();
        } catch (err) {
            console.error('Delete error:', err);
            const message = err.response?.data?.message || 'Failed to delete category';
            toast.error(message);
        }
    };

    const toggleExpand = (id) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const filterCategories = (cats, term) => {
        if (!term) return cats;

        return cats.filter(cat => {
            const matchesName = cat.name.toLowerCase().includes(term.toLowerCase());
            const matchesChildren = cat.children && cat.children.length > 0 &&
                filterCategories(cat.children, term).length > 0;
            return matchesName || matchesChildren;
        }).map(cat => ({
            ...cat,
            children: cat.children ? filterCategories(cat.children, term) : []
        }));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-emerald-100 text-emerald-700';
            case 'draft': return 'bg-amber-100 text-amber-700';
            case 'archived': return 'bg-slate-100 text-slate-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const renderCategory = (category, depth = 0) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedIds.has(category._id);

        return (
            <div key={category._id} className="animate-in fade-in slide-in-from-left-2">
                {/* Category Row */}
                <div
                    className={`group flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 ${depth > 0 ? 'bg-slate-50/50' : 'bg-white'
                        }`}
                    style={{ paddingLeft: `${depth * 2 + 1}rem` }}
                >
                    {/* Expand/Collapse */}
                    {hasChildren ? (
                        <button
                            onClick={() => toggleExpand(category._id)}
                            className="p-1 hover:bg-slate-200 rounded transition-colors"
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-600" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-slate-600" />
                            )}
                        </button>
                    ) : (
                        <div className="w-6" />
                    )}

                    {/* Icon */}
                    <FolderTree className={`w-5 h-5 ${depth === 0 ? 'text-blue-500' : 'text-slate-400'}`} />

                    {/* Name & Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-semibold text-slate-900">{category.name}</h3>
                            <span className={`hidden sm:inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(category.status)}`}>
                                {category.status}
                            </span>
                            {category.productCount > 0 && (
                                <span className="hidden md:inline-flex items-center gap-1 text-xs text-slate-500">
                                    <Package className="w-3 h-3" />
                                    {category.productCount} products
                                </span>
                            )}
                        </div>
                        {category.slug && (
                            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">/{category.slug}</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => navigate(`/admin/categories/${category._id}/edit`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleDelete(category)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Children */}
                {hasChildren && isExpanded && (
                    <div>
                        {category.children.map(child => renderCategory(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    const filteredCategories = filterCategories(categories, searchTerm);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 py-4 sm:py-6 mb-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-xl">
                                <FolderTree className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Categories</h1>
                                <p className="text-sm text-slate-500 hidden sm:block">
                                    Organize your products into categories
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/admin/categories/new')}
                            className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 font-semibold transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">New Category</span>
                            <span className="sm:hidden">New</span>
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search categories..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4">
                {filteredCategories.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FolderTree className="w-8 h-8 text-blue-600" />
                        </div>
                        {searchTerm ? (
                            <>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">No categories found</h3>
                                <p className="text-slate-500 mb-6">Try a different search term</p>
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">No categories yet</h3>
                                <p className="text-slate-500 mb-6">
                                    Create your first category to organize your products
                                </p>
                                <button
                                    onClick={() => navigate('/admin/categories/new')}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 font-semibold transition-all"
                                >
                                    <Plus className="w-5 h-5" />
                                    Create Category
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {filteredCategories.map(category => renderCategory(category))}
                        </div>
                    </div>
                )}

                {/* Info Card */}
                {!searchTerm && categories.length > 0 && (
                    <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900">
                            <p className="font-medium mb-1">Category Organization</p>
                            <p className="text-blue-700">
                                Categories support up to 3 levels of nesting. Deleting a parent category requires removing all subcategories first.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Categories;

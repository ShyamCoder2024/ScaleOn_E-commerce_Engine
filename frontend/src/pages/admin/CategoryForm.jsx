import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Save, ArrowLeft, Tag, FileText, Image as ImageIcon, FolderTree,
    AlertCircle, Search as SearchIcon
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import ImageUpload from '../../components/ImageUpload';
import toast from 'react-hot-toast';

const CategoryForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        parent: '',
        order: '0',
        status: 'active',
        image: '',
        metaTitle: '',
        metaDescription: ''
    });

    useEffect(() => {
        fetchCategories();
        if (isEditing) {
            fetchCategory();
        }
    }, [id]);

    const fetchCategories = async () => {
        try {
            const response = await adminAPI.getAllCategories();
            setCategories(response.data.data.categories || []);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const fetchCategory = async () => {
        try {
            const response = await adminAPI.getAllCategories();
            const allCategories = flattenCategories(response.data.data.categories || []);
            const category = allCategories.find(cat => cat._id === id);

            if (!category) {
                toast.error('Category not found');
                navigate('/admin/categories');
                return;
            }

            setFormData({
                name: category.name || '',
                slug: category.slug || '',
                description: category.description || '',
                parent: category.parent || '',
                order: category.order?.toString() || '0',
                status: category.status || 'active',
                image: category.image || '',
                metaTitle: category.metaTitle || '',
                metaDescription: category.metaDescription || ''
            });
        } catch (err) {
            console.error('Failed to fetch category:', err);
            toast.error('Failed to load category');
            navigate('/admin/categories');
        } finally {
            setLoading(false);
        }
    };

    const flattenCategories = (cats, result = []) => {
        cats.forEach(cat => {
            result.push(cat);
            if (cat.children && cat.children.length > 0) {
                flattenCategories(cat.children, result);
            }
        });
        return result;
    };

    const getDepth = (categoryId, cats, depth = 0) => {
        const allCats = flattenCategories(cats);
        const cat = allCats.find(c => c._id === categoryId);
        if (!cat || !cat.parent) return depth;
        return getDepth(cat.parent, cats, depth + 1);
    };

    const getAvailableParents = () => {
        const allCats = flattenCategories(categories);

        // Exclude current category and its descendants when editing
        if (isEditing) {
            const getDescendants = (catId) => {
                const descendants = [catId];
                const children = allCats.filter(c => c.parent === catId);
                children.forEach(child => {
                    descendants.push(...getDescendants(child._id));
                });
                return descendants;
            };

            const excluded = getDescendants(id);
            return allCats.filter(cat =>
                !excluded.includes(cat._id) && getDepth(cat._id, categories) < 2
            );
        }

        // Only show categories that are less than depth 2 (so new category can be depth 3)
        return allCats.filter(cat => getDepth(cat._id, categories) < 2);
    };

    const renderCategoryOptions = (cats, depth = 0) => {
        return cats.flatMap(cat => {
            const availableParents = getAvailableParents();
            if (!availableParents.find(p => p._id === cat._id)) {
                return [];
            }

            const option = (
                <option key={cat._id} value={cat._id}>
                    {'\u00A0'.repeat(depth * 4)}{cat.name}
                </option>
            );

            const childOptions = cat.children && cat.children.length > 0
                ? renderCategoryOptions(cat.children, depth + 1)
                : [];

            return [option, ...childOptions];
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (url) => {
        setFormData(prev => ({ ...prev, image: url }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Category name is required');
            return;
        }

        // Check nesting level if parent is selected
        if (formData.parent) {
            const parentDepth = getDepth(formData.parent, categories);
            if (parentDepth >= 2) {
                toast.error('Categories cannot be nested more than 3 levels deep');
                return;
            }
        }

        setSaving(true);
        try {
            const data = {
                name: formData.name.trim(),
                slug: formData.slug.trim() || undefined,
                description: formData.description.trim(),
                parent: formData.parent || null,
                order: parseInt(formData.order) || 0,
                status: formData.status,
                image: formData.image || undefined,
                metaTitle: formData.metaTitle.trim(),
                metaDescription: formData.metaDescription.trim()
            };

            if (isEditing) {
                await adminAPI.updateCategory(id, data);
                toast.success('Category updated successfully');
            } else {
                await adminAPI.createCategory(data);
                toast.success('Category created successfully');
            }

            navigate('/admin/categories');
        } catch (err) {
            console.error('Save error:', err);
            const message = err.response?.data?.message || 'Failed to save category';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const inputClass = "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium text-slate-700";
    const labelClass = "block text-sm font-semibold text-slate-700 mb-1.5 ml-1";

    return (
        <form onSubmit={handleSubmit} className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 py-3 sm:py-4 mb-6">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/categories')}
                            className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                                {isEditing ? 'Edit Category' : 'New Category'}
                            </h1>
                            {isEditing && formData.name && (
                                <p className="text-xs text-slate-500 hidden sm:block">
                                    Editing: {formData.name}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/categories')}
                            className="hidden sm:block px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 font-semibold transition-all active:scale-95 text-sm"
                        >
                            <Save className="w-4 h-4" />
                            <span>{saving ? 'Saving...' : 'Save'}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 space-y-6">
                {/* Basic Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-50">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Tag className="w-5 h-5 text-blue-500" />
                            Basic Information
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className={labelClass}>
                                Category Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`${inputClass} text-lg`}
                                placeholder="e.g. Electronics, Clothing, Accessories"
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                Slug
                                <span className="text-xs font-normal text-slate-400 ml-2">(Auto-generated if empty)</span>
                            </label>
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                className={`${inputClass} bg-slate-50`}
                                placeholder="electronics"
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className={inputClass}
                                placeholder="Brief description of this category..."
                            />
                        </div>
                    </div>
                </div>

                {/* Organization */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-50">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <FolderTree className="w-5 h-5 text-purple-500" />
                            Organization
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className={labelClass}>Parent Category</label>
                            <select
                                name="parent"
                                value={formData.parent}
                                onChange={handleChange}
                                className={inputClass}
                            >
                                <option value="">None (Root Category)</option>
                                {renderCategoryOptions(categories)}
                            </select>
                            <p className="text-xs text-slate-500 mt-2 ml-1">
                                Categories support up to 3 levels of nesting
                            </p>
                        </div>

                        <div>
                            <label className={labelClass}>Display Order</label>
                            <input
                                type="number"
                                name="order"
                                value={formData.order}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="0"
                                min="0"
                            />
                            <p className="text-xs text-slate-500 mt-2 ml-1">
                                Lower numbers appear first
                            </p>
                        </div>

                        <div>
                            <label className={labelClass}>Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className={inputClass}
                            >
                                <option value="draft">Draft (Hidden)</option>
                                <option value="active">Active (Visible)</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Media */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-50">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-emerald-500" />
                            Category Image
                        </h2>
                    </div>
                    <div className="p-6">
                        {formData.image && (
                            <div className="mb-4 relative rounded-xl overflow-hidden border border-slate-200 bg-white">
                                <img
                                    src={formData.image}
                                    alt="Category preview"
                                    className="w-full h-48 object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleImageChange('')}
                                    className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-full hover:bg-rose-600 shadow-lg transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4 rotate-180" />
                                </button>
                            </div>
                        )}
                        <ImageUpload
                            value={formData.image}
                            onChange={handleImageChange}
                            folder="categories"
                            label=""
                        />
                    </div>
                </div>

                {/* SEO */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-50">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <SearchIcon className="w-5 h-5 text-amber-500" />
                            SEO Settings
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className={labelClass}>
                                Meta Title
                                <span className="text-xs font-normal text-slate-400 ml-2">(Max 70 characters)</span>
                            </label>
                            <input
                                type="text"
                                name="metaTitle"
                                value={formData.metaTitle}
                                onChange={handleChange}
                                maxLength={70}
                                className={inputClass}
                                placeholder="Category meta title for SEO"
                            />
                            <p className="text-xs text-slate-500 mt-1 ml-1">
                                {formData.metaTitle.length}/70 characters
                            </p>
                        </div>

                        <div>
                            <label className={labelClass}>
                                Meta Description
                                <span className="text-xs font-normal text-slate-400 ml-2">(Max 160 characters)</span>
                            </label>
                            <textarea
                                name="metaDescription"
                                value={formData.metaDescription}
                                onChange={handleChange}
                                maxLength={160}
                                rows={3}
                                className={inputClass}
                                placeholder="Category meta description for SEO"
                            />
                            <p className="text-xs text-slate-500 mt-1 ml-1">
                                {formData.metaDescription.length}/160 characters
                            </p>
                        </div>
                    </div>
                </div>

                {/* Warning */}
                {formData.parent && getDepth(formData.parent, categories) >= 2 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-900">
                            <p className="font-semibold mb-1">Maximum Depth Reached</p>
                            <p className="text-amber-700">
                                The selected parent category is already at maximum depth. You cannot create subcategories under it.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </form>
    );
};

export default CategoryForm;

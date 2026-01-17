import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Save, ArrowLeft, Upload, X, Plus, Trash2, Image as ImageIcon,
    ChevronDown, ChevronUp, AlertCircle, Info, Tag, Box, DollarSign,
    Layers, Truck
} from 'lucide-react';
import { productAPI, categoryAPI } from '../../services/api';
import { useConfig } from '../../context/ConfigContext';
import ImageUpload from '../../components/ImageUpload';
import toast from 'react-hot-toast';

const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const { isFeatureEnabled } = useConfig();
    const variantsEnabled = isFeatureEnabled('variants');
    const multiImagesEnabled = isFeatureEnabled('multiImages');

    // Accordion states for mobile sections if needed, or just keep them open
    const [openSections, setOpenSections] = useState({
        basic: true,
        media: true,
        pricing: true,
        inventory: true,
        shipping: true,
        seo: true,
        variants: true
    });

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        sku: '',
        description: '',
        shortDescription: '',
        price: '',
        compareAtPrice: '',
        cost: '',
        category: '',
        status: 'draft',
        inventory: '0',
        trackInventory: true,
        lowStockThreshold: '5',
        weight: '',
        images: [],
        hasVariants: false,
        variants: [],
        seo: {
            metaTitle: '',
            metaDescription: ''
        }
    });

    useEffect(() => {
        fetchCategories();
        if (isEditing) {
            fetchProduct();
        }
    }, [id]);

    const fetchCategories = async () => {
        try {
            const response = await categoryAPI.getCategoryTree();
            setCategories(response.data.data.categories || []);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const fetchProduct = async () => {
        try {
            const response = await productAPI.getById(id);
            const product = response.data.data.product;
            setFormData({
                name: product.name || '',
                slug: product.slug || '',
                sku: product.sku || '',
                description: product.description || '',
                shortDescription: product.shortDescription || '',
                price: product.price ? (product.price / 100).toString() : '',
                compareAtPrice: product.compareAtPrice ? (product.compareAtPrice / 100).toString() : '',
                cost: product.cost ? (product.cost / 100).toString() : '',
                category: product.categories?.[0]?._id || product.categories?.[0] || '',
                status: product.status || 'draft',
                inventory: product.inventory?.toString() || '0',
                trackInventory: product.trackInventory ?? true,
                lowStockThreshold: product.lowStockThreshold?.toString() || '5',
                weight: product.weight?.toString() || '',
                images: product.images || [],
                hasVariants: product.hasVariants || false,
                variants: product.variants || [],
                seo: {
                    metaTitle: product.seo?.metaTitle || '',
                    metaDescription: product.seo?.metaDescription || ''
                }
            });
        } catch (err) {
            console.error('Failed to fetch product:', err);
            toast.error('Failed to load product');
            navigate('/admin/products');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.startsWith('seo.')) {
            const seoField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                seo: { ...prev.seo, [seoField]: value }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleImageAdd = (url) => {
        if (url) {
            if (multiImagesEnabled) {
                setFormData(prev => ({
                    ...prev,
                    images: [...prev.images, { url, alt: '', isPrimary: prev.images.length === 0 }]
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    images: [{ url, alt: '', isPrimary: true }]
                }));
            }
        }
    };

    const handleImageRemove = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Product name is required');
            return;
        }
        if (!formData.price || parseFloat(formData.price) <= 0) {
            toast.error('Valid price is required');
            return;
        }

        setSaving(true);
        try {
            const data = {
                name: formData.name.trim(),
                slug: formData.slug.trim() || undefined,
                sku: formData.sku.trim() || undefined,
                description: formData.description.trim(),
                shortDescription: formData.shortDescription.trim(),
                price: Math.round(parseFloat(formData.price) * 100),
                compareAtPrice: formData.compareAtPrice ? Math.round(parseFloat(formData.compareAtPrice) * 100) : undefined,
                cost: formData.cost ? Math.round(parseFloat(formData.cost) * 100) : undefined,
                categories: formData.category ? [formData.category] : [],
                status: formData.status,
                inventory: parseInt(formData.inventory) || 0,
                trackInventory: formData.trackInventory,
                lowStockThreshold: parseInt(formData.lowStockThreshold) || 5,
                weight: formData.weight ? parseFloat(formData.weight) : undefined,
                images: formData.images.map(img => ({
                    url: img.url,
                    alt: img.alt || '',
                    isPrimary: img.isPrimary || false,
                    order: img.order || 0
                })),
                seo: formData.seo,
                hasVariants: formData.hasVariants,
                variants: formData.hasVariants ? formData.variants.map(v => ({
                    sku: v.sku || '',
                    name: v.name || '',
                    price: v.price || null,
                    inventory: v.inventory || 0,
                    options: v.options || {}
                })) : []
            };

            if (isEditing) {
                await productAPI.update(id, data);
                toast.success('Product updated');
            } else {
                await productAPI.create(data);
                toast.success('Product created');
            }

            navigate('/admin/products');
        } catch (err) {
            console.error('Product save error:', err.response?.data || err);
            const errorMessage = err.response?.data?.message || 'Failed to save product';
            toast.error(errorMessage);
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

    // Helper for input classes to reusable variable
    const inputClass = "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium text-slate-700";
    const labelClass = "block text-sm font-semibold text-slate-700 mb-1.5 ml-1";

    return (
        <form onSubmit={handleSubmit} className="min-h-screen bg-slate-50/50 pb-20">
            {/* Sticky Header */}
            <div className="sticky top-16 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 py-4 mb-8 transition-all">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/products')}
                            className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                                {isEditing ? 'Edit Product' : 'New Product'}
                            </h1>
                            <p className="text-xs text-slate-500 hidden sm:block">
                                {isEditing ? `Editing: ${formData.name}` : 'Create a new product for your store'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/products')}
                            className="hidden sm:px-4 sm:py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors sm:block"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 font-semibold transition-all active:scale-95"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save Product'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Basic Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-50">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Tag className="w-5 h-5 text-blue-500" />
                                Basic Information
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className={labelClass}>Product Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`${inputClass} text-lg`}
                                    placeholder="e.g. Premium Cotton T-Shirt"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>SKU</label>
                                    <input
                                        type="text"
                                        name="sku"
                                        value={formData.sku}
                                        onChange={handleChange}
                                        className={inputClass}
                                        placeholder="SKU-001"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        Slug
                                        <span className="text-xs font-normal text-slate-400 ml-2">(Auto-generated)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleChange}
                                        className={`${inputClass} bg-slate-50`}
                                        placeholder="premium-cotton-t-shirt"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Description</label>
                                <textarea
                                    name="description"
                                    rows={5}
                                    value={formData.description}
                                    onChange={handleChange}
                                    className={inputClass}
                                    placeholder="Detailed product description..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Media / Images */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-50">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-purple-500" />
                                Product Images
                            </h2>
                        </div>
                        <div className="p-6">
                            {formData.images.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    {formData.images.map((image, index) => (
                                        <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200">
                                            <img
                                                src={image.url}
                                                alt={image.alt || `Product image ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://placehold.co/200x200/fee2e2/dc2626?text=Upload+Failed';
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleImageRemove(index)}
                                                className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 shadow-lg hover:bg-rose-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            {index === 0 ? (
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                                                    <span className="text-xs font-semibold text-white px-2 py-0.5 bg-blue-500 rounded-full shadow-sm">
                                                        Primary
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newImages = [...formData.images];
                                                            const [moved] = newImages.splice(index, 1);
                                                            newImages.unshift(moved);
                                                            setFormData(prev => ({ ...prev, images: newImages }));
                                                        }}
                                                        className="w-full text-xs bg-white/90 text-slate-700 py-1.5 rounded-lg font-medium shadow-sm hover:bg-white"
                                                    >
                                                        Make Primary
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 hover:border-blue-400 hover:bg-blue-50/30 transition-all group">
                                <ImageUpload
                                    value=""
                                    onChange={handleImageAdd}
                                    folder="products"
                                    label=""
                                    placeholder={
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                                <Upload className="w-6 h-6" />
                                            </div>
                                            <p className="font-semibold text-slate-900">Click to upload or drag and drop</p>
                                            <p className="text-sm text-slate-500 mt-1">SVG, PNG, JPG or GIF (max. 20MB)</p>
                                        </div>
                                    }
                                    maxSize={20}
                                    showUrlInput={false}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-50">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-emerald-500" />
                                Pricing
                            </h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Price (₹)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        className={`${inputClass} pl-10`}
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>
                                    Compare Price
                                    <span className="text-xs font-normal text-slate-400 ml-2">(Optional)</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        name="compareAtPrice"
                                        value={formData.compareAtPrice}
                                        onChange={handleChange}
                                        className={`${inputClass} pl-10`}
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Variants - If Enabled */}
                    {variantsEnabled && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-indigo-500" />
                                    Variants
                                </h2>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <span className="text-sm font-medium text-slate-700">Enable</span>
                                    <div className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${formData.hasVariants ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                        <input
                                            type="checkbox"
                                            name="hasVariants"
                                            checked={formData.hasVariants}
                                            onChange={handleChange}
                                            className="hidden"
                                        />
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${formData.hasVariants ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </div>
                                </label>
                            </div>

                            {formData.hasVariants && (
                                <div className="p-6 bg-slate-50/50">
                                    <div className="space-y-4">
                                        {formData.variants.map((variant, index) => (
                                            <div key={index} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group animate-in fade-in slide-in-from-bottom-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newVariants = [...formData.variants];
                                                        newVariants.splice(index, 1);
                                                        setFormData(prev => ({ ...prev, variants: newVariants }));
                                                    }}
                                                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>

                                                <h4 className="font-semibold text-slate-900 mb-4">Variant #{index + 1}</h4>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Name</label>
                                                        <input
                                                            type="text"
                                                            value={variant.name || ''}
                                                            onChange={e => {
                                                                const v = [...formData.variants];
                                                                v[index].name = e.target.value;
                                                                setFormData(prev => ({ ...prev, variants: v }));
                                                            }}
                                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                                            placeholder="e.g. Blue - Large"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">SKU</label>
                                                        <input
                                                            type="text"
                                                            value={variant.sku || ''}
                                                            onChange={e => {
                                                                const v = [...formData.variants];
                                                                v[index].sku = e.target.value;
                                                                setFormData(prev => ({ ...prev, variants: v }));
                                                            }}
                                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                                            placeholder="SKU-VAR-001"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    {['Color', 'Size'].map(opt => (
                                                        <div key={opt}>
                                                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">{opt}</label>
                                                            <input
                                                                type="text"
                                                                value={variant.options?.[opt.toLowerCase()] || ''}
                                                                onChange={e => {
                                                                    const v = [...formData.variants];
                                                                    v[index].options = { ...v[index].options, [opt.toLowerCase()]: e.target.value };
                                                                    setFormData(prev => ({ ...prev, variants: v }));
                                                                }}
                                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                                                placeholder={opt}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                variants: [...prev.variants, { name: '', sku: '', options: {} }]
                                            }))}
                                            className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 font-semibold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus className="w-5 h-5" />
                                            Add Another Variant
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Status Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-50">
                            <h3 className="font-bold text-slate-900">Publish Status</h3>
                        </div>
                        <div className="p-5">
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                            >
                                <option value="draft">Draft (Unpublished)</option>
                                <option value="active">Active (Visible)</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>

                    {/* Category Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-50">
                            <h3 className="font-bold text-slate-900">Category</h3>
                        </div>
                        <div className="p-5">
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Inventory Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-50">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Box className="w-4 h-4 text-orange-500" />
                                Inventory
                            </h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                <input
                                    type="checkbox"
                                    name="trackInventory"
                                    checked={formData.trackInventory}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                />
                                <span className="font-medium text-slate-700">Track Stock</span>
                            </label>

                            {formData.trackInventory && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className={labelClass}>Quantity</label>
                                        <input
                                            type="number"
                                            name="inventory"
                                            value={formData.inventory}
                                            onChange={handleChange}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Low Stock Alert</label>
                                        <input
                                            type="number"
                                            name="lowStockThreshold"
                                            value={formData.lowStockThreshold}
                                            onChange={handleChange}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Shipping Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-50">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Truck className="w-4 h-4 text-teal-500" />
                                Shipping
                            </h3>
                        </div>
                        <div className="p-5">
                            <label className={labelClass}>Weight (kg)</label>
                            <input
                                type="number"
                                name="weight"
                                value={formData.weight}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="0.00"
                                step="0.01"
                            />
                        </div>
                    </div>

                </div>
            </div>
        </form>
    );
};

export default ProductForm;

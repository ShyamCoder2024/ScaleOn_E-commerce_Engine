import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ShoppingCart,
    Heart,
    Share2,
    ChevronRight,
    Minus,
    Plus,
    Check,
    Truck,
    Shield,
    RotateCcw,
    Star
} from 'lucide-react';
import { productAPI } from '../services/api';
import { useConfig } from '../context/ConfigContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import toast from 'react-hot-toast';
import ProductReviews from '../components/ProductReviews';
import ImageLightbox from '../components/ImageLightbox';

const ProductDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { formatPrice, isFeatureEnabled } = useConfig();
    const { addToCart } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [addingToCart, setAddingToCart] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    useEffect(() => {
        fetchProduct();
    }, [slug]);

    const fetchProduct = async () => {
        setLoading(true);
        try {
            const response = await productAPI.getBySlug(slug);
            const prod = response.data.data.product;
            setProduct(prod);

            if (prod.hasVariants && prod.variants?.length > 0) {
                setSelectedVariant(prod.variants[0]);
            }
        } catch (err) {
            console.error('Failed to fetch product:', err);
            toast.error('Product not found');
            navigate('/products');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async () => {
        setAddingToCart(true);
        try {
            await addToCart(product._id, quantity, selectedVariant);
        } finally {
            setAddingToCart(false);
        }
    };

    const handleBuyNow = async () => {
        setAddingToCart(true);
        try {
            await addToCart(product._id, quantity, selectedVariant);
            navigate('/cart');
        } finally {
            setAddingToCart(false);
        }
    };

    const getCurrentPrice = () => {
        if (selectedVariant?.price) {
            return selectedVariant.price;
        }
        return product?.price || 0;
    };

    const getCurrentStock = () => {
        if (selectedVariant) {
            return selectedVariant.inventory || 0;
        }
        return product?.inventory || 0;
    };

    const isInStock = () => {
        if (!isFeatureEnabled('inventory')) return true;
        if (product?.trackInventory === false) return true;
        return getCurrentStock() > 0;
    };

    if (loading) {
        return (
            <div className="container-custom py-8">
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="skeleton aspect-square rounded-xl" />
                    <div className="space-y-4">
                        <div className="skeleton h-8 w-3/4" />
                        <div className="skeleton h-6 w-1/2" />
                        <div className="skeleton h-24 w-full" />
                        <div className="skeleton h-12 w-32" />
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return null;
    }

    const hasDiscount = product.compareAtPrice && product.compareAtPrice > getCurrentPrice();
    const discountPercent = hasDiscount
        ? Math.round((1 - getCurrentPrice() / product.compareAtPrice) * 100)
        : 0;

    const images = product.images?.length > 0
        ? product.images
        : [{ url: 'https://placehold.co/600x600/e2e8f0/475569?text=No+Image', alt: 'No image' }];

    return (
        <div className="bg-white overflow-hidden w-full">
            {/* Breadcrumb - Added overflow handling */}
            <div className="bg-gray-50 border-b w-full">
                <div className="container-custom py-4">
                    <nav className="flex items-center gap-2 text-sm text-gray-500 overflow-x-auto whitespace-nowrap scrollbar-hide">
                        <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
                        <ChevronRight size={14} className="flex-shrink-0" />
                        <Link to="/products" className="hover:text-gray-900 transition-colors">Products</Link>
                        {product.categories?.[0] && (
                            <>
                                <ChevronRight size={14} className="flex-shrink-0" />
                                <Link
                                    to={`/products?category=${product.categories[0]._id}`}
                                    className="hover:text-gray-900 transition-colors"
                                >
                                    {product.categories[0].name}
                                </Link>
                            </>
                        )}
                        <ChevronRight size={14} className="flex-shrink-0" />
                        <span className="text-gray-900 font-medium truncate max-w-[150px]">{product.name}</span>
                    </nav>
                </div>
            </div>

            <div className="container-custom py-6 sm:py-8">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Image Gallery */}
                    <div className="space-y-4 w-full">
                        {/* Main Image */}
                        <div
                            className="aspect-square bg-white rounded-2xl overflow-hidden relative shadow-sm border border-gray-200 cursor-zoom-in group"
                            onClick={() => setLightboxOpen(true)}
                        >
                            <img
                                src={images[selectedImage]?.url}
                                alt={images[selectedImage]?.alt || product.name}
                                className="w-full h-full object-contain p-4 transform group-hover:scale-105 transition-transform duration-500"
                            />

                            {/* Zoom Indicator */}
                            <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /><path d="M11 8v6" /><path d="M8 11h6" /></svg>
                                Click to zoom
                            </div>

                            {/* Wishlist Button */}
                            {isFeatureEnabled('wishlist') && (
                                <button
                                    onClick={() => toggleWishlist(product)}
                                    className={`absolute top-4 right-4 p-3 rounded-full shadow-lg transition-all z-10 hover:scale-110 active:scale-95 ${isInWishlist(product._id)
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:text-rose-500'
                                        }`}
                                    title={isInWishlist(product._id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                                >
                                    <Heart
                                        size={22}
                                        className={isInWishlist(product._id) ? 'fill-white' : ''}
                                    />
                                </button>
                            )}

                            {/* Badges */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                                {hasDiscount && (
                                    <span className="bg-rose-500 text-white px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-sm">
                                        -{discountPercent}% OFF
                                    </span>
                                )}
                                {!isInStock() && (
                                    <span className="bg-gray-900 text-white px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-sm top-3">
                                        Out of Stock
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === idx
                                            ? 'border-primary-600 ring-2 ring-primary-600/20'
                                            : 'border-transparent hover:border-gray-200'
                                            }`}
                                    >
                                        <img
                                            src={img.url}
                                            alt={img.alt}
                                            className="w-full h-full object-contain bg-white"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6 sm:space-y-8">
                        <div>
                            {/* Category */}
                            {product.categories?.[0] && (
                                <Link
                                    to={`/products?category=${product.categories[0]._id}`}
                                    className="text-sm font-medium text-primary-600 hover:text-primary-700 mb-2 inline-block uppercase tracking-wider"
                                >
                                    {product.categories[0].name}
                                </Link>
                            )}

                            {/* Title */}
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-3">
                                {product.name}
                            </h1>

                            {/* Rating */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={18}
                                            className={i < 4 ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm font-medium text-gray-500">(12 reviews)</span>
                            </div>

                            {/* Price */}
                            <div className="flex flex-wrap items-baseline gap-3 sm:gap-4">
                                <span className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                                    {formatPrice(getCurrentPrice())}
                                </span>
                                {hasDiscount && (
                                    <>
                                        <span className="text-xl text-gray-400 line-through font-medium">
                                            {formatPrice(product.compareAtPrice)}
                                        </span>
                                        <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                                            Save {formatPrice(product.compareAtPrice - getCurrentPrice())}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Short Description */}
                        {product.shortDescription && (
                            <p className="text-gray-600 leading-relaxed text-base sm:text-lg border-t border-b border-gray-100 py-4">
                                {product.shortDescription}
                            </p>
                        )}

                        {/* Variants */}
                        {product.hasVariants && product.variants?.length > 0 && (
                            <div className="space-y-5">
                                {product.variantOptions?.length > 0 ? (
                                    product.variantOptions.map(option => (
                                        <div key={option.name}>
                                            <label className="block text-sm font-semibold text-gray-900 mb-2.5 uppercase tracking-wide">
                                                {option.name}
                                            </label>
                                            <div className="flex flex-wrap gap-2.5">
                                                {option.values.map(value => {
                                                    const isSelected = selectedVariant?.options?.get?.(option.name) === value ||
                                                        selectedVariant?.options?.[option.name] === value;
                                                    const matchingVariant = product.variants?.find(v => {
                                                        const optValue = v.options?.get?.(option.name) || v.options?.[option.name];
                                                        return optValue === value;
                                                    });
                                                    const isAvailable = product.trackInventory === false ||
                                                        (matchingVariant?.isAvailable !== false && matchingVariant?.inventory > 0);

                                                    return (
                                                        <button
                                                            key={value}
                                                            onClick={() => matchingVariant && setSelectedVariant(matchingVariant)}
                                                            disabled={!isAvailable}
                                                            className={`px-4 sm:px-5 py-2.5 rounded-xl border font-medium transition-all text-sm sm:text-base ${isSelected
                                                                ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-600/20'
                                                                : isAvailable
                                                                    ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                                                                    : 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50 decoration-slate-400'
                                                                }`}
                                                        >
                                                            {value}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2.5 uppercase tracking-wide">Select Option</label>
                                        <div className="flex flex-wrap gap-2.5">
                                            {product.variants.map((variant, idx) => {
                                                const isSelected = selectedVariant?._id === variant._id || selectedVariant?.sku === variant.sku;
                                                const isAvailable = product.trackInventory === false ||
                                                    (variant.isAvailable !== false && variant.inventory > 0);
                                                const variantName = variant.options
                                                    ? (Array.from(variant.options?.values?.() || Object.values(variant.options)).join(' / '))
                                                    : variant.sku || `Option ${idx + 1}`;

                                                return (
                                                    <button
                                                        key={variant._id || variant.sku || idx}
                                                        onClick={() => setSelectedVariant(variant)}
                                                        disabled={!isAvailable}
                                                        className={`px-4 sm:px-5 py-2.5 rounded-xl border font-medium transition-all text-sm sm:text-base ${isSelected
                                                            ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-600/20'
                                                            : isAvailable
                                                                ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                                                                : 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                                                            }`}
                                                    >
                                                        {variantName}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Quantity & Actions Wrapper */}
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4 sm:space-y-6">
                            {/* Quantity */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Quantity</label>
                                    {isFeatureEnabled('inventory') && isInStock() && (
                                        <span className={`text-sm font-medium ${getCurrentStock() < 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            {getCurrentStock()} available
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200 p-1">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors active:scale-95 disabled:opacity-50"
                                            disabled={quantity <= 1}
                                        >
                                            <Minus size={18} />
                                        </button>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-12 sm:w-16 bg-transparent text-center font-bold text-gray-900 text-lg focus:outline-none"
                                            min="1"
                                        />
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors active:scale-95 disabled:opacity-50"
                                            disabled={isFeatureEnabled('inventory') && quantity >= getCurrentStock()}
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                {isInStock() ? (
                                    <>
                                        <button
                                            onClick={handleAddToCart}
                                            disabled={addingToCart}
                                            className="flex-1 btn-secondary py-3.5 text-base font-bold flex items-center justify-center gap-2 border-gray-200 hover:bg-white hover:border-primary-600 hover:text-primary-600 shadow-sm"
                                        >
                                            <ShoppingCart size={20} />
                                            {addingToCart ? 'Adding...' : 'Add to Cart'}
                                        </button>
                                        <button
                                            onClick={handleBuyNow}
                                            disabled={addingToCart}
                                            className="flex-1 btn-primary py-3.5 text-base font-bold shadow-lg shadow-primary-600/20 active:scale-[0.98] transition-transform"
                                        >
                                            Buy Now
                                        </button>
                                    </>
                                ) : (
                                    <button disabled className="w-full bg-gray-100 text-gray-400 font-bold py-4 rounded-xl border border-gray-200 cursor-not-allowed">
                                        Out of Stock
                                    </button>
                                )}
                                {/* Mobile-Optimized Wishlist */}
                                {isFeatureEnabled('wishlist') && (
                                    <button
                                        onClick={() => toggleWishlist(product)}
                                        className={`sm:w-auto w-full py-3.5 sm:px-6 rounded-xl flex items-center justify-center gap-2 border-2 font-bold transition-all ${isInWishlist(product._id)
                                            ? 'bg-rose-50 border-rose-200 text-rose-500'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                    >
                                        <Heart size={20} className={isInWishlist(product._id) ? 'fill-rose-500' : ''} />
                                        <span className="sm:hidden">Wishlist</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Features Grid - Stack on mobile */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 md:pt-8 border-t border-gray-100">
                            {[
                                { icon: Truck, title: 'Free Shipping', sub: 'On orders ₹999+', color: 'text-blue-600', bg: 'bg-blue-50' },
                                { icon: Shield, title: 'Secure Payment', sub: '100% protected', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { icon: RotateCcw, title: 'Easy Returns', sub: '7-day policy', color: 'text-amber-600', bg: 'bg-amber-50' }
                            ].map((feature, i) => (
                                <div key={i} className="flex sm:flex-col items-center gap-4 sm:gap-2 p-4 sm:p-0 bg-gray-50 sm:bg-transparent rounded-xl sm:rounded-none border border-gray-100 sm:border-none">
                                    <div className={`w-12 h-12 ${feature.bg} rounded-full flex items-center justify-center shrink-0`}>
                                        <feature.icon className={feature.color} size={24} />
                                    </div>
                                    <div className="text-left sm:text-center">
                                        <p className="font-bold text-gray-900">{feature.title}</p>
                                        <p className="text-xs text-gray-500 font-medium">{feature.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Description */}
                {product.description && (
                    <div className="mt-12 sm:mt-16 pt-8 sm:pt-10 border-t border-gray-100">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Product Description</h2>
                        <div className="prose prose-gray max-w-none prose-p:leading-loose prose-a:text-primary-600 hover:prose-a:text-primary-700">
                            {product.description.split('\n').map((paragraph, idx) => (
                                <p key={idx} className="mb-4 text-gray-600">{paragraph}</p>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reviews */}
                {isFeatureEnabled('reviews') && (
                    <div className="mt-12 sm:mt-16">
                        <ProductReviews productId={product._id} />
                    </div>
                )}
            </div>

            {/* Image Lightbox */}
            <ImageLightbox
                images={images}
                initialIndex={selectedImage}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
            />
        </div>
    );
};

export default ProductDetail;

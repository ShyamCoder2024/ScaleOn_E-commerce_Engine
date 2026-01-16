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
import ProductReviews from '../components/ProductReviews'; // Import the new component

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

    useEffect(() => {
        fetchProduct();
    }, [slug]);

    const fetchProduct = async () => {
        setLoading(true);
        try {
            const response = await productAPI.getBySlug(slug);
            const prod = response.data.data.product;
            setProduct(prod);

            // Set default variant if product has variants
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
        // If inventory feature is disabled globally, always in stock
        if (!isFeatureEnabled('inventory')) return true;
        // If product doesn't track inventory, always in stock
        if (product?.trackInventory === false) return true;
        // Check current stock based on variant or main inventory
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
        <div className="bg-white">
            {/* Breadcrumb */}
            <div className="bg-gray-50 border-b">
                <div className="container-custom py-4">
                    <nav className="flex items-center gap-2 text-sm">
                        <Link to="/" className="text-gray-500 hover:text-gray-700">Home</Link>
                        <ChevronRight size={16} className="text-gray-400" />
                        <Link to="/products" className="text-gray-500 hover:text-gray-700">Products</Link>
                        {product.categories?.[0] && (
                            <>
                                <ChevronRight size={16} className="text-gray-400" />
                                <Link
                                    to={`/products?category=${product.categories[0]._id}`}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    {product.categories[0].name}
                                </Link>
                            </>
                        )}
                        <ChevronRight size={16} className="text-gray-400" />
                        <span className="text-gray-900 font-medium truncate">{product.name}</span>
                    </nav>
                </div>
            </div>

            <div className="container-custom py-8">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        {/* Main Image */}
                        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative">
                            <img
                                src={images[selectedImage]?.url}
                                alt={images[selectedImage]?.alt || product.name}
                                className="w-full h-full object-cover"
                            />

                            {/* Wishlist Button - Only show if feature enabled */}
                            {isFeatureEnabled('wishlist') && (
                                <button
                                    onClick={() => toggleWishlist(product)}
                                    className={`absolute top-4 right-4 p-3 rounded-full shadow-lg transition-all z-10 ${isInWishlist(product._id)
                                        ? 'bg-red-500 text-white'
                                        : 'bg-white text-gray-600 hover:text-red-500'
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
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                {hasDiscount && (
                                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                        -{discountPercent}% OFF
                                    </span>
                                )}
                                {!isInStock() && (
                                    <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                        Out of Stock
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === idx ? 'border-primary-600' : 'border-transparent hover:border-gray-300'
                                            }`}
                                    >
                                        <img
                                            src={img.url}
                                            alt={img.alt}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        {/* Category */}
                        {product.categories?.[0] && (
                            <Link
                                to={`/products?category=${product.categories[0]._id}`}
                                className="text-sm text-primary-600 hover:underline"
                            >
                                {product.categories[0].name}
                            </Link>
                        )}

                        {/* Title */}
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                            {product.name}
                        </h1>

                        {/* Rating Placeholder */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={18}
                                        className={i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                                    />
                                ))}
                            </div>
                            <span className="text-sm text-gray-500">(12 reviews)</span>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold text-gray-900">
                                {formatPrice(getCurrentPrice())}
                            </span>
                            {hasDiscount && (
                                <>
                                    <span className="text-xl text-gray-500 line-through">
                                        {formatPrice(product.compareAtPrice)}
                                    </span>
                                    <span className="text-sm font-medium text-green-600">
                                        Save {formatPrice(product.compareAtPrice - getCurrentPrice())}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Short Description */}
                        {product.shortDescription && (
                            <p className="text-gray-600 leading-relaxed">
                                {product.shortDescription}
                            </p>
                        )}

                        {/* Variants - Show if product has variants */}
                        {product.hasVariants && product.variants?.length > 0 && (
                            <div className="space-y-4">
                                {/* If variantOptions are defined, use them */}
                                {product.variantOptions?.length > 0 ? (
                                    product.variantOptions.map(option => (
                                        <div key={option.name}>
                                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                                {option.name}
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {option.values.map(value => {
                                                    const isSelected = selectedVariant?.options?.get?.(option.name) === value ||
                                                        selectedVariant?.options?.[option.name] === value;
                                                    const matchingVariant = product.variants?.find(v => {
                                                        const optValue = v.options?.get?.(option.name) || v.options?.[option.name];
                                                        return optValue === value;
                                                    });
                                                    // Check availability - if trackInventory is false, always available
                                                    const isAvailable = product.trackInventory === false ||
                                                        (matchingVariant?.isAvailable !== false && matchingVariant?.inventory > 0);

                                                    return (
                                                        <button
                                                            key={value}
                                                            onClick={() => {
                                                                if (matchingVariant) {
                                                                    setSelectedVariant(matchingVariant);
                                                                }
                                                            }}
                                                            disabled={!isAvailable}
                                                            className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${isSelected
                                                                ? 'border-primary-600 bg-primary-50 text-primary-700'
                                                                : isAvailable
                                                                    ? 'border-gray-200 hover:border-gray-300'
                                                                    : 'border-gray-100 text-gray-400 cursor-not-allowed line-through'
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
                                    /* Fallback: display variants directly if no variantOptions defined */
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 mb-2">
                                            Select Option
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {product.variants.map((variant, idx) => {
                                                const isSelected = selectedVariant?._id === variant._id || selectedVariant?.sku === variant.sku;
                                                const isAvailable = product.trackInventory === false ||
                                                    (variant.isAvailable !== false && variant.inventory > 0);
                                                // Get display name from options or sku
                                                const variantName = variant.options
                                                    ? (Array.from(variant.options?.values?.() || Object.values(variant.options)).join(' / '))
                                                    : variant.sku || `Option ${idx + 1}`;

                                                return (
                                                    <button
                                                        key={variant._id || variant.sku || idx}
                                                        onClick={() => setSelectedVariant(variant)}
                                                        disabled={!isAvailable}
                                                        className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${isSelected
                                                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                                                            : isAvailable
                                                                ? 'border-gray-200 hover:border-gray-300'
                                                                : 'border-gray-100 text-gray-400 cursor-not-allowed line-through'
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

                        {/* Quantity */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center bg-gray-50 rounded-full p-1.5 border border-gray-200">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={quantity <= 1}
                                        title="Decrease quantity"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-12 bg-transparent text-center font-bold text-gray-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        min="1"
                                    />
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={isFeatureEnabled('inventory') && quantity >= getCurrentStock()}
                                        title="Increase quantity"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>

                                {isFeatureEnabled('inventory') && isInStock() && (
                                    <span className="text-sm text-gray-500 font-medium">
                                        {getCurrentStock()} available
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Add to Cart / Buy Now / Wishlist */}
                        <div className="flex gap-3 flex-wrap">
                            {isInStock() ? (
                                <>
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={addingToCart}
                                        className="flex-1 min-w-[120px] btn-secondary py-3 sm:py-4 text-base sm:text-lg flex items-center justify-center gap-2"
                                    >
                                        <ShoppingCart size={20} />
                                        <span className="hidden xs:inline">{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
                                        <span className="xs:hidden">{addingToCart ? '...' : 'Cart'}</span>
                                    </button>
                                    <button
                                        onClick={handleBuyNow}
                                        disabled={addingToCart}
                                        className="flex-1 min-w-[120px] btn-primary py-3 sm:py-4 text-base sm:text-lg"
                                    >
                                        Buy Now
                                    </button>
                                </>
                            ) : (
                                <button disabled className="flex-1 btn-secondary py-3 sm:py-4 text-base sm:text-lg opacity-50 cursor-not-allowed">
                                    Out of Stock
                                </button>
                            )}
                            {/* Wishlist Button - Always visible for mobile accessibility */}
                            {isFeatureEnabled('wishlist') && (
                                <button
                                    onClick={() => toggleWishlist(product)}
                                    className={`w-14 h-14 sm:w-auto sm:h-auto sm:px-4 sm:py-3 rounded-xl flex items-center justify-center gap-2 transition-all border-2 ${isInWishlist(product._id)
                                            ? 'bg-red-50 border-red-500 text-red-500'
                                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500'
                                        }`}
                                    title={isInWishlist(product._id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                                >
                                    <Heart
                                        size={22}
                                        className={isInWishlist(product._id) ? 'fill-red-500' : ''}
                                    />
                                    <span className="hidden sm:inline font-medium">
                                        {isInWishlist(product._id) ? 'Saved' : 'Wishlist'}
                                    </span>
                                </button>
                            )}
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                            <div className="text-center">
                                <div className="w-12 h-12 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-2">
                                    <Truck className="text-primary-600" size={24} />
                                </div>
                                <p className="text-sm font-medium text-gray-900">Free Shipping</p>
                                <p className="text-xs text-gray-500">On orders ₹999+</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
                                    <Shield className="text-green-600" size={24} />
                                </div>
                                <p className="text-sm font-medium text-gray-900">Secure Payment</p>
                                <p className="text-xs text-gray-500">100% protected</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-2">
                                    <RotateCcw className="text-orange-600" size={24} />
                                </div>
                                <p className="text-sm font-medium text-gray-900">Easy Returns</p>
                                <p className="text-xs text-gray-500">7-day policy</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {product.description && (
                    <div className="mt-12 pt-8 border-t">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Product Description</h2>
                        <div className="prose max-w-none text-gray-600">
                            {product.description.split('\n').map((paragraph, idx) => (
                                <p key={idx} className="mb-4">{paragraph}</p>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reviews Section - Only show if feature enabled */}
                {isFeatureEnabled('reviews') && <ProductReviews />}
            </div>
        </div>
    );
};

export default ProductDetail;

import { useState, useEffect, useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Plus, Minus, Star } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import AuthPromptModal from './AuthPromptModal';

// Utility for debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const ProductCard = memo(({ product, viewMode = 'grid' }) => {
    const { formatPrice, isFeatureEnabled } = useConfig();
    const { cart, addToCart, updateQuantity } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { isAuthenticated } = useAuth();

    // Critical Safety Check: If product is null/undefined, do not render ANYTHING.
    // This prevents the "Oops" crash boundary from triggering.
    if (!product) return null;

    // Mock Rating Logic (Visual Polish)
    const rating = product.rating || 4.5;
    const reviewCount = product.reviewCount || Math.floor(Math.random() * 50) + 10;

    // State for auth prompt modal
    const [showAuthModal, setShowAuthModal] = useState(false);

    // Find if item is in cart
    const cartItem = cart.items?.find(item =>
        (item.product?._id === product._id) || (item.product === product._id)
    );

    // Local state for immediate UI feedback
    const [localQuantity, setLocalQuantity] = useState(0);
    const [isUpdating, setIsUpdating] = useState(false);

    // Sync local quantity with cart, but ONLY if we are not currently debouncing an update.
    // We use a ref to track if a debounce is pending to prevent cart sync glitches.
    const isDebouncingRef = useRef(false);

    useEffect(() => {
        // Only sync if we are NOT in the middle of a user interaction sequence
        if (!isDebouncingRef.current) {
            setLocalQuantity(cartItem?.quantity || 0);
        }
    }, [cartItem?.quantity]);

    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // GUEST CHECK: Show auth modal instead of adding to cart
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }

        // Instant UI update
        setIsUpdating(true); // Locks the UI state temporarily if needed (optional)
        setLocalQuantity(1);

        try {
            await addToCart(product._id, 1);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleWishlistToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(product);
    };

    // Create the debounced function ONCE using useRef
    // Reduced debounce from 500ms to 250ms for better mobile responsiveness
    const debouncedUpdateQuantity = useRef(
        debounce(async (itemId, newQty) => {
            try {
                if (newQty > 0) {
                    await updateQuantity(itemId, newQty);
                } else {
                    // When quantity is 0, remove the item from cart
                    await updateQuantity(itemId, 0);
                }
            } finally {
                isDebouncingRef.current = false;
                setIsUpdating(false);
            }
        }, 250) // Reduced from 500ms for better mobile UX
    ).current;

    const changeQuantity = (e, change) => {
        e.preventDefault();
        e.stopPropagation();

        if (!cartItem || isUpdating) return; // Prevent rapid clicks during update

        const newQty = localQuantity + change;
        if (newQty < 0) return; // Prevent negative locally

        // 1. Update UI Immediately
        setLocalQuantity(newQty);
        setIsUpdating(true); // Lock UI during API call

        // 2. Mark as debouncing so useEffect doesn't overwrite us with stale data
        isDebouncingRef.current = true;

        // 3. Trigger API call
        debouncedUpdateQuantity(cartItem._id, newQty);
    };

    const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
    const discountPercent = hasDiscount
        ? Math.round((1 - product.price / product.compareAtPrice) * 100)
        : 0;

    const primaryImage = product.primaryImage ||
        product.images?.find(img => img.isPrimary)?.url ||
        product.images?.[0]?.url ||
        `https://placehold.co/400x400/e2e8f0/475569?text=${encodeURIComponent(product.name?.slice(0, 10) || 'Product')}`;

    const secondaryImage = product.images?.find(img => img.url !== primaryImage)?.url || primaryImage;

    // Fallback placeholder for broken images
    const placeholderImage = `https://placehold.co/400x400/e2e8f0/475569?text=${encodeURIComponent(product.name?.slice(0, 10) || 'Product')}`;

    // Fix: Proper stock check - respect trackInventory setting and variant inventory
    const checkInStock = () => {
        // If inventory feature is disabled globally, always show in stock
        if (!isFeatureEnabled('inventory')) return true;
        // If product doesn't track inventory, always show in stock
        if (product.trackInventory === false) return true;
        // If product has variants, check if any variant has stock
        if (product.hasVariants && product.variants?.length > 0) {
            return product.variants.some(v => v.isAvailable && v.inventory > 0);
        }
        // Check main inventory
        return product.inventory > 0;
    };

    const inStock = checkInStock();
    const inWishlist = isInWishlist(product._id);
    const wishlistEnabled = isFeatureEnabled('wishlist');

    // Reusable Counter Component - Premium Minimalist (White/Outline)
    const QuantityCounter = () => (
        <div
            onClick={(e) => e.preventDefault()}
            className="flex items-center justify-between w-full h-[42px] bg-white border-2 border-blue-600 text-blue-700 rounded-xl overflow-hidden shadow-sm animate-in fade-in duration-200"
        >
            <button
                onClick={(e) => changeQuantity(e, -1)}
                className="h-full px-4 hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center"
            >
                <Minus size={16} strokeWidth={2.5} />
            </button>
            <span className="font-bold text-base select-none">
                {localQuantity}
            </span>
            <button
                onClick={(e) => changeQuantity(e, 1)}
                className="h-full px-4 hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center"
            >
                <Plus size={16} strokeWidth={2.5} />
            </button>
        </div>
    );

    // List View
    if (viewMode === 'list') {
        return (
            <Link
                to={`/products/${product.slug}`}
                className="group flex gap-6 p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-shadow duration-300"
            >
                <div className="relative w-48 h-48 shrink-0 overflow-hidden rounded-xl bg-gray-50">
                    <img
                        src={primaryImage}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 transform font-sans group-hover:scale-105"
                        onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                    />
                    {hasDiscount && (
                        <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full tracking-wide uppercase">
                            -{discountPercent}%
                        </span>
                    )}
                </div>

                <div className="flex-1 flex flex-col justify-center">
                    {product.categories?.[0] && (
                        <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-2">
                            {product.categories[0].name}
                        </p>
                    )}

                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors">
                        {product.name}
                    </h3>

                    <div className="flex items-baseline gap-3 mb-4">
                        <span className="text-2xl font-bold text-gray-900">
                            {formatPrice(product.price)}
                        </span>
                        {hasDiscount && (
                            <span className="text-sm text-gray-400 line-through">
                                {formatPrice(product.compareAtPrice)}
                            </span>
                        )}
                    </div>

                    {product.shortDescription && (
                        <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2 max-w-2xl">
                            {product.shortDescription}
                        </p>
                    )}

                    <div className="flex items-center gap-3">
                        {inStock ? (
                            localQuantity > 0 ? (
                                <div className="w-40">
                                    <QuantityCounter />
                                </div>
                            ) : (
                                <button
                                    onClick={handleAddToCart}
                                    className="btn-primary py-2.5 px-6 rounded-full font-semibold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                                >
                                    <ShoppingCart size={18} />
                                    Add to Cart
                                </button>
                            )
                        ) : (
                            <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-full font-medium text-sm">
                                Out of Stock
                            </span>
                        )}

                        {wishlistEnabled && (
                            <button
                                onClick={handleWishlistToggle}
                                className={`p-2.5 rounded-full border transition-all duration-200 ${inWishlist
                                    ? 'bg-red-50 border-red-100 text-red-500'
                                    : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                                    }`}
                            >
                                <Heart size={20} className={inWishlist ? 'fill-current' : ''} />
                            </button>
                        )}
                    </div>
                </div>
            </Link>
        );
    }

    // Grid View
    return (
        <Link
            to={`/products/${product.slug}`}
            className="group relative block w-full bg-white rounded-xl sm:rounded-2xl overflow-hidden transition-shadow duration-300 hover:shadow-xl transform-gpu h-full flex flex-col border border-transparent hover:border-gray-100"
        >
            <div className="relative aspect-square bg-gray-100 overflow-hidden isolate">
                <img
                    src={primaryImage}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-300 group-hover:opacity-0 will-change-opacity"
                    loading="lazy"
                    onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                />

                <img
                    src={secondaryImage}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-500 scale-100 group-hover:scale-110 transform-gpu will-change-transform"
                    aria-hidden="true"
                    onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                />

                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-30 flex flex-col gap-1.5 pointer-events-none">
                    {product.isFeatured && (
                        <span className="bg-white/95 backdrop-blur-sm text-gray-900 text-[10px] font-bold px-2 py-1 rounded shadow-sm tracking-wide uppercase animate-fade-in">
                            Featured
                        </span>
                    )}
                    {hasDiscount && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm tracking-wide uppercase animate-fade-in">
                            -{discountPercent}%
                        </span>
                    )}
                </div>

                {wishlistEnabled && (
                    <button
                        onClick={handleWishlistToggle}
                        className={`absolute top-2 right-2 sm:top-3 sm:right-3 z-30 p-2.5 rounded-full shadow-sm transition-all duration-300 ${inWishlist
                            ? 'bg-white text-red-500 opacity-100 scale-100'
                            : 'bg-white/90 backdrop-blur-sm text-gray-600 md:opacity-0 md:translate-x-2'
                            } md:group-hover:opacity-100 md:group-hover:translate-x-0 hover:bg-white hover:text-red-500 active:scale-95`}
                        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                        <Heart
                            size={18}
                            className={`transition-transform duration-200 ${inWishlist ? 'fill-current scale-110' : ''}`}
                        />
                    </button>
                )}

                {/* Desktop: Slide-Up Action Area */}
                {inStock ? (
                    localQuantity > 0 ? (
                        <div className="hidden md:block absolute bottom-0 left-0 right-0 z-30 p-4 translate-y-0 transition-transform duration-300 ease-out transform-gpu">
                            <QuantityCounter />
                        </div>
                    ) : (
                        <div className="hidden md:block absolute bottom-0 left-0 right-0 z-30 p-4 translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0 transform-gpu will-change-transform">
                            <button
                                onClick={handleAddToCart}
                                className="w-full bg-white/95 backdrop-blur-md text-gray-900 font-bold py-3 rounded-xl shadow-lg hover:bg-white active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <ShoppingCart size={18} />
                                <span>Add to Cart</span>
                            </button>
                        </div>
                    )
                ) : (
                    <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="bg-white/90 backdrop-blur text-gray-900 px-4 py-2 rounded-lg font-semibold text-sm shadow-lg">
                            Out of Stock
                        </span>
                    </div>
                )}
            </div>

            <div className="p-3 sm:p-5 bg-white relative z-20 flex-1 flex flex-col justify-between">
                <div>
                    {product.categories?.[0] && (
                        <div className="text-[10px] font-bold text-primary-600 uppercase tracking-wider mb-1.5 opacity-80 truncate">
                            {product.categories[0].name}
                        </div>
                    )}

                    <div className="flex items-center gap-1 mb-1.5">
                        <Star size={12} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium text-gray-700">{rating}</span>
                        <span className="text-[10px] text-gray-400">({reviewCount})</span>
                    </div>

                    <h3 className="font-heading font-bold text-gray-900 text-sm sm:text-base leading-tight mb-2 line-clamp-2 md:line-clamp-1 group-hover:text-primary-600 transition-colors h-[2.5em] md:h-auto">
                        {product.name}
                    </h3>

                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-3">
                        <span className="font-bold text-base sm:text-lg text-gray-900">
                            {formatPrice(product.price)}
                        </span>
                        {hasDiscount && (
                            <span className="text-xs sm:text-sm font-medium text-gray-400 line-through decoration-gray-400/60 break-all">
                                {formatPrice(product.compareAtPrice)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Mobile: Action Area */}
                {inStock && (
                    <div className="md:hidden mt-auto pt-3">
                        {localQuantity > 0 ? (
                            <div className="h-10">
                                <QuantityCounter />
                            </div>
                        ) : (
                            <button
                                onClick={handleAddToCart}
                                className="w-full bg-primary-600 text-white h-10 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-primary-700 whitespace-nowrap shadow-md shadow-primary-500/20"
                            >
                                <ShoppingCart size={16} className="shrink-0" />
                                Add to Cart
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Auth Prompt Modal for Guests */}
            <AuthPromptModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                product={product}
                action="purchase"
                redirectAfterAuth={`/products/${product.slug}`}
            />
        </Link>
    );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;

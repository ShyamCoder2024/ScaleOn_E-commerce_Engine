import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useConfig } from '../context/ConfigContext';

const Wishlist = () => {
    const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
    const { addToCart } = useCart();
    const { formatPrice, isFeatureEnabled } = useConfig();

    // If wishlist feature is disabled, redirect message
    if (!isFeatureEnabled('wishlist')) {
        return (
            <div className="container-custom py-16 text-center">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Wishlist Not Available</h1>
                <p className="text-gray-500 mb-6">The wishlist feature is currently disabled.</p>
                <Link to="/products" className="btn-primary inline-flex items-center gap-2">
                    <ArrowLeft size={18} />
                    Continue Shopping
                </Link>
            </div>
        );
    }

    if (wishlist.length === 0) {
        return (
            <div className="container-custom py-8 min-h-[80vh] flex flex-col items-center justify-center">
                <div className="max-w-md mx-auto mb-16 flex flex-col items-center">
                    {/* Sad Heart Sticker */}
                    <div className="relative w-48 h-48 mb-6 animate-in fade-in zoom-in duration-500 delay-100">
                        <svg viewBox="0 0 200 200" className="w-full h-full text-gray-300" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            {/* Heart Shape */}
                            <path d="M100 180s-60-35-85-75c-20-30-5-70 30-70 20 0 40 15 55 35 15-20 35-35 55-35 35 0 50 40 30 70-25 40-85 75-85 75z" />

                            {/* Sad Face */}
                            <g className="text-gray-400">
                                {/* Eyes (Closed/Sad) */}
                                <path d="M70 95c0 0 10 5 20 0" strokeWidth="5" />
                                <path d="M110 95c0 0 10 5 20 0" strokeWidth="5" />
                                {/* Mouth */}
                                <path d="M75 130c10-10 40-10 50 0" strokeWidth="5" />
                            </g>

                            {/* Thought Bubbles/Hearts (Optional decor) */}
                            <path d="M160 50c0 0 5-5 10 0s5 10 0 10-10-5-10-10z" fill="currentColor" stroke="none" className="text-gray-200" />
                            <path d="M175 65c0 0 4-4 8 0s4 8 0 8-8-4-8-8z" fill="currentColor" stroke="none" className="text-gray-200" />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">It feels so empty in here</h1>
                    <p className="text-gray-500 mb-8 text-lg">
                        Make a wish! Browse our categories and find something you love.
                    </p>
                    <Link
                        to="/products"
                        className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-base font-semibold shadow-lg shadow-pink-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 bg-pink-600 hover:bg-pink-700 border-pink-600"
                    >
                        <ArrowLeft size={20} />
                        Start Shopping
                    </Link>
                </div>


            </div>
        );
    }

    const handleAddToCart = async (item) => {
        // Fix: addToCart expects (productId, quantity, variant) - pass item._id directly
        await addToCart(item._id, 1);
    };

    return (
        <div className="container-custom py-4 sm:py-8 min-h-screen">
            <div className="flex items-end justify-between mb-6 sm:mb-8 border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">My Wishlist</h1>
                    <p className="text-gray-500 mt-1 text-sm sm:text-base">
                        {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved for later
                    </p>
                </div>
                {wishlist.length > 0 && (
                    <button
                        onClick={clearWishlist}
                        className="text-red-500 hover:text-red-600 text-sm font-medium hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors duration-200"
                    >
                        Clear All
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {wishlist.map(item => (
                    <div
                        key={item._id}
                        className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-row md:flex-col h-32 md:h-auto"
                    >
                        {/* Image - Responsive Layout */}
                        <div className="relative w-28 sm:w-32 md:w-full aspect-[4/5] md:aspect-square shrink-0 bg-gray-50">
                            <Link to={`/products/${item.slug}`} className="block h-full w-full">
                                {item.primaryImage ? (
                                    <img
                                        src={item.primaryImage}
                                        alt={item.name}
                                        className="w-full h-full object-cover md:group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/200x200/e2e8f0/475569?text=${encodeURIComponent(item.name?.slice(0, 10) || 'Product')}`; }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <ShoppingCart size={24} className="opacity-20" />
                                    </div>
                                )}
                            </Link>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                            <div>
                                <Link to={`/products/${item.slug}`} className="block">
                                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight line-clamp-2 mb-1 group-hover:text-primary-600 transition-colors">
                                        {item.name}
                                    </h3>
                                </Link>

                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="font-bold text-gray-900 text-base sm:text-lg">
                                        {formatPrice(item.price)}
                                    </span>
                                    {item.compareAtPrice && (
                                        <span className="text-xs text-gray-400 line-through hidden sm:inline-block">
                                            {formatPrice(item.compareAtPrice)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 items-center mt-auto">
                                <button
                                    onClick={() => handleAddToCart(item)}
                                    className="flex-1 btn-primary py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                    <ShoppingCart size={14} className="sm:w-4 sm:h-4" />
                                    <span className="font-medium">Add</span>
                                </button>
                                <button
                                    onClick={() => removeFromWishlist(item._id)}
                                    className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Remove"
                                >
                                    <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Wishlist;

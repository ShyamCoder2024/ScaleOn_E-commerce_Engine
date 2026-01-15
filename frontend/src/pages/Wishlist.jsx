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

    const handleAddToCart = (item) => {
        addToCart({
            _id: item._id,
            name: item.name,
            slug: item.slug,
            price: item.price,
            primaryImage: item.primaryImage
        }, 1);
    };

    return (
        <div className="container-custom py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
                    <p className="text-gray-500">{wishlist.length} item{wishlist.length !== 1 ? 's' : ''}</p>
                </div>
                {wishlist.length > 0 && (
                    <button
                        onClick={clearWishlist}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                        Clear All
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {wishlist.map(item => (
                    <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
                        {/* Image */}
                        <Link to={`/products/${item.slug}`} className="block aspect-square overflow-hidden bg-gray-100">
                            {item.primaryImage ? (
                                <img
                                    src={item.primaryImage}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    No Image
                                </div>
                            )}
                        </Link>

                        {/* Info */}
                        <div className="p-4">
                            <Link to={`/products/${item.slug}`} className="block">
                                <h3 className="font-medium text-gray-900 line-clamp-2 mb-1 hover:text-primary-600">
                                    {item.name}
                                </h3>
                            </Link>

                            <div className="flex items-center gap-2 mb-3">
                                <span className="font-bold text-gray-900">{formatPrice(item.price)}</span>
                                {item.compareAtPrice && (
                                    <span className="text-sm text-gray-400 line-through">
                                        {formatPrice(item.compareAtPrice)}
                                    </span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAddToCart(item)}
                                    className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-1"
                                >
                                    <ShoppingCart size={16} />
                                    Add to Cart
                                </button>
                                <button
                                    onClick={() => removeFromWishlist(item._id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Remove from wishlist"
                                >
                                    <Trash2 size={18} />
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

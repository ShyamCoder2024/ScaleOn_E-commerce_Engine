import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldLock , ChevronLeft, ChevronRight, Search, Filter, CheckCircle, ThumbsUp, ShieldCheck, Headphones, Lock, Calendar, Truck, Clock, ExternalLink, Eye, Ban, ChevronDown } from "lucide-react";
import { useCart } from '../context/CartContext';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';

const Cart = () => {
    const { cart, totals, updateQuantity, removeItem, loading } = useCart();
    const { formatPrice } = useConfig();
    const { isAuthenticated } = useAuth();

    if (loading) {
        return (
            <div className="container-custom py-8">
                <h1 className="text-2xl font-bold mb-8">Shopping Cart</h1>
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        {[...Array(3)].map((_, idx) => (
                            <div key={idx} className="card p-4 flex gap-4">
                                <div className="skeleton w-24 h-24 rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <div className="skeleton h-5 w-3/4" />
                                    <div className="skeleton h-4 w-1/2" />
                                    <div className="skeleton h-6 w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="card p-6 h-fit skeleton h-64" />
                </div>
            </div>
        );
    }

    if (!cart.items || cart.items.length === 0) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50/50">
                <div className="max-w-md mx-auto text-center px-4">
                    <div className="mb-6 relative inline-block">
                        <div className="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-20" />
                        <div className="relative bg-white p-5 rounded-full shadow-lg">
                            <ShoppingBag size={48} className="text-primary-600" strokeWidth={1.5} />
                        </div>
                    </div>

                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h1>
                    <p className="text-gray-500 mb-6 text-sm md:text-base max-w-sm mx-auto">
                        Looks like you haven't added anything to your cart yet.
                    </p>

                    <Link
                        to="/products"
                        className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold shadow-lg shadow-primary-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                    >
                        Start Shopping
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50/50 min-h-screen pb-20">
            <div className="container-custom py-6 md:py-10">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                        Shopping Cart <span className="text-gray-500 text-base font-medium ml-1">({totals.itemCount})</span>
                    </h1>
                </div>

                <div className="grid lg:grid-cols-12 gap-6 lg:gap-10">
                    {/* Cart Items List */}
                    <div className="lg:col-span-8 space-y-4">
                        {cart.items.map(item => (
                            <div key={item._id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 relative">
                                <div className="flex gap-3">
                                    {/* Product Image - Compact */}
                                    <Link
                                        to={`/products/${item.product?.slug || item.productId}`}
                                        className="shrink-0 w-20 h-20 rounded-md bg-gray-100 border border-gray-100 overflow-hidden"
                                    >
                                        <img
                                            src={item.image || item.product?.primaryImage || 'https://placehold.co/200x200/e2e8f0/475569?text=No+Image'}
                                            alt={item.productName || item.product?.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </Link>

                                    {/* Content Column */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="min-w-0 pr-6">
                                                <Link
                                                    to={`/products/${item.product?.slug || item.productId}`}
                                                    className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug"
                                                >
                                                    {item.productName || item.product?.name}
                                                </Link>

                                                {/* Variant Badge - Tiny */}
                                                {(item.variant || item.product?.category) && (
                                                    <div className="mt-1">
                                                        <span className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 inline-block truncate max-w-full">
                                                            {item.variant ? Object.values(item.variant.options || {}).join(' / ') : 'Item'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Delete Button - Absolute Top Right */}
                                            <button
                                                onClick={() => removeItem(item._id)}
                                                className="absolute top-0 right-0 text-gray-400 hover:text-red-500 p-1"
                                                aria-label="Remove"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {/* Bottom Row: Price + Compact Counter */}
                                        <div className="flex items-end justify-between mt-2">
                                            <span className="text-base font-bold text-gray-900">
                                                {formatPrice(item.priceAtAdd || item.product?.price || 0)}
                                            </span>

                                            {/* Micro-Counter */}
                                            <div className="flex items-center bg-gray-50 rounded border border-gray-200 h-7">
                                                <button
                                                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                                    className="w-7 h-full flex items-center justify-center text-gray-500 hover:text-gray-900 active:scale-95 disabled:opacity-30"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <Minus size={12} />
                                                </button>
                                                <div className="w-8 text-center text-xs font-bold text-gray-900 tabular-nums border-x border-gray-200/50 h-full flex items-center justify-center bg-white">
                                                    {item.quantity}
                                                </div>
                                                <button
                                                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                                    className="w-7 h-full flex items-center justify-center text-gray-500 hover:text-gray-900 active:scale-95"
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-start pt-2">
                            <Link
                                to="/products"
                                className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700 text-sm font-semibold group"
                            >
                                <ArrowRight size={16} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                                Continue Shopping
                            </Link>
                        </div>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-20">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-500 text-sm">
                                    <span>Subtotal</span>
                                    <span className="font-medium text-gray-900">{formatPrice(totals.subtotal)}</span>
                                </div>

                                {totals.discountAmount > 0 && (
                                    <div className="flex justify-between text-emerald-600 text-sm">
                                        <span>Discount</span>
                                        <span className="font-medium">-{formatPrice(totals.discountAmount)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-gray-500 text-sm">
                                    <span>Shipping</span>
                                    <span className="font-medium text-gray-900">
                                        {totals.shippingCost > 0 ? formatPrice(totals.shippingCost) : <span className="text-emerald-600">Free</span>}
                                    </span>
                                </div>

                                {totals.taxAmount > 0 && (
                                    <div className="flex justify-between text-gray-500 text-sm">
                                        <span>Tax</span>
                                        <span className="font-medium text-gray-900">{formatPrice(totals.taxAmount)}</span>
                                    </div>
                                )}

                                <div className="border-t border-gray-100 pt-3 mt-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm text-gray-900 font-medium">Total</span>
                                        <span className="text-xl font-bold text-gray-900 tracking-tight">{formatPrice(totals.total)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Checkout Actions */}
                            {isAuthenticated ? (
                                <Link
                                    to="/checkout"
                                    className="btn-primary w-full py-3 text-base font-bold flex items-center justify-center gap-2 shadow-md shadow-primary-600/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98] rounded-lg"
                                >
                                    Proceed to Checkout
                                    <ArrowRight size={18} />
                                </Link>
                            ) : (
                                <div className="space-y-3">
                                    <Link
                                        to="/login"
                                        state={{ from: { pathname: '/checkout' } }}
                                        className="btn-primary w-full py-3 text-base font-bold flex items-center justify-center gap-2 shadow-md shadow-primary-600/20 rounded-lg"
                                    >
                                        Login to Checkout
                                        <ArrowRight size={18} />
                                    </Link>
                                    <div className="text-center">
                                        <span className="text-xs text-gray-500">New customer? </span>
                                        <Link to="/register" className="text-xs text-primary-600 font-bold hover:underline">
                                            Create Account
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Security Badge */}
                            <div className="mt-6 pt-4 border-t border-gray-100/50">
                                <div className="flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-50/50 py-2 rounded-lg">
                                    <Lock size={14} />
                                    <span className="text-xs font-semibold">Secure SSL Checkout</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;

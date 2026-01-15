import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
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
            <div className="container-custom py-8 min-h-[80vh] flex flex-col items-center justify-center">
                <div className="max-w-md mx-auto text-center flex flex-col items-center">
                    {/* Sad Cart Sticker */}
                    <div className="relative w-48 h-48 mb-6 animate-in fade-in zoom-in duration-500">
                        <svg viewBox="0 0 200 200" className="w-full h-full text-gray-900" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                            {/* Cart Body */}
                            <path d="M40 40h24l22 110h88l18-80H75" />
                            {/* Wheels */}
                            <circle cx="90" cy="170" r="12" fill="currentColor" stroke="none" />
                            <circle cx="150" cy="170" r="12" fill="currentColor" stroke="none" />
                            {/* Sad Face */}
                            <g transform="translate(10, -10)">
                                <circle cx="110" cy="90" r="6" fill="currentColor" stroke="none" />
                                <circle cx="140" cy="90" r="6" fill="currentColor" stroke="none" />
                                <path d="M110 120 C 110 120, 125 105, 140 120" strokeWidth="6" />
                            </g>
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Your cart is empty.</h1>
                    <p className="text-gray-500 mb-8 text-lg">
                        Looks like you haven't added anything to your cart yet.
                    </p>
                    <Link
                        to="/products"
                        className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-base font-semibold shadow-lg shadow-gray-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                    >
                        Start Shopping
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-[80vh]">
            <div className="container-custom py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-8">
                    Shopping Cart ({totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'})
                </h1>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {cart.items.map(item => (
                            <div key={item._id} className="card p-4 sm:p-6">
                                <div className="flex gap-4">
                                    {/* Image */}
                                    <Link
                                        to={`/products/${item.product?.slug || item.productId}`}
                                        className="shrink-0"
                                    >
                                        <img
                                            src={item.image || item.product?.primaryImage || 'https://placehold.co/200x200/e2e8f0/475569?text=No+Image'}
                                            alt={item.productName || item.product?.name}
                                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                                        />
                                    </Link>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between gap-4">
                                            <div className="min-w-0">
                                                <Link
                                                    to={`/products/${item.product?.slug || item.productId}`}
                                                    className="font-medium text-gray-900 hover:text-primary-600 line-clamp-2"
                                                >
                                                    {item.productName || item.product?.name}
                                                </Link>

                                                {/* Variant Info */}
                                                {item.variant && (
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {Object.entries(item.variant.options || {}).map(([key, value]) => (
                                                            <span key={key}>{key}: {value} </span>
                                                        ))}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Remove Button */}
                                            <button
                                                onClick={() => removeItem(item._id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                title="Remove item"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        {/* Price & Quantity */}
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900">
                                                    {formatPrice(item.priceAtAdd || item.product?.price || 0)}
                                                </span>
                                                {item.quantity > 1 && (
                                                    <span className="text-sm text-gray-500">
                                                        × {item.quantity} = {formatPrice((item.priceAtAdd || item.product?.price || 0) * item.quantity)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center border rounded-lg">
                                                <button
                                                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                                    className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                                    className="p-2 hover:bg-gray-100 transition-colors"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Continue Shopping */}
                        <Link
                            to="/products"
                            className="inline-flex items-center gap-2 text-primary-600 hover:underline font-medium"
                        >
                            <ArrowRight size={18} className="rotate-180" />
                            Continue Shopping
                        </Link>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="card p-6 sticky top-24">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal ({totals.itemCount} items)</span>
                                    <span>{formatPrice(totals.subtotal)}</span>
                                </div>

                                {totals.discountAmount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>-{formatPrice(totals.discountAmount)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span>
                                        {totals.shippingCost > 0
                                            ? formatPrice(totals.shippingCost)
                                            : <span className="text-green-600">Free</span>
                                        }
                                    </span>
                                </div>

                                {totals.taxAmount > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>Tax</span>
                                        <span>{formatPrice(totals.taxAmount)}</span>
                                    </div>
                                )}

                                <div className="border-t pt-3">
                                    <div className="flex justify-between text-lg font-bold text-gray-900">
                                        <span>Total</span>
                                        <span>{formatPrice(totals.total)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Checkout Button */}
                            {isAuthenticated ? (
                                <Link
                                    to="/checkout"
                                    className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
                                >
                                    Proceed to Checkout
                                    <ArrowRight size={20} />
                                </Link>
                            ) : (
                                <div className="space-y-3">
                                    <Link
                                        to="/login"
                                        state={{ from: { pathname: '/checkout' } }}
                                        className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
                                    >
                                        Login to Checkout
                                        <ArrowRight size={20} />
                                    </Link>
                                    <p className="text-sm text-center text-gray-500">
                                        New customer?{' '}
                                        <Link to="/register" className="text-primary-600 hover:underline">
                                            Create an account
                                        </Link>
                                    </p>
                                </div>
                            )}

                            {/* Secure Payment Badge */}
                            <div className="mt-6 pt-6 border-t text-center">
                                <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                                    </svg>
                                    Secure checkout powered by SSL
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;

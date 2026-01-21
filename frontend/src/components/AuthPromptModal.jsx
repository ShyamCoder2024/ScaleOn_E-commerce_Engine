import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingBag, UserPlus, LogIn, Sparkles } from 'lucide-react';

/**
 * AuthPromptModal - Beautiful modal that prompts guests to sign up when trying to purchase
 * 
 * Features:
 * - Glassmorphism design with smooth animations
 * - Shows the product they were trying to buy
 * - Quick links to Login and Register
 * - Remembers intended action for post-login redirect
 * - Fully responsive for mobile
 */
const AuthPromptModal = ({
    isOpen,
    onClose,
    product = null,
    action = 'purchase',
    redirectAfterAuth = null
}) => {
    const navigate = useNavigate();
    const [isClosing, setIsClosing] = useState(false);

    // Handle escape key to close
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 200);
    };

    const handleNavigate = (path) => {
        // Save the intended action for after authentication
        if (redirectAfterAuth) {
            sessionStorage.setItem('postAuthRedirect', redirectAfterAuth);
        }
        if (product) {
            sessionStorage.setItem('pendingCartProduct', JSON.stringify({
                productId: product._id,
                name: product.name,
                image: product.images?.[0]?.url,
            }));
        }
        handleClose();
        navigate(path);
    };

    if (!isOpen) return null;

    const actionText = action === 'wishlist' ? 'save items to your wishlist' : 'add items to cart';
    const productImage = product?.images?.[0]?.url || product?.primaryImage;

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${isClosing ? 'animate-out fade-out duration-200' : 'animate-in fade-in duration-300'}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-prompt-title"
        >
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal Panel */}
            <div
                className={`relative w-full max-w-md transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>

                {/* Header Section with Gradient */}
                <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 px-6 pt-10 pb-12 text-center">
                    {/* Decorative Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/30" />
                        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-white/20" />
                    </div>

                    {/* Icon */}
                    <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-4 ring-4 ring-white/20">
                        <ShoppingBag className="w-8 h-8 text-white" />
                        <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-300 animate-pulse" />
                    </div>

                    <h2 id="auth-prompt-title" className="relative text-2xl font-bold text-white mb-2">
                        Sign in to Continue
                    </h2>
                    <p className="relative text-primary-100 text-sm max-w-xs mx-auto">
                        Create a free account to {actionText} and complete your purchase
                    </p>
                </div>

                {/* Product Preview (if available) */}
                {product && productImage && (
                    <div className="px-6 -mt-6 relative z-10">
                        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
                            <img
                                src={productImage}
                                alt={product.name}
                                className="w-16 h-16 rounded-xl object-cover bg-gray-100"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate text-sm">
                                    {product.name}
                                </p>
                                <p className="text-xs text-primary-600 font-medium mt-0.5">
                                    Ready to add to cart
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="p-6 space-y-3">
                    {/* Create Account - Primary CTA */}
                    <button
                        onClick={() => handleNavigate('/register')}
                        className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gray-900 text-white rounded-2xl font-bold text-base hover:bg-black transition-all shadow-lg shadow-gray-900/20 active:scale-[0.98]"
                    >
                        <UserPlus size={20} />
                        Create Free Account
                    </button>

                    {/* Sign In - Secondary CTA */}
                    <button
                        onClick={() => handleNavigate('/login')}
                        className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gray-100 text-gray-900 rounded-2xl font-semibold text-base hover:bg-gray-200 transition-all active:scale-[0.98]"
                    >
                        <LogIn size={20} />
                        Sign In
                    </button>

                    {/* Continue Browsing */}
                    <button
                        onClick={handleClose}
                        className="w-full py-3 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                    >
                        Continue Browsing
                    </button>
                </div>

                {/* Trust Badges */}
                <div className="px-6 pb-6">
                    <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Secure
                        </span>
                        <span>•</span>
                        <span>Free to join</span>
                        <span>•</span>
                        <span>Quick checkout</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPromptModal;

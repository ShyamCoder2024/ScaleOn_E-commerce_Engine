import { createContext, useContext, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const WishlistContext = createContext(null);

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};

// Helper function to get initial wishlist from localStorage
const getInitialWishlist = () => {
    try {
        const stored = localStorage.getItem('wishlist');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    } catch (e) {
        console.error('Failed to parse wishlist from localStorage:', e);
    }
    return [];
};

export const WishlistProvider = ({ children }) => {
    // Initialize state directly from localStorage to prevent race condition
    const [wishlist, setWishlist] = useState(getInitialWishlist);
    const isInitialized = useRef(false);

    // Save wishlist to localStorage whenever it changes (but skip first render)
    useEffect(() => {
        if (isInitialized.current) {
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
        } else {
            isInitialized.current = true;
        }
    }, [wishlist]);

    const addToWishlist = (product) => {
        const exists = wishlist.find(item => item._id === product._id);
        if (!exists) {
            setWishlist(prev => [...prev, {
                _id: product._id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                compareAtPrice: product.compareAtPrice,
                primaryImage: product.primaryImage || product.images?.[0]?.url,
                addedAt: new Date().toISOString()
            }]);
            return true;
        }
        return false;
    };

    const removeFromWishlist = (productId) => {
        setWishlist(prev => prev.filter(item => item._id !== productId));
    };

    const isInWishlist = (productId) => {
        return wishlist.some(item => item._id === productId);
    };

    const toggleWishlist = (product) => {
        if (isInWishlist(product._id)) {
            removeFromWishlist(product._id);
            toast.success('Removed from wishlist');
            return false;
        } else {
            const added = addToWishlist(product);
            if (added) {
                toast.success('Added to your wishlist');
            }
            return true;
        }
    };

    const clearWishlist = () => {
        setWishlist([]);
    };

    const value = {
        wishlist,
        wishlistCount: wishlist.length,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
        clearWishlist
    };

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
};

export default WishlistContext;

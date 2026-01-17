import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

const CART_CACHE_KEY = 'app_cart_cache';

// ===========================================
// ENTERPRISE-GRADE CART CACHE MANAGEMENT
// ===========================================

// Default empty cart state
const EMPTY_CART = { items: [] };
const EMPTY_TOTALS = {
    itemCount: 0,
    subtotal: 0,
    discountCode: null,
    discountAmount: 0,
    shippingCost: 0,
    taxAmount: 0,
    total: 0,
};

// Get cached cart (for instant UI)
const getCachedCart = () => {
    try {
        const cached = localStorage.getItem(CART_CACHE_KEY);
        if (cached) {
            const data = JSON.parse(cached);
            // Validate cache structure
            if (data && data.cart && Array.isArray(data.cart.items)) {
                return data;
            }
        }
    } catch (e) {
        console.error('Cart cache read error:', e);
    }
    return null;
};

// Save cart to cache
const setCachedCart = (cart, totals) => {
    try {
        localStorage.setItem(CART_CACHE_KEY, JSON.stringify({ cart, totals }));
    } catch (e) {
        console.error('Cart cache write error:', e);
    }
};

// Clear cart cache
const clearCartCache = () => {
    try {
        localStorage.removeItem(CART_CACHE_KEY);
    } catch (e) {
        console.error('Cart cache clear error:', e);
    }
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const cachedData = getCachedCart();

    const [cart, setCart] = useState(cachedData?.cart || EMPTY_CART);
    const [totals, setTotals] = useState(cachedData?.totals || EMPTY_TOTALS);
    const [loading, setLoading] = useState(false); // Start as false - we have cache/defaults

    // Enterprise-grade fetch state management
    const fetchStateRef = useRef({
        isFetching: false,
        abortController: null,
        fetchCount: 0,
        lastUserId: null,
    });

    // Update totals from API response
    const updateTotalsFromResponse = useCallback((data) => {
        const newTotals = {
            itemCount: data.itemCount || data.cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
            subtotal: data.subtotal || 0,
            discountCode: data.discountCode || data.cart?.discountCode,
            discountAmount: data.discountAmount || data.cart?.discountAmount || 0,
            shippingCost: data.shippingCost || 0,
            taxAmount: data.taxAmount || 0,
            total: data.total || 0,
        };
        setTotals(newTotals);
        return newTotals;
    }, []);

    // Fetch cart with race condition protection
    const fetchCart = useCallback(async (forceRefresh = false) => {
        const fetchState = fetchStateRef.current;

        // Skip if already fetching (prevents duplicate calls on rapid refresh)
        if (fetchState.isFetching && !forceRefresh) {
            return;
        }

        // Cancel any in-flight request
        if (fetchState.abortController) {
            fetchState.abortController.abort();
        }

        // Create new abort controller
        const abortController = new AbortController();
        fetchState.abortController = abortController;
        fetchState.isFetching = true;
        fetchState.fetchCount++;
        const currentCount = fetchState.fetchCount;

        try {
            const response = await cartAPI.getCart();

            // Verify this is still the latest fetch
            if (currentCount !== fetchStateRef.current.fetchCount) {
                return;
            }

            const data = response.data.data;
            const newCart = data.cart || EMPTY_CART;
            const newTotals = {
                itemCount: data.itemCount || newCart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
                subtotal: data.subtotal || 0,
                discountCode: data.discountCode || newCart.discountCode,
                discountAmount: data.discountAmount || newCart.discountAmount || 0,
                shippingCost: data.shippingCost || 0,
                taxAmount: data.taxAmount || 0,
                total: data.total || 0,
            };

            setCart(newCart);
            setTotals(newTotals);
            setCachedCart(newCart, newTotals);

        } catch (err) {
            // Ignore aborted requests
            if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
                return;
            }

            // Verify this is still the latest fetch
            if (currentCount !== fetchStateRef.current.fetchCount) {
                return;
            }

            console.error('Failed to fetch cart:', err);
            // CRITICAL: Keep existing cart on error - don't reset

        } finally {
            if (currentCount === fetchStateRef.current.fetchCount) {
                fetchState.isFetching = false;
                setLoading(false);
            }
        }
    }, []);

    // Handle user changes (login/logout)
    useEffect(() => {
        const currentUserId = user?._id;
        const prevUserId = fetchStateRef.current.lastUserId;

        // Check if user actually changed
        const userChanged = currentUserId !== prevUserId;
        fetchStateRef.current.lastUserId = currentUserId;

        // On logout - clear cart
        if (prevUserId && !currentUserId) {
            clearCartCache();
            setCart(EMPTY_CART);
            setTotals(EMPTY_TOTALS);
            return;
        }

        // On login or initial load with user - fetch cart
        if (currentUserId && (userChanged || !cachedData)) {
            fetchCart();
        }

        // Cleanup on unmount
        return () => {
            if (fetchStateRef.current.abortController) {
                fetchStateRef.current.abortController.abort();
            }
        };
    }, [user?._id, fetchCart]);

    const addToCart = async (productId, quantity = 1, variant = null) => {
        try {
            const response = await cartAPI.addItem(productId, quantity, variant);
            const data = response.data.data;
            const newCart = data.cart || EMPTY_CART;
            setCart(newCart);
            const newTotals = updateTotalsFromResponse(data);
            setCachedCart(newCart, newTotals);
            toast.success('Added to cart');
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to add item';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const updateQuantity = async (itemId, quantity) => {
        const prevCart = { ...cart };
        const prevTotals = { ...totals };

        // Optimistic update
        setCart(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item._id === itemId ? { ...item, quantity } : item
            ).filter(item => item.quantity > 0)
        }));

        try {
            const response = await cartAPI.updateItem(itemId, quantity);
            const data = response.data.data;
            const newCart = data.cart || EMPTY_CART;
            setCart(newCart);
            const newTotals = updateTotalsFromResponse(data);
            setCachedCart(newCart, newTotals);
            return { success: true };
        } catch (err) {
            // Revert on error
            setCart(prevCart);
            setTotals(prevTotals);
            const message = err.response?.data?.message || 'Failed to update cart';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const removeItem = async (itemId) => {
        const prevCart = { ...cart };
        const prevTotals = { ...totals };

        // Optimistic update
        setCart(prev => ({
            ...prev,
            items: prev.items.filter(item => item._id !== itemId)
        }));

        try {
            const response = await cartAPI.removeItem(itemId);
            const data = response.data.data;
            const newCart = data.cart || EMPTY_CART;
            setCart(newCart);
            const newTotals = updateTotalsFromResponse(data);
            setCachedCart(newCart, newTotals);
            toast.success('Item removed');
            return { success: true };
        } catch (err) {
            // Revert on error
            setCart(prevCart);
            setTotals(prevTotals);
            const message = err.response?.data?.message || 'Failed to remove item';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const clearCart = async () => {
        try {
            await cartAPI.clearCart();
            setCart(EMPTY_CART);
            setTotals(EMPTY_TOTALS);
            setCachedCart(EMPTY_CART, EMPTY_TOTALS);
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to clear cart';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const applyDiscount = async (code) => {
        try {
            const response = await cartAPI.applyDiscount(code);
            const data = response.data.data;
            const newCart = data.cart || EMPTY_CART;
            setCart(newCart);
            const newTotals = updateTotalsFromResponse(data);
            setCachedCart(newCart, newTotals);
            toast.success('Discount applied');
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || 'Invalid discount code';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const removeDiscount = async () => {
        try {
            const response = await cartAPI.removeDiscount();
            const data = response.data.data;
            const newCart = data.cart || EMPTY_CART;
            setCart(newCart);
            const newTotals = updateTotalsFromResponse(data);
            setCachedCart(newCart, newTotals);
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to remove discount';
            return { success: false, error: message };
        }
    };

    const getCartSummary = async () => {
        try {
            const response = await cartAPI.getSummary();
            return response.data.data;
        } catch (err) {
            return { itemCount: 0, subtotal: 0 };
        }
    };

    const refetchCart = useCallback(async () => {
        setLoading(true);
        await fetchCart(true);
    }, [fetchCart]);

    const value = {
        cart,
        totals,
        loading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        applyDiscount,
        removeDiscount,
        getCartSummary,
        refetchCart,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export default CartContext;

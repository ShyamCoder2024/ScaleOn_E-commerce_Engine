import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

const CART_CACHE_KEY = 'app_cart_cache';

// Get cached cart (for instant UI)
const getCachedCart = () => {
    try {
        const cached = localStorage.getItem(CART_CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
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

    const [cart, setCart] = useState(cachedData?.cart || { items: [] });
    const [totals, setTotals] = useState(cachedData?.totals || {
        itemCount: 0,
        subtotal: 0,
        discountCode: null,
        discountAmount: 0,
        shippingCost: 0,
        taxAmount: 0,
        total: 0,
    });
    const [loading, setLoading] = useState(!cachedData);

    // Track previous user ID to detect actual login/logout
    const prevUserIdRef = useRef(user?._id);
    const hasFetched = useRef(!!cachedData);

    // Only fetch when user actually changes (login/logout), not on every re-render
    useEffect(() => {
        const currentUserId = user?._id;
        const prevUserId = prevUserIdRef.current;

        // Check if user actually changed
        const userChanged = currentUserId !== prevUserId;
        prevUserIdRef.current = currentUserId;

        // Skip if no change and we already fetched
        if (!userChanged && hasFetched.current) {
            return;
        }

        // Clear cache on logout
        if (prevUserId && !currentUserId) {
            clearCartCache();
            setCart({ items: [] });
            setTotals({
                itemCount: 0,
                subtotal: 0,
                discountCode: null,
                discountAmount: 0,
                shippingCost: 0,
                taxAmount: 0,
                total: 0,
            });
            setLoading(false);
            hasFetched.current = true;
            return;
        }

        // Fetch fresh cart
        const fetchCartData = async () => {
            try {
                const response = await cartAPI.getCart();
                const data = response.data.data;
                const newCart = data.cart || { items: [] };
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
                hasFetched.current = true;
            } catch (err) {
                console.error('Failed to fetch cart:', err);
                setCart({ items: [] });
            } finally {
                setLoading(false);
            }
        };

        fetchCartData();
    }, [user?._id]);

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

    const addToCart = async (productId, quantity = 1, variant = null) => {
        try {
            const response = await cartAPI.addItem(productId, quantity, variant);
            const data = response.data.data;
            const newCart = data.cart || { items: [] };
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
            const newCart = data.cart || { items: [] };
            setCart(newCart);
            const newTotals = updateTotalsFromResponse(data);
            setCachedCart(newCart, newTotals);
            return { success: true };
        } catch (err) {
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
            const newCart = data.cart || { items: [] };
            setCart(newCart);
            const newTotals = updateTotalsFromResponse(data);
            setCachedCart(newCart, newTotals);
            toast.success('Item removed');
            return { success: true };
        } catch (err) {
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
            const emptyCart = { items: [] };
            const emptyTotals = {
                itemCount: 0,
                subtotal: 0,
                discountCode: null,
                discountAmount: 0,
                shippingCost: 0,
                taxAmount: 0,
                total: 0,
            };
            setCart(emptyCart);
            setTotals(emptyTotals);
            setCachedCart(emptyCart, emptyTotals);
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
            const newCart = data.cart || { items: [] };
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
            const newCart = data.cart || { items: [] };
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

    const refetchCart = async () => {
        try {
            const response = await cartAPI.getCart();
            const data = response.data.data;
            const newCart = data.cart || { items: [] };
            setCart(newCart);
            const newTotals = updateTotalsFromResponse(data);
            setCachedCart(newCart, newTotals);
        } catch (err) {
            console.error('Failed to refetch cart:', err);
        }
    };

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

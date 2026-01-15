import { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [cart, setCart] = useState({ items: [] });
    const [totals, setTotals] = useState({
        itemCount: 0,
        subtotal: 0,
        discountCode: null,
        discountAmount: 0,
        shippingCost: 0,
        taxAmount: 0,
        total: 0,
    });
    const [loading, setLoading] = useState(true);

    // Fetch cart on mount and when auth state changes
    useEffect(() => {
        fetchCart();
    }, [isAuthenticated]);

    const updateTotalsFromResponse = (data) => {
        setTotals({
            itemCount: data.itemCount || data.cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
            subtotal: data.subtotal || 0,
            discountCode: data.discountCode || data.cart?.discountCode,
            discountAmount: data.discountAmount || data.cart?.discountAmount || 0,
            shippingCost: data.shippingCost || 0,
            taxAmount: data.taxAmount || 0,
            total: data.total || 0,
        });
    };

    const fetchCart = async () => {
        try {
            const response = await cartAPI.getCart();
            const data = response.data.data;
            setCart(data.cart || { items: [] });
            updateTotalsFromResponse(data);
        } catch (err) {
            console.error('Failed to fetch cart:', err);
            setCart({ items: [] });
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async (productId, quantity = 1, variant = null) => {
        try {
            const response = await cartAPI.addItem(productId, quantity, variant);
            const data = response.data.data;
            setCart(data.cart || { items: [] });
            updateTotalsFromResponse(data);
            toast.success('Added to cart');
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to add item';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const updateQuantity = async (itemId, quantity) => {
        // Optimistic update
        const prevCart = { ...cart };
        const prevTotals = { ...totals };

        setCart(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item._id === itemId ? { ...item, quantity } : item
            ).filter(item => item.quantity > 0)
        }));

        try {
            const response = await cartAPI.updateItem(itemId, quantity);
            const data = response.data.data;
            setCart(data.cart || { items: [] });
            updateTotalsFromResponse(data);
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
        // Optimistic update
        const prevCart = { ...cart };
        const prevTotals = { ...totals };

        setCart(prev => ({
            ...prev,
            items: prev.items.filter(item => item._id !== itemId)
        }));

        try {
            const response = await cartAPI.removeItem(itemId);
            const data = response.data.data;
            setCart(data.cart || { items: [] });
            updateTotalsFromResponse(data);
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
            setCart(data.cart || { items: [] });
            updateTotalsFromResponse(data);
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
            setCart(data.cart || { items: [] });
            updateTotalsFromResponse(data);
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
        refetchCart: fetchCart,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export default CartContext;

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is logged in on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const response = await authAPI.getMe();
            setUser(response.data.data.user);
        } catch (err) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setError(null);
            const response = await authAPI.login({ email, password });
            const { user, accessToken } = response.data.data;

            localStorage.setItem('token', accessToken);
            setUser(user);

            return { success: true, user };
        } catch (err) {
            const message = err.response?.data?.message || 'Login failed';
            setError(message);
            return { success: false, error: message };
        }
    };

    const register = async (data) => {
        try {
            setError(null);
            const response = await authAPI.register(data);
            const { user, accessToken, requiresVerification } = response.data.data;

            localStorage.setItem('token', accessToken);
            setUser(user);

            return { success: true, user, requiresVerification };
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed';
            setError(message);
            return { success: false, error: message };
        }
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            setUser(null);
        }
    };

    const updateProfile = async (data) => {
        try {
            const response = await authAPI.updateProfile(data);
            setUser(response.data.data.user);
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || 'Update failed';
            return { success: false, error: message };
        }
    };

    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const isSuperAdmin = user?.role === 'super_admin';

    const value = {
        user,
        loading,
        error,
        isAuthenticated,
        isAdmin,
        isSuperAdmin,
        login,
        register,
        logout,
        updateProfile,
        setUser,
        refetchUser: fetchUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;

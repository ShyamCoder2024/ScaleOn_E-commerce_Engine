import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const USER_CACHE_KEY = 'app_user_cache';

// Get cached user from localStorage (instant)
const getCachedUser = () => {
    try {
        const cached = localStorage.getItem(USER_CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (e) {
        console.error('User cache read error:', e);
    }
    return null;
};

// Save user to cache
const setCachedUser = (user) => {
    try {
        if (user) {
            localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(USER_CACHE_KEY);
        }
    } catch (e) {
        console.error('User cache write error:', e);
    }
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    // Check token synchronously - instant auth state
    const hasToken = !!localStorage.getItem('token');
    const cachedUser = hasToken ? getCachedUser() : null;

    const [user, setUser] = useState(cachedUser);
    const [loading, setLoading] = useState(hasToken && !cachedUser); // Only loading if token exists but no cache
    const [error, setError] = useState(null);
    const isValidating = useRef(false);

    // Validate user with API in background (non-blocking)
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        // Skip if already validating
        if (isValidating.current) return;
        isValidating.current = true;

        const validateUser = async () => {
            try {
                const response = await authAPI.getMe();
                const freshUser = response.data.data.user;
                setUser(freshUser);
                setCachedUser(freshUser);
            } catch (err) {
                console.error('User validation failed:', err);
                // Only logout on auth errors (401/403)
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    await handleTokenRefresh();
                }
            } finally {
                setLoading(false);
                isValidating.current = false;
            }
        };

        validateUser();
    }, []);

    const handleTokenRefresh = async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            clearAuthState();
            return;
        }

        try {
            const refreshResponse = await authAPI.refresh(refreshToken);
            if (refreshResponse.data?.data?.accessToken) {
                localStorage.setItem('token', refreshResponse.data.data.accessToken);
                const retryResponse = await authAPI.getMe();
                const freshUser = retryResponse.data.data.user;
                setUser(freshUser);
                setCachedUser(freshUser);
            }
        } catch (refreshErr) {
            console.error('Token refresh failed:', refreshErr);
            clearAuthState();
        }
    };

    const clearAuthState = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setCachedUser(null);
        setUser(null);
    }, []);

    const login = async (email, password) => {
        try {
            setError(null);
            const response = await authAPI.login({ email, password });
            const { user, accessToken, refreshToken } = response.data.data;

            localStorage.setItem('token', accessToken);
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }
            setUser(user);
            setCachedUser(user);

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
            const { user, accessToken, refreshToken, requiresVerification } = response.data.data;

            localStorage.setItem('token', accessToken);
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }
            setUser(user);
            setCachedUser(user);

            return { success: true, user, requiresVerification };
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed';
            setError(message);
            return { success: false, error: message };
        }
    };

    const loginWithGoogle = async (userData) => {
        try {
            setError(null);
            const response = await authAPI.loginWithGoogle(userData);
            const { user, accessToken, refreshToken } = response.data.data;

            localStorage.setItem('token', accessToken);
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }
            setUser(user);
            setCachedUser(user);

            return { success: true, user, isNewUser: response.data.data.isNewUser };
        } catch (err) {
            const message = err.response?.data?.message || 'Google sign-in failed';
            setError(message);
            return { success: false, error: message };
        }
    };

    const loginWithApple = async (userData) => {
        try {
            setError(null);
            const response = await authAPI.loginWithApple(userData);
            const { user, accessToken, refreshToken } = response.data.data;

            localStorage.setItem('token', accessToken);
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }
            setUser(user);
            setCachedUser(user);

            return { success: true, user, isNewUser: response.data.data.isNewUser };
        } catch (err) {
            const message = err.response?.data?.message || 'Apple sign-in failed';
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
            clearAuthState();
        }
    };

    const updateProfile = async (data) => {
        try {
            const response = await authAPI.updateProfile(data);
            const updatedUser = response.data.data.user;
            setUser(updatedUser);
            setCachedUser(updatedUser);
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
        loginWithGoogle,
        loginWithApple,
        logout,
        updateProfile,
        setUser,
        refetchUser: async () => {
            try {
                const response = await authAPI.getMe();
                const freshUser = response.data.data.user;
                setUser(freshUser);
                setCachedUser(freshUser);
            } catch (err) {
                console.error('Refetch user failed:', err);
            }
        },
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;

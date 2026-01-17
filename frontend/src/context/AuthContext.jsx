import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const USER_CACHE_KEY = 'app_user_cache';

// ===========================================
// ENTERPRISE-GRADE USER CACHE MANAGEMENT
// ===========================================

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

    // Enterprise-grade fetch state management
    const fetchStateRef = useRef({
        isValidating: false,
        abortController: null,
        validationCount: 0,
    });

    // Clear auth state helper
    const clearAuthState = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setCachedUser(null);
        setUser(null);
    }, []);

    // Token refresh handler
    const handleTokenRefresh = useCallback(async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            clearAuthState();
            return false;
        }

        try {
            const refreshResponse = await authAPI.refresh(refreshToken);
            if (refreshResponse.data?.data?.accessToken) {
                localStorage.setItem('token', refreshResponse.data.data.accessToken);
                return true;
            }
        } catch (refreshErr) {
            console.error('Token refresh failed:', refreshErr);
            clearAuthState();
        }
        return false;
    }, [clearAuthState]);

    // Validate user with race condition protection
    const validateUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        const fetchState = fetchStateRef.current;

        // Skip if already validating (prevents duplicate calls on rapid refresh)
        if (fetchState.isValidating) {
            return;
        }

        // Cancel any in-flight request
        if (fetchState.abortController) {
            fetchState.abortController.abort();
        }

        // Create new abort controller
        const abortController = new AbortController();
        fetchState.abortController = abortController;
        fetchState.isValidating = true;
        fetchState.validationCount++;
        const currentCount = fetchState.validationCount;

        try {
            const response = await authAPI.getMe();

            // Verify this is still the latest validation
            if (currentCount !== fetchStateRef.current.validationCount) {
                return;
            }

            const freshUser = response.data.data.user;
            setUser(freshUser);
            setCachedUser(freshUser);
            setError(null);

        } catch (err) {
            // Ignore aborted requests
            if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
                return;
            }

            // Verify this is still the latest validation
            if (currentCount !== fetchStateRef.current.validationCount) {
                return;
            }

            console.error('User validation failed:', err);

            // Only clear auth on explicit auth errors (401/403)
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                // Try to refresh token first
                const refreshed = await handleTokenRefresh();
                if (refreshed) {
                    // Retry validation after refresh
                    try {
                        const retryResponse = await authAPI.getMe();
                        const freshUser = retryResponse.data.data.user;
                        setUser(freshUser);
                        setCachedUser(freshUser);
                    } catch (retryErr) {
                        clearAuthState();
                    }
                }
            }
            // CRITICAL: On network errors, keep existing cached user
            // This prevents logout on temporary connection issues

        } finally {
            if (currentCount === fetchStateRef.current.validationCount) {
                fetchState.isValidating = false;
                setLoading(false);
            }
        }
    }, [handleTokenRefresh, clearAuthState]);

    // Validate user on mount
    useEffect(() => {
        validateUser();

        // Cleanup on unmount
        return () => {
            if (fetchStateRef.current.abortController) {
                fetchStateRef.current.abortController.abort();
            }
        };
    }, []); // Empty deps - only run once on mount

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

    const refetchUser = useCallback(async () => {
        fetchStateRef.current.validationCount++; // Force new validation
        fetchStateRef.current.isValidating = false;
        await validateUser();
    }, [validateUser]);

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
        refetchUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;

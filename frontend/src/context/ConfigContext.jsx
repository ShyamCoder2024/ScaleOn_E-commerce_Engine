import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { configAPI } from '../services/api';

const ConfigContext = createContext(null);

const CONFIG_CACHE_KEY = 'app_config_cache';
const CONFIG_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// ===========================================
// ENTERPRISE-GRADE CACHE MANAGEMENT
// ===========================================

// Get cached config from localStorage (instant)
const getCachedConfig = () => {
    try {
        const cached = localStorage.getItem(CONFIG_CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            // Return cached data even if expired - we'll refresh in background
            if (data && timestamp) {
                return { data, isExpired: Date.now() - timestamp > CONFIG_CACHE_EXPIRY };
            }
        }
    } catch (e) {
        console.error('Config cache read error:', e);
    }
    return { data: null, isExpired: true };
};

// Save config to cache
const setCachedConfig = (data) => {
    try {
        localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch (e) {
        console.error('Config cache write error:', e);
    }
};

// Default config for instant UI render - COMPREHENSIVE defaults
const defaultConfig = {
    store: {
        name: 'Store',
        logo: null,
        description: '',
    },
    branding: {
        colors: {
            primary: '#3b82f6',
            secondary: '#1e40af',
        },
    },
    features: {
        // Default all features to TRUE to prevent UI from hiding elements
        wishlist: true,
        search: true,
        reviews: true,
        discounts: true,
        inventory: true,
        multiImages: true,
        variants: true,
        guestCheckout: true,
        featureCards: true,
        categories: true,
    },
    business: {
        currency: 'INR',
        currencySymbol: '₹',
        currencyPosition: 'before',
    },
    shipping: {},
    social: {},
    policies: {},
};

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
};

export const ConfigProvider = ({ children }) => {
    // Initialize from cache immediately (synchronous, instant)
    const { data: cachedData, isExpired } = getCachedConfig();

    // CRITICAL: Merge cached data with defaults to ensure all features exist
    const initialConfig = cachedData
        ? {
            ...defaultConfig,
            ...cachedData,
            features: { ...defaultConfig.features, ...(cachedData.features || {}) }
        }
        : defaultConfig;

    const [config, setConfig] = useState(initialConfig);
    const [loading, setLoading] = useState(false); // Start as false - we have defaults
    const [error, setError] = useState(null);

    // Track fetch state to prevent race conditions
    const fetchStateRef = useRef({
        isFetching: false,
        abortController: null,
        fetchCount: 0,
    });

    // Stable fetch function with race condition protection
    const fetchConfig = useCallback(async (forceRefresh = false) => {
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
        const currentFetchCount = fetchState.fetchCount;

        try {
            const response = await configAPI.getPublic();

            // Verify this is still the latest fetch (race condition protection)
            if (currentFetchCount !== fetchStateRef.current.fetchCount) {
                return; // A newer fetch was initiated, ignore this result
            }

            const freshData = response.data.data;

            // Merge with defaults to ensure completeness
            const mergedData = {
                ...defaultConfig,
                ...freshData,
                features: { ...defaultConfig.features, ...(freshData.features || {}) }
            };

            // Update state and cache
            setConfig(mergedData);
            setCachedConfig(mergedData);
            setError(null);

        } catch (err) {
            // Ignore aborted requests
            if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
                return;
            }

            // Verify this is still the latest fetch
            if (currentFetchCount !== fetchStateRef.current.fetchCount) {
                return;
            }

            console.error('Failed to fetch config:', err);
            setError(err);

            // CRITICAL: Keep existing config on error - don't reset to empty
            // This prevents the "zero products" issue on failed refresh

        } finally {
            if (currentFetchCount === fetchStateRef.current.fetchCount) {
                fetchState.isFetching = false;
                setLoading(false);
            }
        }
    }, []);

    // Initial fetch on mount
    useEffect(() => {
        // Only fetch if we don't have cached data or it's expired
        if (!cachedData || isExpired) {
            fetchConfig();
        }

        // Cleanup on unmount
        return () => {
            if (fetchStateRef.current.abortController) {
                fetchStateRef.current.abortController.abort();
            }
        };
    }, []); // Empty deps - only run once on mount

    // Format price based on config
    const formatPrice = useCallback((amount, showCurrency = true) => {
        const value = amount / 100;
        const formatted = value.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

        if (!showCurrency) return formatted;

        const { currencySymbol = '₹', currencyPosition = 'before' } = config.business || {};

        return currencyPosition === 'before'
            ? `${currencySymbol}${formatted}`
            : `${formatted} ${currencySymbol}`;
    }, [config.business]);

    // Check if a feature is enabled - SAFE default to true
    const isFeatureEnabled = useCallback((featureName) => {
        // If features object doesn't exist or feature not found, default to TRUE
        // This prevents UI elements from disappearing on config load failure
        if (!config.features) return true;
        return config.features[featureName] ?? true;
    }, [config.features]);

    const refetchConfig = useCallback(async () => {
        setLoading(true);
        await fetchConfig(true);
    }, [fetchConfig]);

    const value = {
        config,
        loading,
        error,
        formatPrice,
        isFeatureEnabled,
        storeName: config.store?.name || 'Store',
        logo: config.store?.logo,
        policies: config.policies,
        shipping: config.shipping,
        refetchConfig,
    };

    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    );
};

export default ConfigContext;

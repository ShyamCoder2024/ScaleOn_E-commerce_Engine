import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { configAPI } from '../services/api';

const ConfigContext = createContext(null);

const CONFIG_CACHE_KEY = 'app_config_cache';
const CONFIG_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

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

// Default config for instant UI render
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
    features: {},
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
    const [config, setConfig] = useState(cachedData || defaultConfig);
    const [loading, setLoading] = useState(!cachedData); // Only loading if no cache
    const hasFetched = useRef(false);

    useEffect(() => {
        // Skip if already fetched in this session
        if (hasFetched.current && !isExpired) return;

        // Fetch fresh config (background if we have cache)
        const fetchConfig = async () => {
            try {
                const response = await configAPI.getPublic();
                const freshData = response.data.data;

                // Only update if different to avoid re-renders
                setConfig(prev => {
                    if (JSON.stringify(prev) !== JSON.stringify(freshData)) {
                        setCachedConfig(freshData);
                        return freshData;
                    }
                    return prev;
                });
                hasFetched.current = true;
            } catch (err) {
                console.error('Failed to fetch config:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    // Format price based on config
    const formatPrice = (amount, showCurrency = true) => {
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
    };

    // Check if a feature is enabled
    const isFeatureEnabled = (featureName) => {
        return config.features?.[featureName] ?? false;
    };

    const refetchConfig = async () => {
        try {
            const response = await configAPI.getPublic();
            const freshData = response.data.data;
            setConfig(freshData);
            setCachedConfig(freshData);
        } catch (err) {
            console.error('Failed to refetch config:', err);
        }
    };

    const value = {
        config,
        loading,
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

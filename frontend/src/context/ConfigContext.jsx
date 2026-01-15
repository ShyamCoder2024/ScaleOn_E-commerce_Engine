import { createContext, useContext, useState, useEffect } from 'react';
import { configAPI } from '../services/api';

const ConfigContext = createContext(null);

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
};

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState({
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
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await configAPI.getPublic();
            setConfig(response.data.data);
        } catch (err) {
            console.error('Failed to fetch config:', err);
        } finally {
            setLoading(false);
        }
    };

    // Format price based on config
    const formatPrice = (amount, showCurrency = true) => {
        const value = amount / 100; // Convert from paise/cents
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

    const value = {
        config,
        loading,
        formatPrice,
        isFeatureEnabled,
        storeName: config.store?.name || 'Store',
        logo: config.store?.logo,
        refetchConfig: fetchConfig,
    };

    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    );
};

export default ConfigContext;

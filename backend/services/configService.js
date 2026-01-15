import { StoreConfig, FeatureFlag } from '../models/index.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const defaultConfig = require('../config/defaults.json');

/**
 * Configuration Service
 * Central service for loading, validating, and accessing configuration
 * Implements the core config-driven architecture principle
 */
class ConfigService {
    constructor() {
        this.cache = null;
        this.cacheExpiry = null;
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes cache
        this.features = null;
        this.featuresExpiry = null;
    }

    /**
     * Deep merge two objects
     */
    deepMerge(target, source) {
        const result = { ...target };

        for (const key of Object.keys(source)) {
            if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
                result[key] = this.deepMerge(target[key], source[key]);
            } else {
                result[key] = source[key];
            }
        }

        return result;
    }

    /**
     * Load all configuration from database
     */
    async loadConfig() {
        // Return cached config if still valid
        if (this.cache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
            return this.cache;
        }

        try {
            // Get all config from database
            const dbConfig = await StoreConfig.getAllAsObject();

            // Merge with defaults (database config takes precedence)
            this.cache = this.deepMerge(defaultConfig, dbConfig);
            this.cacheExpiry = Date.now() + this.cacheDuration;

            return this.cache;
        } catch (error) {
            console.error('Error loading config:', error);
            // Return defaults if database fails
            return defaultConfig;
        }
    }

    /**
     * Get complete configuration
     */
    async getConfig() {
        return this.loadConfig();
    }

    /**
     * Get a specific config value by key path (e.g., 'store.name')
     */
    async get(keyPath, defaultValue = null) {
        const config = await this.loadConfig();

        const keys = keyPath.split('.');
        let value = config;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }

        return value ?? defaultValue;
    }

    /**
     * Set a config value
     */
    async set(key, value, type = 'business_rule', updatedBy = null, description = '') {
        await StoreConfig.setValue(key, value, type, updatedBy, description);

        // Invalidate cache
        this.cache = null;
        this.cacheExpiry = null;

        return this.loadConfig();
    }

    /**
     * Set multiple config values at once
     */
    async setMultiple(configs, updatedBy = null) {
        await StoreConfig.setMultiple(configs, updatedBy);

        // Invalidate cache
        this.cache = null;
        this.cacheExpiry = null;

        return this.loadConfig();
    }

    /**
     * Get all feature flags
     */
    async getFeatures() {
        // Return cached features if still valid
        if (this.features && this.featuresExpiry && Date.now() < this.featuresExpiry) {
            return this.features;
        }

        try {
            this.features = await FeatureFlag.getAllFeatures();
            this.featuresExpiry = Date.now() + this.cacheDuration;

            // If no features exist, initialize defaults
            if (Object.keys(this.features).length === 0) {
                this.features = await FeatureFlag.initializeDefaults();
            }

            return this.features;
        } catch (error) {
            console.error('Error loading features:', error);
            // Return default feature states
            return defaultConfig.features || {};
        }
    }

    /**
     * Check if a feature is enabled
     */
    async isFeatureEnabled(featureName) {
        const features = await this.getFeatures();
        return features[featureName]?.enabled ?? false;
    }

    /**
     * Check multiple features at once
     */
    async checkFeatures(featureNames) {
        const features = await this.getFeatures();
        const result = {};

        for (const name of featureNames) {
            result[name] = features[name]?.enabled ?? false;
        }

        return result;
    }

    /**
     * Toggle a feature
     */
    async toggleFeature(featureName, enabled, updatedBy = null) {
        const result = await FeatureFlag.toggle(featureName, enabled, updatedBy);

        // Invalidate cache
        this.features = null;
        this.featuresExpiry = null;

        return result;
    }

    /**
     * Initialize default feature flags
     */
    async initializeFeatures() {
        return FeatureFlag.initializeDefaults();
    }

    /**
     * Get branding configuration
     */
    async getBranding() {
        const config = await this.loadConfig();
        return {
            storeName: config.store?.name || 'Store',
            logo: config.store?.logo || null,
            favicon: config.store?.favicon || null,
            colors: config.branding?.colors || {},
            fonts: config.branding?.fonts || {}
        };
    }

    /**
     * Get payment configuration
     */
    async getPaymentConfig() {
        const config = await this.loadConfig();
        return config.payment || {};
    }

    /**
     * Check if a payment provider is enabled
     */
    async isPaymentProviderEnabled(provider) {
        const paymentConfig = await this.getPaymentConfig();
        return paymentConfig.providers?.[provider]?.enabled ?? false;
    }

    /**
     * Get shipping configuration
     */
    async getShippingConfig() {
        const config = await this.loadConfig();
        return config.shipping || {};
    }

    /**
     * Calculate shipping cost based on configuration
     */
    async calculateShipping(subtotal) {
        const shipping = await this.getShippingConfig();

        switch (shipping.method) {
            case 'free':
                return 0;

            case 'flat':
                // Check free shipping threshold
                if (shipping.freeThreshold && subtotal >= shipping.freeThreshold) {
                    return 0;
                }
                return shipping.flatRate || 0;

            case 'tiered':
                // Find matching tier
                if (shipping.tiers && shipping.tiers.length > 0) {
                    const sortedTiers = [...shipping.tiers].sort((a, b) => b.minValue - a.minValue);
                    for (const tier of sortedTiers) {
                        if (subtotal >= tier.minValue) {
                            return tier.cost;
                        }
                    }
                }
                return shipping.flatRate || 0;

            default:
                return shipping.flatRate || 0;
        }
    }

    /**
     * Get tax configuration
     */
    async getTaxConfig() {
        const config = await this.loadConfig();
        return config.tax || {};
    }

    /**
     * Calculate tax based on configuration
     */
    async calculateTax(amount) {
        const tax = await this.getTaxConfig();

        if (!tax.enabled) {
            return 0;
        }

        switch (tax.method) {
            case 'flat_rate':
                return Math.round(amount * (tax.rate / 100));

            default:
                return 0;
        }
    }

    /**
     * Get business rules configuration
     */
    async getBusinessRules() {
        const config = await this.loadConfig();
        return config.business || {};
    }

    /**
     * Validate configuration against rules
     */
    validateConfig(key, value) {
        // Add validation rules as needed
        const validations = {
            'business.currency': (v) => typeof v === 'string' && v.length === 3,
            'business.minOrderValue': (v) => typeof v === 'number' && v >= 0,
            'shipping.flatRate': (v) => typeof v === 'number' && v >= 0,
            'tax.rate': (v) => typeof v === 'number' && v >= 0 && v <= 100
        };

        const validator = validations[key];
        if (validator && !validator(value)) {
            throw new Error(`Invalid value for ${key}`);
        }

        return true;
    }

    /**
     * Export all config (for backup)
     */
    async exportConfig() {
        const [config, features] = await Promise.all([
            StoreConfig.exportConfig(),
            FeatureFlag.find({}).select('-_id -__v -updatedBy')
        ]);

        return {
            config,
            features: features.map(f => ({
                featureName: f.featureName,
                enabled: f.enabled,
                description: f.description,
                config: f.config ? Object.fromEntries(f.config) : {}
            })),
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Import config (with validation)
     */
    async importConfig(data, updatedBy = null) {
        if (data.config && Array.isArray(data.config)) {
            await StoreConfig.importConfig(data.config, updatedBy);
        }

        if (data.features && Array.isArray(data.features)) {
            for (const feature of data.features) {
                if (feature.featureName) {
                    await FeatureFlag.findOneAndUpdate(
                        { featureName: feature.featureName },
                        {
                            $set: {
                                enabled: feature.enabled ?? false,
                                description: feature.description || '',
                                updatedBy,
                                updatedAt: new Date()
                            }
                        },
                        { upsert: true }
                    );
                }
            }
        }

        // Invalidate all caches
        this.cache = null;
        this.cacheExpiry = null;
        this.features = null;
        this.featuresExpiry = null;

        return this.exportConfig();
    }

    /**
     * Get public configuration (safe to expose to frontend)
     */
    async getPublicConfig() {
        const [config, features] = await Promise.all([
            this.loadConfig(),
            this.getFeatures()
        ]);

        return {
            store: {
                name: config.store?.name,
                logo: config.store?.logo,
                favicon: config.store?.favicon,
                description: config.store?.description
            },
            branding: config.branding,
            features: Object.fromEntries(
                Object.entries(features).map(([key, value]) => [key, value.enabled])
            ),
            business: {
                currency: config.business?.currency,
                currencySymbol: config.business?.currencySymbol,
                currencyPosition: config.business?.currencyPosition,
                minOrderValue: config.business?.minOrderValue
            },
            shipping: {
                freeThreshold: config.shipping?.freeThreshold
            },
            social: config.social,
            policies: config.policies
        };
    }
}

export default new ConfigService();

import mongoose from 'mongoose';

const featureFlagSchema = new mongoose.Schema({
    featureName: {
        type: String,
        required: [true, 'Feature name is required'],
        unique: true,
        trim: true
    },
    enabled: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        default: ''
    },
    // Feature-specific configuration
    config: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: new Map()
    },
    // Dependencies on other features
    dependsOn: [{
        type: String
    }],
    // Metadata
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
// Note: featureName index is automatically created by unique: true constraint
featureFlagSchema.index({ enabled: 1 });

// Default features
const DEFAULT_FEATURES = [
    {
        featureName: 'variants',
        enabled: false,
        description: 'Enable product variants (size, color, etc.)'
    },
    {
        featureName: 'inventory',
        enabled: true,
        description: 'Track product inventory and show stock levels'
    },
    {
        featureName: 'discounts',
        enabled: true,
        description: 'Enable discount codes and promotions'
    },
    {
        featureName: 'reviews',
        enabled: false,
        description: 'Allow customers to leave product reviews'
    },
    {
        featureName: 'wishlist',
        enabled: false,
        description: 'Allow customers to save products to wishlist'
    },
    {
        featureName: 'guestCheckout',
        enabled: false,
        description: 'Allow checkout without creating an account'
    },
    {
        featureName: 'emailNotifications',
        enabled: true,
        description: 'Send email notifications to customers'
    },
    {
        featureName: 'adminNotifications',
        enabled: true,
        description: 'Send notifications to admin on new orders'
    },
    {
        featureName: 'search',
        enabled: true,
        description: 'Enable product search functionality'
    },
    {
        featureName: 'categories',
        enabled: true,
        description: 'Organize products into categories'
    },
    {
        featureName: 'multiImages',
        enabled: true,
        description: 'Allow multiple images per product'
    },
    {
        featureName: 'cod',
        enabled: true,
        description: 'Cash on Delivery payment option'
    },
    {
        featureName: 'featureCards',
        enabled: true,
        description: 'Show feature cards carousel on homepage (Free Shipping, Secure Payment, etc.)'
    }
];

// Static method to check if feature is enabled
featureFlagSchema.statics.isEnabled = async function (featureName) {
    const feature = await this.findOne({ featureName });
    return feature ? feature.enabled : false;
};

// Static method to toggle feature
featureFlagSchema.statics.toggle = async function (featureName, enabled, updatedBy = null) {
    // Use upsert to create feature if it doesn't exist
    const feature = await this.findOneAndUpdate(
        { featureName },
        {
            $set: {
                enabled,
                updatedBy
            },
            $setOnInsert: {
                featureName,
                description: `${featureName} feature`
            }
        },
        { new: true, upsert: true }
    );

    return feature;
};

// Static method to get all features
featureFlagSchema.statics.getAllFeatures = async function () {
    const features = await this.find({}).sort({ featureName: 1 });
    const result = {};

    features.forEach(feature => {
        result[feature.featureName] = {
            enabled: feature.enabled,
            description: feature.description,
            config: feature.config ? Object.fromEntries(feature.config) : {}
        };
    });

    return result;
};

// Static method to get enabled features as array
featureFlagSchema.statics.getEnabledFeatures = async function () {
    const features = await this.find({ enabled: true }).select('featureName');
    return features.map(f => f.featureName);
};

// Static method to update feature config
featureFlagSchema.statics.updateConfig = async function (featureName, config, updatedBy = null) {
    const feature = await this.findOneAndUpdate(
        { featureName },
        {
            $set: {
                config: new Map(Object.entries(config)),
                updatedBy
            }
        },
        { new: true }
    );

    if (!feature) {
        throw new Error(`Feature '${featureName}' not found`);
    }

    return feature;
};

// Static method to initialize default features
featureFlagSchema.statics.initializeDefaults = async function () {
    const operations = DEFAULT_FEATURES.map(feature => ({
        updateOne: {
            filter: { featureName: feature.featureName },
            update: {
                $setOnInsert: {
                    featureName: feature.featureName,
                    enabled: feature.enabled,
                    description: feature.description,
                    config: new Map()
                }
            },
            upsert: true
        }
    }));

    await this.bulkWrite(operations);
    return this.getAllFeatures();
};

// Static method to check multiple features at once
featureFlagSchema.statics.checkFeatures = async function (featureNames) {
    const features = await this.find({
        featureName: { $in: featureNames }
    });

    const result = {};
    featureNames.forEach(name => {
        const feature = features.find(f => f.featureName === name);
        result[name] = feature ? feature.enabled : false;
    });

    return result;
};

const FeatureFlag = mongoose.model('FeatureFlag', featureFlagSchema);

export default FeatureFlag;

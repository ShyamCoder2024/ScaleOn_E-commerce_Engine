import mongoose from 'mongoose';
import { CONFIG_TYPES } from '../config/constants.js';

const storeConfigSchema = new mongoose.Schema({
    key: {
        type: String,
        required: [true, 'Configuration key is required'],
        unique: true,
        trim: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    type: {
        type: String,
        enum: Object.values(CONFIG_TYPES),
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    // Validation rules (optional)
    validation: {
        required: { type: Boolean, default: false },
        min: Number,
        max: Number,
        enum: [mongoose.Schema.Types.Mixed],
        pattern: String
    },
    // Metadata
    isSecret: {
        type: Boolean,
        default: false
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
// Note: key index is automatically created by unique: true constraint
storeConfigSchema.index({ type: 1 });

// Static method to get config value
storeConfigSchema.statics.getValue = async function (key, defaultValue = null) {
    const config = await this.findOne({ key });
    return config ? config.value : defaultValue;
};

// Static method to set config value
storeConfigSchema.statics.setValue = async function (key, value, type, updatedBy = null, description = '') {
    const config = await this.findOneAndUpdate(
        { key },
        {
            $set: {
                value,
                type,
                description,
                updatedBy,
                updatedAt: new Date()
            }
        },
        { upsert: true, new: true }
    );
    return config;
};

// Static method to get all config by type
storeConfigSchema.statics.getByType = async function (type) {
    const configs = await this.find({ type });
    const result = {};
    configs.forEach(config => {
        result[config.key] = config.value;
    });
    return result;
};

// Static method to get all config as object
storeConfigSchema.statics.getAllAsObject = async function () {
    const configs = await this.find({});
    const result = {};

    configs.forEach(config => {
        // Handle nested keys (e.g., "store.name" -> { store: { name: value } })
        const keys = config.key.split('.');
        let current = result;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = config.value;
    });

    return result;
};

// Static method to set multiple configs at once
storeConfigSchema.statics.setMultiple = async function (configs, updatedBy = null) {
    const operations = Object.entries(configs).map(([key, { value, type, description }]) => ({
        updateOne: {
            filter: { key },
            update: {
                $set: {
                    value,
                    type: type || CONFIG_TYPES.BUSINESS_RULE,
                    description: description || '',
                    updatedBy,
                    updatedAt: new Date()
                }
            },
            upsert: true
        }
    }));

    await this.bulkWrite(operations);
    return this.getAllAsObject();
};

// Static method to export all config
storeConfigSchema.statics.exportConfig = async function () {
    const configs = await this.find({}).select('-_id -__v -updatedBy');
    return configs.map(c => ({
        key: c.key,
        value: c.isSecret ? '***HIDDEN***' : c.value,
        type: c.type,
        description: c.description
    }));
};

// Static method to import config
storeConfigSchema.statics.importConfig = async function (configData, updatedBy = null) {
    const operations = configData
        .filter(c => c.value !== '***HIDDEN***') // Skip hidden values
        .map(config => ({
            updateOne: {
                filter: { key: config.key },
                update: {
                    $set: {
                        value: config.value,
                        type: config.type || CONFIG_TYPES.BUSINESS_RULE,
                        description: config.description || '',
                        updatedBy,
                        updatedAt: new Date()
                    }
                },
                upsert: true
            }
        }));

    await this.bulkWrite(operations);
    return this.getAllAsObject();
};

const StoreConfig = mongoose.model('StoreConfig', storeConfigSchema);

export default StoreConfig;

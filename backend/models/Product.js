import mongoose from 'mongoose';
import slugify from 'slugify';
import { PRODUCT_STATUS, VALIDATION } from '../config/constants.js';

const imageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    alt: {
        type: String,
        default: ''
    },
    isPrimary: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        default: 0
    }
}, { _id: true });

const variantOptionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    values: [{
        type: String,
        trim: true
    }]
}, { _id: false });

const variantSchema = new mongoose.Schema({
    sku: {
        type: String,
        trim: true
    },
    options: {
        type: Map,
        of: String
    },
    price: {
        type: Number,
        min: 0
    },
    compareAtPrice: {
        type: Number,
        min: 0
    },
    inventory: {
        type: Number,
        default: 0,
        min: 0
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    images: [{
        url: String,
        alt: String
    }]
}, { _id: true });

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [VALIDATION.PRODUCT_NAME_MAX_LENGTH, `Product name cannot exceed ${VALIDATION.PRODUCT_NAME_MAX_LENGTH} characters`]
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        maxlength: [VALIDATION.DESCRIPTION_MAX_LENGTH, `Description cannot exceed ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`]
    },
    shortDescription: {
        type: String,
        maxlength: 500
    },
    sku: {
        type: String,
        trim: true,
        // Note: sparse index is explicitly defined below for query performance
        maxlength: [VALIDATION.SKU_MAX_LENGTH, `SKU cannot exceed ${VALIDATION.SKU_MAX_LENGTH} characters`]
    },

    // Pricing (stored in smallest currency unit - paise/cents)
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [1, 'Price must be at least 1']
    },
    compareAtPrice: {
        type: Number,
        min: 0
    },

    // Price History & Intelligence
    originalPrice: {
        type: Number,
        min: 0
    },
    priceHistory: [{
        price: {
            type: Number,
            required: true
        },
        compareAtPrice: Number,
        changedAt: {
            type: Date,
            default: Date.now
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    lastPriceChange: {
        type: Date
    },
    hasPriceDrop: {
        type: Boolean,
        default: false
    },
    // Manual Price Drop Control (Admin can override automatic detection)
    manualPriceDrop: {
        enabled: {
            type: Boolean,
            default: false
        },
        discountPercent: {
            type: Number,
            min: 0,
            max: 100
        },
        expiresAt: {
            type: Date
        }
    },

    // Categories (many-to-many)
    categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],

    // Images
    images: {
        type: [imageSchema],
        validate: {
            validator: function (v) {
                return v.length <= VALIDATION.MAX_IMAGES_PER_PRODUCT;
            },
            message: `Cannot have more than ${VALIDATION.MAX_IMAGES_PER_PRODUCT} images per product`
        }
    },

    // Variants
    hasVariants: {
        type: Boolean,
        default: false
    },
    variantOptions: [variantOptionSchema],
    variants: [variantSchema],

    // Inventory (used when hasVariants is false)
    inventory: {
        type: Number,
        default: 0,
        min: [0, 'Inventory cannot be negative']
    },
    trackInventory: {
        type: Boolean,
        default: true
    },
    lowStockThreshold: {
        type: Number,
        default: 5,
        min: 0
    },

    // Metadata
    isFeatured: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: Object.values(PRODUCT_STATUS),
        default: PRODUCT_STATUS.DRAFT
    },

    // Weight for shipping calculations (in grams)
    weight: {
        type: Number,
        default: 0,
        min: 0
    },

    // SEO
    metaTitle: {
        type: String,
        maxlength: 70
    },
    metaDescription: {
        type: String,
        maxlength: 160
    },

    // Analytics
    viewCount: {
        type: Number,
        default: 0
    },
    salesCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
productSchema.index({ name: 'text', description: 'text' });
// Note: slug index is automatically created by unique: true constraint
productSchema.index({ status: 1 });
productSchema.index({ categories: 1 });
productSchema.index({ isFeatured: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ salesCount: -1 });
productSchema.index({ sku: 1 }, { sparse: true });
// New indexes for intelligent product discovery
productSchema.index({ hasPriceDrop: 1, lastPriceChange: -1, status: 1 });
productSchema.index({ createdAt: -1, status: 1 });

// Virtual for primary image
productSchema.virtual('primaryImage').get(function () {
    if (!this.images?.length) return null;
    const primary = this.images.find(img => img.isPrimary);
    return primary?.url || this.images[0]?.url;
});

// Virtual for checking if product is in stock
productSchema.virtual('inStock').get(function () {
    if (!this.trackInventory) return true;

    if (this.hasVariants && this.variants?.length) {
        return this.variants.some(v => v.isAvailable && v.inventory > 0);
    }

    return this.inventory > 0;
});

// Virtual for checking low stock
productSchema.virtual('isLowStock').get(function () {
    if (!this.trackInventory) return false;

    if (this.hasVariants && this.variants?.length) {
        return this.variants.some(v => v.inventory > 0 && v.inventory <= this.lowStockThreshold);
    }

    return this.inventory > 0 && this.inventory <= this.lowStockThreshold;
});

// Virtual for formatted price (for display purposes)
productSchema.virtual('formattedPrice').get(function () {
    return (this.price / 100).toFixed(2);
});

// Pre-save middleware to generate slug and track price changes
productSchema.pre('save', async function (next) {
    // Slug generation
    if (this.isModified('name') || !this.slug) {
        let baseSlug = slugify(this.name, {
            lower: true,
            strict: true,
            trim: true
        });

        // Ensure unique slug
        let slug = baseSlug;
        let counter = 1;

        let isUnique = false;
        while (!isUnique) {
            const existing = await mongoose.model('Product').findOne({
                slug,
                _id: { $ne: this._id }
            });

            if (!existing) {
                isUnique = true;
            } else {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }
        }

        this.slug = slug;
    }

    // Intelligent Price Tracking
    if (this.isModified('price') || this.isModified('compareAtPrice')) {
        if (this.isNew) {
            // New product - set original price
            this.originalPrice = this.price;
            this.priceHistory = [];
            this.hasPriceDrop = false;
        } else {
            // Existing product - track price change
            const oldProduct = await mongoose.model('Product').findById(this._id).select('price compareAtPrice');

            if (oldProduct && oldProduct.price !== this.price) {
                // Add old price to history
                this.priceHistory.push({
                    price: oldProduct.price,
                    compareAtPrice: oldProduct.compareAtPrice,
                    changedAt: new Date()
                });

                // Limit history to last 10 changes (prevent unbounded growth)
                if (this.priceHistory.length > 10) {
                    this.priceHistory = this.priceHistory.slice(-10);
                }

                // Detect price drop
                if (this.price < oldProduct.price) {
                    this.hasPriceDrop = true;
                    this.lastPriceChange = new Date();
                } else {
                    // Price increased or stayed same - remove drop flag
                    this.hasPriceDrop = false;
                    this.lastPriceChange = new Date();
                }
            }
        }
    }

    // Ensure at least one primary image
    if (this.images?.length && !this.images.some(img => img.isPrimary)) {
        this.images[0].isPrimary = true;
    }

    next();
});

// Method to decrement inventory
productSchema.methods.decrementInventory = async function (quantity, variantSku = null) {
    if (!this.trackInventory) return true;

    if (this.hasVariants && variantSku) {
        const variant = this.variants.find(v => v.sku === variantSku);
        if (!variant) throw new Error('Variant not found');
        if (variant.inventory < quantity) throw new Error('Insufficient inventory');

        variant.inventory -= quantity;
        if (variant.inventory === 0) variant.isAvailable = false;
    } else {
        if (this.inventory < quantity) throw new Error('Insufficient inventory');
        this.inventory -= quantity;
    }

    this.salesCount += quantity;
    return this.save();
};

// Method to restore inventory (on order cancellation)
productSchema.methods.restoreInventory = async function (quantity, variantSku = null) {
    if (!this.trackInventory) return true;

    if (this.hasVariants && variantSku) {
        const variant = this.variants.find(v => v.sku === variantSku);
        if (variant) {
            variant.inventory += quantity;
            variant.isAvailable = true;
        }
    } else {
        this.inventory += quantity;
    }

    this.salesCount = Math.max(0, this.salesCount - quantity);
    return this.save();
};

// Static method to get featured products (enhanced with smart logic)
productSchema.statics.getFeatured = async function (limit = 8) {
    // Smart algorithm: Combine price drops, top sellers, and manual featured
    const priceDrops = await this.find({
        status: PRODUCT_STATUS.ACTIVE,
        hasPriceDrop: true
    })
        .sort({ lastPriceChange: -1 })
        .limit(4);

    const topSellers = await this.find({
        status: PRODUCT_STATUS.ACTIVE
    })
        .sort({ salesCount: -1 })
        .limit(2);

    const manualFeatured = await this.find({
        status: PRODUCT_STATUS.ACTIVE,
        isFeatured: true
    })
        .sort({ createdAt: -1 })
        .limit(4);

    // Combine and deduplicate
    const allFeatured = [...priceDrops, ...topSellers, ...manualFeatured];
    const uniqueFeatured = allFeatured.filter((product, index, self) =>
        index === self.findIndex(p => p._id.toString() === product._id.toString())
    );

    return uniqueFeatured.slice(0, limit);
};

// Static method to get products with price drops
productSchema.statics.getPriceDrops = function (limit = 8, daysBack = 30) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysBack);

    return this.find({
        status: PRODUCT_STATUS.ACTIVE,
        hasPriceDrop: true,
        lastPriceChange: { $gte: dateThreshold }
    })
        .sort({ lastPriceChange: -1 })
        .limit(limit);
};

// Static method to get new arrivals (truly new products)
productSchema.statics.getNewArrivals = function (limit = 8, daysBack = 30) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysBack);

    return this.find({
        status: PRODUCT_STATUS.ACTIVE,
        createdAt: { $gte: dateThreshold }
    })
        .sort({ createdAt: -1 })
        .limit(limit);
};

// Static method for search
productSchema.statics.search = function (query, options = {}) {
    const { page = 1, limit = 20, sort = '-createdAt', category } = options;

    const filter = {
        status: PRODUCT_STATUS.ACTIVE,
        $text: { $search: query }
    };

    if (category) {
        filter.categories = category;
    }

    return this.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);
};

const Product = mongoose.model('Product', productSchema);

export default Product;

import mongoose from 'mongoose';
import { SECURITY, VALIDATION } from '../config/constants.js';

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    variant: {
        sku: String,
        options: {
            type: Map,
            of: String
        }
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
        max: [VALIDATION.MAX_QUANTITY_PER_ITEM, `Quantity cannot exceed ${VALIDATION.MAX_QUANTITY_PER_ITEM}`]
    },
    // Price at time of adding to cart (for comparison)
    priceAtAdd: {
        type: Number,
        required: true
    }
}, { _id: true });

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    sessionId: {
        type: String,
        default: null
    },
    items: {
        type: [cartItemSchema],
        validate: {
            validator: function (v) {
                return v.length <= VALIDATION.MAX_CART_ITEMS;
            },
            message: `Cart cannot have more than ${VALIDATION.MAX_CART_ITEMS} items`
        }
    },
    // Discount code applied
    discountCode: {
        type: String,
        default: null
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    // Expiration for guest carts
    expiresAt: {
        type: Date,
        default: function () {
            return new Date(Date.now() + SECURITY.CART_EXPIRY_HOURS * 60 * 60 * 1000);
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
cartSchema.index({ user: 1 });
cartSchema.index({ sessionId: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup
cartSchema.index({ updatedAt: 1 });

// Virtual for item count
cartSchema.virtual('itemCount').get(function () {
    return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for subtotal (calculated from items)
cartSchema.virtual('subtotal').get(function () {
    return this.items.reduce((total, item) => {
        // Use current price from populated product if available, otherwise use stored price
        const price = item.product?.price || item.priceAtAdd;
        return total + (price * item.quantity);
    }, 0);
});

// Method to add item to cart
cartSchema.methods.addItem = async function (productId, quantity = 1, variant = null) {
    const Product = mongoose.model('Product');
    const product = await Product.findById(productId);

    if (!product) {
        throw new Error('Product not found');
    }

    if (product.status !== 'active') {
        throw new Error('Product is not available');
    }

    // Check inventory
    if (product.trackInventory) {
        const availableQty = product.hasVariants && variant?.sku
            ? product.variants.find(v => v.sku === variant.sku)?.inventory || 0
            : product.inventory;

        if (availableQty < quantity) {
            throw new Error('Insufficient inventory');
        }
    }

    // Get price (variant price or product price)
    let price = product.price;
    if (product.hasVariants && variant?.sku) {
        const variantData = product.variants.find(v => v.sku === variant.sku);
        if (variantData?.price) {
            price = variantData.price;
        }
    }

    // Check if item already exists in cart
    const existingItemIndex = this.items.findIndex(item => {
        if (!item.product.equals(productId)) return false;
        if (variant?.sku && item.variant?.sku !== variant.sku) return false;
        return true;
    });

    if (existingItemIndex > -1) {
        // Update quantity
        const newQty = this.items[existingItemIndex].quantity + quantity;

        if (newQty > VALIDATION.MAX_QUANTITY_PER_ITEM) {
            throw new Error(`Cannot add more than ${VALIDATION.MAX_QUANTITY_PER_ITEM} of the same item`);
        }

        this.items[existingItemIndex].quantity = newQty;
        this.items[existingItemIndex].priceAtAdd = price; // Update to current price
    } else {
        // Add new item
        if (this.items.length >= VALIDATION.MAX_CART_ITEMS) {
            throw new Error(`Cart cannot have more than ${VALIDATION.MAX_CART_ITEMS} items`);
        }

        this.items.push({
            product: productId,
            variant: variant || undefined,
            quantity,
            priceAtAdd: price
        });
    }

    // Reset expiry
    this.expiresAt = new Date(Date.now() + SECURITY.CART_EXPIRY_HOURS * 60 * 60 * 1000);

    return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = async function (itemId, quantity) {
    const item = this.items.id(itemId);

    if (!item) {
        throw new Error('Item not found in cart');
    }

    if (quantity < 1) {
        // Remove item if quantity is 0 or less
        this.items.pull(itemId);
    } else {
        if (quantity > VALIDATION.MAX_QUANTITY_PER_ITEM) {
            throw new Error(`Quantity cannot exceed ${VALIDATION.MAX_QUANTITY_PER_ITEM}`);
        }

        // Check inventory
        const Product = mongoose.model('Product');
        const product = await Product.findById(item.product);

        if (product?.trackInventory) {
            const availableQty = product.hasVariants && item.variant?.sku
                ? product.variants.find(v => v.sku === item.variant.sku)?.inventory || 0
                : product.inventory;

            if (availableQty < quantity) {
                throw new Error('Insufficient inventory');
            }
        }

        item.quantity = quantity;
    }

    return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = async function (itemId) {
    this.items.pull(itemId);
    return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = async function () {
    this.items = [];
    this.discountCode = null;
    this.discountAmount = 0;
    return this.save();
};

// Method to validate cart before checkout
cartSchema.methods.validateForCheckout = async function () {
    const Product = mongoose.model('Product');
    const errors = [];
    const priceChanges = [];
    const unavailableItems = [];

    for (const item of this.items) {
        const product = await Product.findById(item.product);

        if (!product) {
            unavailableItems.push(item._id);
            continue;
        }

        if (product.status !== 'active') {
            unavailableItems.push(item._id);
            continue;
        }

        // Check inventory
        if (product.trackInventory) {
            const availableQty = product.hasVariants && item.variant?.sku
                ? product.variants.find(v => v.sku === item.variant.sku)?.inventory || 0
                : product.inventory;

            if (availableQty < item.quantity) {
                errors.push({
                    item: item._id,
                    product: product.name,
                    message: `Only ${availableQty} available`
                });
            }
        }

        // Check price changes
        const currentPrice = product.hasVariants && item.variant?.sku
            ? product.variants.find(v => v.sku === item.variant.sku)?.price || product.price
            : product.price;

        if (currentPrice !== item.priceAtAdd) {
            priceChanges.push({
                item: item._id,
                product: product.name,
                oldPrice: item.priceAtAdd,
                newPrice: currentPrice
            });
            // Update to current price
            item.priceAtAdd = currentPrice;
        }
    }

    // Remove unavailable items
    for (const itemId of unavailableItems) {
        this.items.pull(itemId);
    }

    if (unavailableItems.length > 0) {
        await this.save();
    }

    return {
        valid: errors.length === 0,
        errors,
        priceChanges,
        unavailableItems
    };
};

// Method to merge guest cart with user cart
cartSchema.methods.mergeWith = async function (userCart) {
    for (const item of this.items) {
        const existingItem = userCart.items.find(i => {
            if (!i.product.equals(item.product)) return false;
            if (item.variant?.sku && i.variant?.sku !== item.variant.sku) return false;
            return true;
        });

        if (existingItem) {
            existingItem.quantity = Math.min(
                existingItem.quantity + item.quantity,
                VALIDATION.MAX_QUANTITY_PER_ITEM
            );
        } else if (userCart.items.length < VALIDATION.MAX_CART_ITEMS) {
            userCart.items.push(item);
        }
    }

    await userCart.save();
    await this.deleteOne();

    return userCart;
};

// Static method to get or create cart
cartSchema.statics.getOrCreate = async function (userId = null, sessionId = null) {
    let cart;

    if (userId) {
        cart = await this.findOne({ user: userId });
        if (!cart) {
            cart = new this({ user: userId });
            await cart.save();
        }
    } else if (sessionId) {
        cart = await this.findOne({ sessionId });
        if (!cart) {
            cart = new this({ sessionId });
            await cart.save();
        }
    } else {
        throw new Error('Either userId or sessionId is required');
    }

    return cart;
};

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;

import { Product, Category, AuditLog } from '../models/index.js';
import { createError } from '../middleware/errorHandler.js';
import { PRODUCT_STATUS, AUDIT_ACTIONS, PAGINATION } from '../config/constants.js';
import configService from './configService.js';

/**
 * Product Service
 * Handles all product-related business logic
 */
class ProductService {
    /**
     * Get all products with pagination and filters
     */
    async getProducts(options = {}) {
        const {
            page = PAGINATION.DEFAULT_PAGE,
            limit = PAGINATION.DEFAULT_LIMIT,
            sort = '-createdAt',
            status = null,
            category = null,
            featured = null,
            search = null,
            minPrice = null,
            maxPrice = null,
            inStock = null
        } = options;

        const filter = {};

        // Status filter - exclude archived by default unless explicitly requested
        if (status) {
            filter.status = status;
        } else {
            // By default, exclude archived products
            filter.status = { $ne: PRODUCT_STATUS.ARCHIVED };
        }

        // Category filter
        if (category) {
            // Get category and all descendants
            const categoryIds = await Category.getDescendantIds(category);
            filter.categories = { $in: categoryIds };
        }

        // Featured filter
        if (featured !== null) {
            filter.isFeatured = featured;
        }

        // Search
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ];
        }

        // Price range
        if (minPrice !== null || maxPrice !== null) {
            filter.price = {};
            if (minPrice !== null) filter.price.$gte = minPrice;
            if (maxPrice !== null) filter.price.$lte = maxPrice;
        }

        // In stock filter
        if (inStock === true) {
            const inventoryEnabled = await configService.isFeatureEnabled('inventory');
            if (inventoryEnabled) {
                filter.$or = [
                    { trackInventory: false },
                    { inventory: { $gt: 0 } }
                ];
            }
        }

        const skip = (page - 1) * limit;

        // Minimal fields for list view - reduces payload by ~40%
        const listFields = 'name slug price compareAtPrice primaryImage images categories status isFeatured inventory trackInventory hasVariants variants.inventory variants.isAvailable';

        const [products, total] = await Promise.all([
            Product.find(filter)
                .select(listFields)
                .populate('categories', 'name slug')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Product.countDocuments(filter)
        ]);

        return {
            products,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get active products for storefront
     */
    async getActiveProducts(options = {}) {
        return this.getProducts({
            ...options,
            status: PRODUCT_STATUS.ACTIVE
        });
    }

    /**
     * Get product by ID
     */
    async getProductById(productId) {
        const product = await Product.findById(productId)
            .populate('categories', 'name slug');

        if (!product) {
            throw createError.notFound('Product not found');
        }

        return product;
    }

    /**
     * Get product by slug
     */
    async getProductBySlug(slug) {
        const product = await Product.findOne({ slug })
            .populate('categories', 'name slug');

        if (!product) {
            throw createError.notFound('Product not found');
        }

        // Increment view count
        product.viewCount += 1;
        await product.save();

        return product;
    }

    /**
     * Create a new product
     */
    async createProduct(productData, createdBy) {
        // Validate categories exist
        if (productData.categories?.length) {
            const validCategories = await Category.find({
                _id: { $in: productData.categories }
            });
            productData.categories = validCategories.map(c => c._id);
        }

        // Check if variants feature is enabled
        const variantsEnabled = await configService.isFeatureEnabled('variants');
        if (!variantsEnabled) {
            productData.hasVariants = false;
            productData.variantOptions = [];
            productData.variants = [];
        }

        const product = new Product(productData);
        await product.save();

        // Update category product counts
        if (product.categories?.length) {
            for (const catId of product.categories) {
                await Category.updateProductCount(catId);
            }
        }

        // Log action
        await AuditLog.log({
            action: AUDIT_ACTIONS.PRODUCT_CREATE,
            actor: createdBy,
            resourceType: 'product',
            resourceId: product._id,
            resourceName: product.name
        });

        return product;
    }

    /**
     * Update a product
     */
    async updateProduct(productId, updateData, updatedBy) {
        const product = await Product.findById(productId);

        if (!product) {
            throw createError.notFound('Product not found');
        }

        // Get old categories for count update
        const oldCategories = [...(product.categories || [])];

        // Validate categories if provided
        if (updateData.categories) {
            const validCategories = await Category.find({
                _id: { $in: updateData.categories }
            });
            updateData.categories = validCategories.map(c => c._id);
        }

        // Check if variants feature is enabled
        const variantsEnabled = await configService.isFeatureEnabled('variants');
        if (!variantsEnabled) {
            delete updateData.hasVariants;
            delete updateData.variantOptions;
            delete updateData.variants;
        }

        // Update product
        Object.assign(product, updateData);
        await product.save();

        // Update category product counts if categories changed
        const newCategories = product.categories || [];
        const allCategories = [...new Set([...oldCategories.map(String), ...newCategories.map(String)])];

        for (const catId of allCategories) {
            await Category.updateProductCount(catId);
        }

        // Log action
        await AuditLog.log({
            action: AUDIT_ACTIONS.PRODUCT_UPDATE,
            actor: updatedBy,
            resourceType: 'product',
            resourceId: product._id,
            resourceName: product.name,
            details: { updatedFields: Object.keys(updateData) }
        });

        return product;
    }

    /**
     * Delete (archive) a product
     */
    async deleteProduct(productId, deletedBy) {
        const product = await Product.findById(productId);

        if (!product) {
            throw createError.notFound('Product not found');
        }

        // Soft delete - set status to archived
        product.status = PRODUCT_STATUS.ARCHIVED;
        await product.save();

        // Update category product counts
        if (product.categories?.length) {
            for (const catId of product.categories) {
                await Category.updateProductCount(catId);
            }
        }

        // Log action
        await AuditLog.log({
            action: AUDIT_ACTIONS.PRODUCT_ARCHIVE,
            actor: deletedBy,
            resourceType: 'product',
            resourceId: product._id,
            resourceName: product.name
        });

        return { message: 'Product archived successfully' };
    }

    /**
     * Restore an archived product
     */
    async restoreProduct(productId, restoredBy) {
        const product = await Product.findById(productId);

        if (!product) {
            throw createError.notFound('Product not found');
        }

        if (product.status !== PRODUCT_STATUS.ARCHIVED) {
            throw createError.badRequest('Product is not archived');
        }

        product.status = PRODUCT_STATUS.DRAFT;
        await product.save();

        // Update category product counts
        if (product.categories?.length) {
            for (const catId of product.categories) {
                await Category.updateProductCount(catId);
            }
        }

        return product;
    }

    /**
     * Duplicate a product
     */
    async duplicateProduct(productId, duplicatedBy) {
        const originalProduct = await Product.findById(productId);

        if (!originalProduct) {
            throw createError.notFound('Product not found');
        }

        const productData = originalProduct.toObject();
        delete productData._id;
        delete productData.slug;
        delete productData.createdAt;
        delete productData.updatedAt;
        delete productData.viewCount;
        delete productData.salesCount;

        productData.name = `Copy of ${productData.name}`;
        productData.status = PRODUCT_STATUS.DRAFT;

        if (productData.sku) {
            productData.sku = `${productData.sku}-COPY`;
        }

        return this.createProduct(productData, duplicatedBy);
    }

    /**
     * Get featured products
     */
    async getFeaturedProducts(limit = 8) {
        return Product.getFeatured(limit);
    }

    /**
     * Get low stock products
     */
    async getLowStockProducts(threshold = null) {
        const inventoryEnabled = await configService.isFeatureEnabled('inventory');

        if (!inventoryEnabled) {
            return [];
        }

        const filter = {
            status: PRODUCT_STATUS.ACTIVE,
            trackInventory: true
        };

        if (threshold !== null) {
            filter.inventory = { $gt: 0, $lte: threshold };
        } else {
            filter.$expr = { $lte: ['$inventory', '$lowStockThreshold'] };
            filter.inventory = { $gt: 0 };
        }

        return Product.find(filter).sort({ inventory: 1 }).limit(50);
    }

    /**
     * Get out of stock products
     */
    async getOutOfStockProducts() {
        const inventoryEnabled = await configService.isFeatureEnabled('inventory');

        if (!inventoryEnabled) {
            return [];
        }

        return Product.find({
            status: PRODUCT_STATUS.ACTIVE,
            trackInventory: true,
            inventory: 0
        });
    }

    /**
     * Bulk update product status
     */
    async bulkUpdateStatus(productIds, status, updatedBy) {
        if (!Object.values(PRODUCT_STATUS).includes(status)) {
            throw createError.badRequest('Invalid status');
        }

        const result = await Product.updateMany(
            { _id: { $in: productIds } },
            { $set: { status, updatedAt: new Date() } }
        );

        // Log action
        await AuditLog.log({
            action: AUDIT_ACTIONS.PRODUCT_UPDATE,
            actor: updatedBy,
            resourceType: 'product',
            details: { productIds, newStatus: status, count: result.modifiedCount }
        });

        return { modified: result.modifiedCount };
    }

    /**
     * Get products with price drops (intelligent)
     */
    async getPriceDrops(limit = 8, daysBack = 30) {
        return Product.getPriceDrops(limit, daysBack);
    }

    /**
     * Get new arrivals (truly new products)
     */
    async getNewArrivals(limit = 8, daysBack = 30) {
        return Product.getNewArrivals(limit, daysBack);
    }

    /**
     * Search products
     */
    async searchProducts(query, options = {}) {
        const { page = 1, limit = 20, category = null } = options;

        return Product.search(query, { page, limit, category });
    }
}

export default new ProductService();

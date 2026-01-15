import mongoose from 'mongoose';
import slugify from 'slugify';
import { CATEGORY_STATUS } from '../config/constants.js';

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        maxlength: [100, 'Category name cannot exceed 100 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        maxlength: 500
    },
    image: {
        type: String,
        default: null
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    order: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: Object.values(CATEGORY_STATUS),
        default: CATEGORY_STATUS.ACTIVE
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
    // Product count (cached for performance)
    productCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
// Note: slug index is automatically created by unique: true constraint
categorySchema.index({ parent: 1 });
categorySchema.index({ status: 1 });
categorySchema.index({ order: 1 });

// Virtual for child categories
categorySchema.virtual('children', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parent'
});

// Virtual for breadcrumb path
categorySchema.virtual('depth').get(function () {
    // This is calculated in getAncestors method
    return this._depth || 0;
});

// Pre-save middleware to generate slug
categorySchema.pre('save', async function (next) {
    if (this.isModified('name') || !this.slug) {
        let baseSlug = slugify(this.name, {
            lower: true,
            strict: true,
            trim: true
        });

        // Ensure unique slug
        let slug = baseSlug;
        let counter = 1;

        while (true) {
            const existing = await mongoose.model('Category').findOne({
                slug,
                _id: { $ne: this._id }
            });

            if (!existing) break;
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        this.slug = slug;
    }

    // Validate max depth (3 levels)
    if (this.parent) {
        const ancestors = await this.constructor.getAncestors(this.parent);
        if (ancestors.length >= 2) {
            throw new Error('Categories cannot be nested more than 3 levels deep');
        }

        // Prevent circular reference
        if (ancestors.some(a => a._id.equals(this._id))) {
            throw new Error('Circular category reference detected');
        }
    }

    next();
});

// Method to get ancestors (breadcrumb)
categorySchema.methods.getAncestors = async function () {
    return this.constructor.getAncestors(this._id);
};

// Static method to get ancestors of a category
categorySchema.statics.getAncestors = async function (categoryId) {
    const ancestors = [];
    let currentId = categoryId;

    while (currentId) {
        const category = await this.findById(currentId);
        if (!category) break;

        if (currentId !== categoryId) {
            ancestors.unshift(category);
        }
        currentId = category.parent;
    }

    return ancestors;
};

// Static method to get category tree
categorySchema.statics.getTree = async function (status = CATEGORY_STATUS.ACTIVE) {
    const filter = status ? { status } : {};

    const categories = await this.find(filter)
        .sort({ order: 1, name: 1 })
        .lean();

    // Build tree structure
    const categoryMap = {};
    const tree = [];

    // First pass: create map
    categories.forEach(cat => {
        categoryMap[cat._id] = { ...cat, children: [] };
    });

    // Second pass: build tree
    categories.forEach(cat => {
        if (cat.parent && categoryMap[cat.parent]) {
            categoryMap[cat.parent].children.push(categoryMap[cat._id]);
        } else {
            tree.push(categoryMap[cat._id]);
        }
    });

    return tree;
};

// Static method to update product count
categorySchema.statics.updateProductCount = async function (categoryId) {
    const Product = mongoose.model('Product');
    const count = await Product.countDocuments({
        categories: categoryId,
        status: 'active'
    });

    await this.findByIdAndUpdate(categoryId, { productCount: count });
    return count;
};

// Static method to get all descendant IDs
categorySchema.statics.getDescendantIds = async function (categoryId) {
    const descendants = [categoryId];

    const findChildren = async (parentId) => {
        const children = await this.find({ parent: parentId }).select('_id');
        for (const child of children) {
            descendants.push(child._id);
            await findChildren(child._id);
        }
    };

    await findChildren(categoryId);
    return descendants;
};

const Category = mongoose.model('Category', categorySchema);

export default Category;

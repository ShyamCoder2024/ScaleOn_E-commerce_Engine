import express from 'express';
import { Category, AuditLog } from '../models/index.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { categoryValidator, mongoIdValidator } from '../middleware/validation.js';
import { CATEGORY_STATUS, AUDIT_ACTIONS } from '../config/constants.js';

const router = express.Router();

/**
 * @route   GET /api/categories
 * @desc    Get all active categories
 * @access  Public
 */
router.get('/', asyncHandler(async (req, res) => {
    const categories = await Category.find({ status: CATEGORY_STATUS.ACTIVE })
        .sort({ order: 1, name: 1 })
        .lean();

    res.json({
        success: true,
        data: { categories }
    });
}));

/**
 * @route   GET /api/categories/tree
 * @desc    Get category tree structure
 * @access  Public
 */
router.get('/tree', asyncHandler(async (req, res) => {
    const tree = await Category.getTree(CATEGORY_STATUS.ACTIVE);

    res.json({
        success: true,
        data: { categories: tree }
    });
}));

/**
 * @route   GET /api/categories/slug/:slug
 * @desc    Get category by slug
 * @access  Public
 */
router.get('/slug/:slug', asyncHandler(async (req, res) => {
    const category = await Category.findOne({
        slug: req.params.slug,
        status: CATEGORY_STATUS.ACTIVE
    });

    if (!category) {
        throw createError.notFound('Category not found');
    }

    // Get ancestors for breadcrumb
    const ancestors = await category.getAncestors();

    res.json({
        success: true,
        data: {
            category,
            breadcrumb: [...ancestors, category]
        }
    });
}));

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get('/:id', mongoIdValidator('id'), asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        throw createError.notFound('Category not found');
    }

    res.json({
        success: true,
        data: { category }
    });
}));

// ========================================
// ADMIN ROUTES
// ========================================

/**
 * @route   GET /api/categories/admin/all
 * @desc    Get all categories (including drafts) - Admin
 * @access  Admin
 */
router.get('/admin/all', protect, adminOnly, asyncHandler(async (req, res) => {
    const tree = await Category.getTree(null); // Get all statuses

    res.json({
        success: true,
        data: { categories: tree }
    });
}));

/**
 * @route   POST /api/categories
 * @desc    Create a new category - Admin
 * @access  Admin
 */
router.post('/', protect, adminOnly, categoryValidator, asyncHandler(async (req, res) => {
    const { name, description, parent, order, status, image } = req.body;

    const category = new Category({
        name,
        description,
        parent: parent || null,
        order: order || 0,
        status: status || CATEGORY_STATUS.ACTIVE,
        image
    });

    await category.save();

    // Log action
    await AuditLog.log({
        action: AUDIT_ACTIONS.CATEGORY_CREATE,
        actor: req.user._id,
        resourceType: 'category',
        resourceId: category._id,
        resourceName: category.name
    });

    res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: { category }
    });
}));

/**
 * @route   PUT /api/categories/:id
 * @desc    Update a category - Admin
 * @access  Admin
 */
router.put('/:id', protect, adminOnly, mongoIdValidator('id'), asyncHandler(async (req, res) => {
    const { name, description, parent, order, status, image } = req.body;

    const category = await Category.findById(req.params.id);

    if (!category) {
        throw createError.notFound('Category not found');
    }

    // Update fields
    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (parent !== undefined) category.parent = parent || null;
    if (order !== undefined) category.order = order;
    if (status !== undefined) category.status = status;
    if (image !== undefined) category.image = image;

    await category.save();

    // Log action
    await AuditLog.log({
        action: AUDIT_ACTIONS.CATEGORY_UPDATE,
        actor: req.user._id,
        resourceType: 'category',
        resourceId: category._id,
        resourceName: category.name
    });

    res.json({
        success: true,
        message: 'Category updated successfully',
        data: { category }
    });
}));

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete (archive) a category - Admin
 * @access  Admin
 */
router.delete('/:id', protect, adminOnly, mongoIdValidator('id'), asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        throw createError.notFound('Category not found');
    }

    // Check if category has children
    const hasChildren = await Category.exists({ parent: category._id });
    if (hasChildren) {
        throw createError.badRequest('Cannot delete category with subcategories. Delete subcategories first.');
    }

    // Soft delete
    category.status = CATEGORY_STATUS.ARCHIVED;
    await category.save();

    // Log action
    await AuditLog.log({
        action: AUDIT_ACTIONS.CATEGORY_DELETE,
        actor: req.user._id,
        resourceType: 'category',
        resourceId: category._id,
        resourceName: category.name
    });

    res.json({
        success: true,
        message: 'Category archived successfully'
    });
}));

/**
 * @route   POST /api/categories/reorder
 * @desc    Reorder categories - Admin
 * @access  Admin
 */
router.post('/reorder', protect, adminOnly, asyncHandler(async (req, res) => {
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
        throw createError.badRequest('Categories array is required');
    }

    // Update order for each category
    const bulkOps = categories.map((item, index) => ({
        updateOne: {
            filter: { _id: item.id },
            update: {
                $set: {
                    order: item.order !== undefined ? item.order : index,
                    parent: item.parent || null
                }
            }
        }
    }));

    await Category.bulkWrite(bulkOps);

    res.json({
        success: true,
        message: 'Categories reordered successfully'
    });
}));

export default router;

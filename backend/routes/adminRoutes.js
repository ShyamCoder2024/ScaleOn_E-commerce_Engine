import express from 'express';
import { User, Product, Order, Category, AuditLog } from '../models/index.js';
import authService from '../services/authService.js';
import productService from '../services/productService.js';
import orderService from '../services/orderService.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { protect, adminOnly, superAdminOnly } from '../middleware/auth.js';
import { adminLimiter } from '../middleware/rateLimiter.js';
import { paginationValidator } from '../middleware/validation.js';
import { USER_ROLES, AUDIT_ACTIONS } from '../config/constants.js';

const router = express.Router();

// Apply admin rate limiter to all routes
router.use(adminLimiter);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get dashboard data
 * @access  Admin
 */
router.get('/dashboard', protect, adminOnly, asyncHandler(async (req, res) => {
    const [
        orderStats,
        productStats,
        customerCount,
        recentOrders,
        lowStockProducts
    ] = await Promise.all([
        orderService.getOrderStats(),
        {
            total: await Product.countDocuments({ status: { $ne: 'archived' } }),
            active: await Product.countDocuments({ status: 'active' }),
            draft: await Product.countDocuments({ status: 'draft' })
        },
        User.countDocuments({ role: USER_ROLES.CUSTOMER }),
        orderService.getRecentOrders(10),
        productService.getLowStockProducts(10)
    ]);

    res.json({
        success: true,
        data: {
            orders: orderStats,
            products: productStats,
            customers: { total: customerCount },
            recentOrders,
            lowStockProducts
        }
    });
}));

/**
 * @route   GET /api/admin/analytics
 * @desc    Get analytics data
 * @access  Admin
 */
router.get('/analytics', protect, adminOnly, asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Revenue by day
    const revenueByDay = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: start, $lte: end },
                status: { $nin: ['cancelled', 'refunded'] }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                revenue: { $sum: '$pricing.total' },
                orders: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Top products
    const topProducts = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: start, $lte: end },
                status: { $nin: ['cancelled', 'refunded'] }
            }
        },
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.product',
                name: { $first: '$items.productName' },
                quantity: { $sum: '$items.quantity' },
                revenue: { $sum: '$items.subtotal' }
            }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
        {
            $match: { createdAt: { $gte: start, $lte: end } }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    res.json({
        success: true,
        data: {
            revenueByDay,
            topProducts,
            ordersByStatus,
            period: { start, end }
        }
    });
}));

// ========================================
// CUSTOMER MANAGEMENT
// ========================================

/**
 * @route   GET /api/admin/customers
 * @desc    Get all customers
 * @access  Admin
 */
router.get('/customers', protect, adminOnly, paginationValidator, asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search, status } = req.query;

    const filter = { role: USER_ROLES.CUSTOMER };

    if (search) {
        filter.$or = [
            { email: { $regex: search, $options: 'i' } },
            { 'profile.firstName': { $regex: search, $options: 'i' } },
            { 'profile.lastName': { $regex: search, $options: 'i' } }
        ];
    }

    if (status) {
        filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [customers, total] = await Promise.all([
        User.find(filter)
            .select('-password -refreshToken')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
        User.countDocuments(filter)
    ]);

    // Get order stats for each customer
    const customerIds = customers.map(c => c._id);
    const orderStats = await Order.aggregate([
        { $match: { user: { $in: customerIds } } },
        {
            $group: {
                _id: '$user',
                orderCount: { $sum: 1 },
                totalSpent: { $sum: '$pricing.total' }
            }
        }
    ]);

    const statsMap = {};
    orderStats.forEach(s => {
        statsMap[s._id.toString()] = { orderCount: s.orderCount, totalSpent: s.totalSpent };
    });

    const customersWithStats = customers.map(c => ({
        ...c,
        orderCount: statsMap[c._id.toString()]?.orderCount || 0,
        totalSpent: statsMap[c._id.toString()]?.totalSpent || 0
    }));

    res.json({
        success: true,
        data: {
            customers: customersWithStats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }
    });
}));

/**
 * @route   GET /api/admin/customers/:id
 * @desc    Get customer details
 * @access  Admin
 */
router.get('/customers/:id', protect, adminOnly, asyncHandler(async (req, res) => {
    const customer = await User.findById(req.params.id).select('-password -refreshToken');

    if (!customer) {
        throw createError.notFound('Customer not found');
    }

    // Get customer orders
    const orders = await Order.find({ user: customer._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

    // Calculate stats
    const stats = await Order.aggregate([
        { $match: { user: customer._id } },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalSpent: { $sum: '$pricing.total' }
            }
        }
    ]);

    res.json({
        success: true,
        data: {
            customer,
            orders,
            stats: stats[0] || { totalOrders: 0, totalSpent: 0 }
        }
    });
}));

/**
 * @route   PUT /api/admin/customers/:id/status
 * @desc    Update customer status (block/unblock)
 * @access  Admin
 */
router.put('/customers/:id/status', protect, adminOnly, asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!['active', 'blocked'].includes(status)) {
        throw createError.badRequest('Invalid status');
    }

    const customer = await User.findById(req.params.id);

    if (!customer) {
        throw createError.notFound('Customer not found');
    }

    customer.status = status;
    await customer.save();

    await AuditLog.log({
        action: status === 'blocked' ? 'customer.block' : 'customer.unblock',
        actor: req.user._id,
        resourceType: 'user',
        resourceId: customer._id,
        resourceName: customer.email
    });

    res.json({
        success: true,
        message: `Customer ${status === 'blocked' ? 'blocked' : 'unblocked'} successfully`,
        data: { customer }
    });
}));

// ========================================
// ADMIN USER MANAGEMENT
// ========================================

/**
 * @route   GET /api/admin/users
 * @desc    Get all admin users - Super Admin
 * @access  Super Admin
 */
router.get('/users', protect, superAdminOnly, asyncHandler(async (req, res) => {
    const admins = await User.find({
        role: { $in: [USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.SUPER_ADMIN] }
    })
        .select('-password -refreshToken')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        data: { admins }
    });
}));

/**
 * @route   POST /api/admin/users
 * @desc    Create admin user - Super Admin
 * @access  Super Admin
 */
router.post('/users', protect, superAdminOnly, asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, role } = req.body;

    const admin = await authService.createAdmin(
        { email, password, firstName, lastName, role },
        req.user._id
    );

    res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        data: { admin }
    });
}));

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update admin user - Super Admin
 * @access  Super Admin
 */
router.put('/users/:id', protect, superAdminOnly, asyncHandler(async (req, res) => {
    const { firstName, lastName, role, status } = req.body;

    const admin = await User.findById(req.params.id);

    if (!admin) {
        throw createError.notFound('Admin user not found');
    }

    if (![USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.SUPER_ADMIN].includes(admin.role)) {
        throw createError.badRequest('User is not an admin');
    }

    // Can't modify own super admin status
    if (admin._id.equals(req.user._id) && role && role !== USER_ROLES.SUPER_ADMIN) {
        throw createError.badRequest('Cannot downgrade your own role');
    }

    if (firstName !== undefined) admin.profile.firstName = firstName;
    if (lastName !== undefined) admin.profile.lastName = lastName;
    if (role !== undefined) admin.role = role;
    if (status !== undefined) admin.status = status;

    await admin.save();

    await AuditLog.log({
        action: AUDIT_ACTIONS.ADMIN_UPDATE,
        actor: req.user._id,
        resourceType: 'user',
        resourceId: admin._id,
        resourceName: admin.email
    });

    res.json({
        success: true,
        message: 'Admin user updated successfully',
        data: { admin }
    });
}));

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete admin user - Super Admin
 * @access  Super Admin
 */
router.delete('/users/:id', protect, superAdminOnly, asyncHandler(async (req, res) => {
    const admin = await User.findById(req.params.id);

    if (!admin) {
        throw createError.notFound('Admin user not found');
    }

    if (admin._id.equals(req.user._id)) {
        throw createError.badRequest('Cannot delete your own account');
    }

    // Soft delete - block the account
    admin.status = 'blocked';
    admin.role = USER_ROLES.CUSTOMER; // Demote to customer
    await admin.save();

    await AuditLog.log({
        action: AUDIT_ACTIONS.ADMIN_DELETE,
        actor: req.user._id,
        resourceType: 'user',
        resourceId: admin._id,
        resourceName: admin.email
    });

    res.json({
        success: true,
        message: 'Admin user removed successfully'
    });
}));

// ========================================
// AUDIT LOGS
// ========================================

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get audit logs - Admin
 * @access  Admin
 */
router.get('/audit-logs', protect, adminOnly, paginationValidator, asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, action, actor, resourceType, startDate, endDate } = req.query;

    const result = await AuditLog.search(null, {
        page: parseInt(page),
        limit: parseInt(limit),
        actions: action ? [action] : null,
        actors: actor ? [actor] : null,
        resourceTypes: resourceType ? [resourceType] : null,
        startDate,
        endDate
    });

    res.json({
        success: true,
        data: result
    });
}));

/**
 * @route   GET /api/admin/audit-logs/recent
 * @desc    Get recent activity - Admin
 * @access  Admin
 */
router.get('/audit-logs/recent', protect, adminOnly, asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const logs = await AuditLog.getRecentActivity({ limit });

    res.json({
        success: true,
        data: { logs }
    });
}));

export default router;

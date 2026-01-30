import express from 'express';
import configService from '../services/configService.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { protect, adminOnly, superAdminOnly } from '../middleware/auth.js';
import { configUpdateValidator, featureToggleValidator } from '../middleware/validation.js';
import { AuditLog } from '../models/index.js';
import { AUDIT_ACTIONS } from '../config/constants.js';

const router = express.Router();

/**
 * @route   GET /api/config/public
 * @desc    Get public configuration (safe for frontend)
 * @access  Public
 */
router.get('/public', asyncHandler(async (req, res) => {
    const config = await configService.getPublicConfig();

    res.json({
        success: true,
        data: config
    });
}));

/**
 * @route   GET /api/config/branding
 * @desc    Get branding configuration
 * @access  Public
 */
router.get('/branding', asyncHandler(async (req, res) => {
    const branding = await configService.getBranding();

    res.json({
        success: true,
        data: branding
    });
}));

/**
 * @route   GET /api/config/features
 * @desc    Get all feature flags
 * @access  Public
 */
router.get('/features', asyncHandler(async (req, res) => {
    const features = await configService.getFeatures();

    // Return only enabled status for public
    const publicFeatures = {};
    for (const [key, value] of Object.entries(features)) {
        publicFeatures[key] = value.enabled;
    }

    res.json({
        success: true,
        data: { features: publicFeatures }
    });
}));

// ========================================
// ADMIN ROUTES
// ========================================

/**
 * @route   GET /api/config/admin
 * @desc    Get full configuration - Admin
 * @access  Admin
 */
router.get('/admin', protect, adminOnly, asyncHandler(async (req, res) => {
    const config = await configService.getConfig();
    const features = await configService.getFeatures();

    res.json({
        success: true,
        data: { config, features }
    });
}));

/**
 * @route   GET /api/config/admin/features
 * @desc    Get detailed feature flags - Admin
 * @access  Admin
 */
router.get('/admin/features', protect, adminOnly, asyncHandler(async (req, res) => {
    const features = await configService.getFeatures();

    res.json({
        success: true,
        data: { features }
    });
}));

/**
 * @route   PUT /api/config/admin/features/:featureName
 * @desc    Toggle feature - Admin
 * @access  Admin
 */
router.put('/admin/features/:featureName', protect, adminOnly, asyncHandler(async (req, res) => {
    const { featureName } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
        throw createError.badRequest('enabled must be a boolean');
    }

    const feature = await configService.toggleFeature(featureName, enabled, req.user._id);

    // Log action
    await AuditLog.log({
        action: AUDIT_ACTIONS.FEATURE_TOGGLE,
        actor: req.user._id,
        resourceType: 'feature',
        resourceName: featureName,
        details: { enabled }
    });

    res.json({
        success: true,
        message: `Feature ${featureName} ${enabled ? 'enabled' : 'disabled'}`,
        data: { feature }
    });
}));

/**
 * @route   PUT /api/config/admin/:key
 * @desc    Update configuration value - Admin
 * @access  Admin
 */
router.put('/admin/:key(*)', protect, adminOnly, asyncHandler(async (req, res) => {
    const key = req.params.key;
    const { value, type, description } = req.body;

    if (value === undefined) {
        throw createError.badRequest('value is required');
    }

    // Validate configuration
    configService.validateConfig(key, value);

    await configService.set(key, value, type, req.user._id, description);

    // Log action
    await AuditLog.log({
        action: AUDIT_ACTIONS.CONFIG_UPDATE,
        actor: req.user._id,
        resourceType: 'config',
        resourceName: key,
        details: { newValue: value }
    });

    const updatedConfig = await configService.getConfig();

    res.json({
        success: true,
        message: 'Configuration updated',
        data: { config: updatedConfig }
    });
}));

/**
 * @route   PUT/POST /api/config/admin/batch
 * @desc    Update multiple configuration values - Admin
 * @access  Admin
 */
router.post('/admin/batch', protect, adminOnly, asyncHandler(async (req, res) => {
    const { configs } = req.body;

    if (!configs || !Array.isArray(configs)) {
        throw createError.badRequest('configs array is required');
    }

    // Convert array of {key, value, type} to object format expected by setMultiple
    const configsObject = {};
    configs.forEach(c => {
        if (c.key && c.value !== undefined) {
            configsObject[c.key] = {
                value: c.value,
                type: c.type || 'business_rule',
                description: c.description || ''
            };
        }
    });

    await configService.setMultiple(configsObject, req.user._id);

    // Log action
    await AuditLog.log({
        action: AUDIT_ACTIONS.CONFIG_UPDATE,
        actor: req.user._id,
        resourceType: 'config',
        details: { keys: configs.map(c => c.key) }
    });

    const updatedConfig = await configService.getConfig();

    res.json({
        success: true,
        message: 'Configuration updated',
        data: { config: updatedConfig }
    });
}));

// ========================================
// FEATURE CARDS ROUTES
// ========================================

/**
 * @route   GET /api/config/feature-cards
 * @desc    Get all feature cards/banners (for homepage carousel)
 * @access  Public
 */
router.get('/feature-cards', asyncHandler(async (req, res) => {
    const cards = await configService.get('featureCards.banners') || [];

    res.json({
        success: true,
        data: { cards }
    });
}));

/**
 * @route   GET /api/config/admin/feature-cards
 * @desc    Get all feature cards - Admin
 * @access  Admin
 */
router.get('/admin/feature-cards', protect, adminOnly, asyncHandler(async (req, res) => {
    const cards = await configService.get('featureCards.banners') || [];

    res.json({
        success: true,
        data: { cards }
    });
}));

/**
 * @route   POST /api/config/admin/feature-cards
 * @desc    Add a new feature card - Admin
 * @access  Admin
 */
router.post('/admin/feature-cards', protect, adminOnly, asyncHandler(async (req, res) => {
    const { image, title, link, linkType, categoryId, productId } = req.body;

    if (!image) {
        throw createError.badRequest('Image URL is required');
    }

    const existingCards = await configService.get('featureCards.banners') || [];

    const newCard = {
        id: `card_${Date.now()}`,
        image,
        title: title || '',
        link: link || '',
        linkType: linkType || 'url', // 'url', 'category', 'product'
        categoryId: categoryId || null,
        productId: productId || null,
        order: existingCards.length,
        createdAt: new Date().toISOString()
    };

    const updatedCards = [...existingCards, newCard];
    await configService.set('featureCards.banners', updatedCards, 'branding', req.user._id, 'Feature cards for homepage');

    await AuditLog.log({
        action: AUDIT_ACTIONS.CONFIG_UPDATE,
        actor: req.user._id,
        resourceType: 'feature_card',
        details: { action: 'add', cardId: newCard.id }
    });

    res.json({
        success: true,
        message: 'Feature card added',
        data: { card: newCard, cards: updatedCards }
    });
}));

/**
 * @route   DELETE /api/config/admin/feature-cards/:id
 * @desc    Delete a feature card - Admin
 * @access  Admin
 */
router.delete('/admin/feature-cards/:id', protect, adminOnly, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existingCards = await configService.get('featureCards.banners') || [];
    const cardIndex = existingCards.findIndex(c => c.id === id);

    if (cardIndex === -1) {
        throw createError.notFound('Feature card not found');
    }

    const updatedCards = existingCards.filter(c => c.id !== id);
    updatedCards.forEach((card, index) => { card.order = index; });

    await configService.set('featureCards.banners', updatedCards, 'branding', req.user._id, 'Feature cards for homepage');

    await AuditLog.log({
        action: AUDIT_ACTIONS.CONFIG_UPDATE,
        actor: req.user._id,
        resourceType: 'feature_card',
        details: { action: 'delete', cardId: id }
    });

    res.json({
        success: true,
        message: 'Feature card deleted',
        data: { cards: updatedCards }
    });
}));

/**
 * @route   PUT /api/config/admin/feature-cards/reorder
 * @desc    Reorder feature cards - Admin
 * @access  Admin
 */
router.put('/admin/feature-cards/reorder', protect, adminOnly, asyncHandler(async (req, res) => {
    const { cardIds } = req.body;

    if (!cardIds || !Array.isArray(cardIds)) {
        throw createError.badRequest('cardIds array is required');
    }

    const existingCards = await configService.get('featureCards.banners') || [];

    const reorderedCards = cardIds.map((id, index) => {
        const card = existingCards.find(c => c.id === id);
        return card ? { ...card, order: index } : null;
    }).filter(Boolean);

    await configService.set('featureCards.banners', reorderedCards, 'branding', req.user._id, 'Feature cards for homepage');

    res.json({
        success: true,
        message: 'Feature cards reordered',
        data: { cards: reorderedCards }
    });
}));

/**
 * @route   GET /api/config/admin/export
 * @desc    Export all configuration - Super Admin
 * @access  Super Admin
 */
router.get('/admin/export', protect, superAdminOnly, asyncHandler(async (req, res) => {
    const exportData = await configService.exportConfig();

    res.json({
        success: true,
        data: exportData
    });
}));

/**
 * @route   POST /api/config/admin/import
 * @desc    Import configuration - Super Admin
 * @access  Super Admin
 */
router.post('/admin/import', protect, superAdminOnly, asyncHandler(async (req, res) => {
    const importData = req.body;

    if (!importData || (!importData.config && !importData.features)) {
        throw createError.badRequest('Import data is required');
    }

    const result = await configService.importConfig(importData, req.user._id);

    // Log action
    await AuditLog.log({
        action: AUDIT_ACTIONS.CONFIG_UPDATE,
        actor: req.user._id,
        resourceType: 'config',
        details: { action: 'import' }
    });

    res.json({
        success: true,
        message: 'Configuration imported successfully',
        data: result
    });
}));

/**
 * @route   POST /api/config/admin/initialize
 * @desc    Initialize default features - Admin
 * @access  Admin
 */
router.post('/admin/initialize', protect, adminOnly, asyncHandler(async (req, res) => {
    const features = await configService.initializeFeatures();

    res.json({
        success: true,
        message: 'Default features initialized',
        data: { features }
    });
}));

export default router;

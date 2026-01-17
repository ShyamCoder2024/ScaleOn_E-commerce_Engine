/**
 * Upload Routes
 * Handles image upload endpoints
 */

import express from 'express';
import uploadService, { upload } from '../services/uploadService.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/upload/image
 * Upload a single image (admin only)
 */
router.post('/image', protect, adminOnly, upload.single('image'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const folder = req.body.folder || 'general';
        const result = await uploadService.uploadImage(req.file, { folder });

        res.status(200).json({
            success: true,
            data: {
                url: result.url,
                publicId: result.publicId || null,
                provider: result.provider
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/upload/images
 * Upload multiple images (admin only)
 */
router.post('/images', protect, adminOnly, upload.array('images', 10), async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No image files provided'
            });
        }

        const folder = req.body.folder || 'general';
        const results = await uploadService.uploadImages(req.files, { folder });

        res.status(200).json({
            success: true,
            data: {
                images: results.map(r => ({
                    url: r.url,
                    publicId: r.publicId || null,
                    provider: r.provider
                }))
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/upload/image
 * Delete an image (admin only)
 */
router.delete('/image', protect, adminOnly, async (req, res, next) => {
    try {
        const { url, publicId } = req.body;

        if (!url && !publicId) {
            return res.status(400).json({
                success: false,
                message: 'URL or publicId is required'
            });
        }

        await uploadService.deleteImage(url, publicId);

        res.status(200).json({
            success: true,
            message: 'Image deleted'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/upload/status
 * Check upload configuration status
 */
router.get('/status', protect, adminOnly, (req, res) => {
    res.json({
        success: true,
        data: {
            cloudinaryConfigured: uploadService.isCloudinaryConfigured(),
            maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 20 * 1024 * 1024
        }
    });
});

export default router;

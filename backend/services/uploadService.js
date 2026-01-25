/**
 * Upload Service
 * Handles file uploads with local storage fallback and Cloudinary support
 */

import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createError } from '../middleware/errorHandler.js';

// Configure Cloudinary if credentials are available
const cloudinaryConfigured = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (cloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

// Local upload directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024; // 50MB default for high-res mobile photos

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(UPLOAD_DIR, 'temp');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

// File filter for images
const imageFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP, SVG)'), false);
    }
};

// Create multer upload instance
export const upload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE
    },
    fileFilter: imageFilter
});

class UploadService {
    /**
     * Upload image to cloud storage or local
     * @param {Object} file - Multer file object
     * @param {Object} options - Upload options
     * @returns {Promise<Object>} - Upload result with URL
     */
    async uploadImage(file, options = {}) {
        const { folder = 'general', transformation = null } = options;

        try {
            if (cloudinaryConfigured) {
                // Upload to Cloudinary
                const result = await this.uploadToCloudinary(file.path, {
                    folder: `scaleon/${folder}`,
                    transformation
                });

                // Delete temp file
                this.deleteFile(file.path);

                return {
                    url: result.secure_url,
                    publicId: result.public_id,
                    width: result.width,
                    height: result.height,
                    format: result.format,
                    provider: 'cloudinary'
                };
            } else {
                // Warn in production that Cloudinary should be configured
                if (process.env.NODE_ENV === 'production') {
                    console.warn('⚠️ Cloudinary not configured. Using local storage (files may be lost on restart). Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in environment variables.');
                }

                // Use local storage
                const result = await this.saveLocally(file, folder);
                return {
                    url: result.url,
                    path: result.path,
                    provider: 'local'
                };
            }
        } catch (error) {
            // Clean up temp file on error
            this.deleteFile(file.path);
            console.error('Upload error details:', error);
            throw createError.internal(`Upload failed: ${error.message}`);
        }
    }

    /**
     * Upload to Cloudinary
     */
    async uploadToCloudinary(filePath, options = {}) {
        const uploadOptions = {
            folder: options.folder || 'scaleon',
            resource_type: 'image',
            quality: 'auto',
            fetch_format: 'auto'
        };

        if (options.transformation) {
            uploadOptions.transformation = options.transformation;
        }

        return cloudinary.uploader.upload(filePath, uploadOptions);
    }

    /**
     * Save file locally
     */
    async saveLocally(file, folder) {
        const destFolder = path.join(UPLOAD_DIR, folder);
        if (!fs.existsSync(destFolder)) {
            fs.mkdirSync(destFolder, { recursive: true });
        }

        const fileName = path.basename(file.path);
        const destPath = path.join(destFolder, fileName);

        // Move from temp to final destination
        fs.renameSync(file.path, destPath);

        // Generate absolute URL using BACKEND_URL for production (cross-domain support)
        // Falls back to relative path for local development
        const backendUrl = process.env.BACKEND_URL || process.env.API_URL || '';
        const relativePath = `/uploads/${folder}/${fileName}`;
        const url = backendUrl ? `${backendUrl}${relativePath}` : relativePath;

        return {
            url,
            path: destPath
        };
    }

    /**
     * Delete file from storage
     */
    async deleteImage(url, publicId = null) {
        try {
            if (publicId && cloudinaryConfigured) {
                // Delete from Cloudinary
                await cloudinary.uploader.destroy(publicId);
            } else if (url && url.startsWith('/uploads/')) {
                // Delete local file
                const filePath = path.join(process.cwd(), url);
                this.deleteFile(filePath);
            }
            return true;
        } catch (error) {
            console.error('Delete failed:', error);
            return false;
        }
    }

    /**
     * Helper to delete a file
     */
    deleteFile(filePath) {
        try {
            if (filePath && fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error('Failed to delete file:', error);
        }
    }

    /**
     * Upload multiple images
     */
    async uploadImages(files, options = {}) {
        const results = [];

        for (const file of files) {
            const result = await this.uploadImage(file, options);
            results.push(result);
        }

        return results;
    }

    /**
     * Check if Cloudinary is configured
     */
    isCloudinaryConfigured() {
        return cloudinaryConfigured;
    }
}

export default new UploadService();

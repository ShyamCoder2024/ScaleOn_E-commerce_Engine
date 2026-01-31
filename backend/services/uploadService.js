/**
 * Upload Service
 * Handles file uploads with local storage fallback and Cloudinary support
 */

import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import sharp from 'sharp';
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

// File filter for images - Enhanced to support mobile formats
const imageFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/heic',           // iPhone HEIC format
        'image/heif',           // Modern mobile format
        'image/heic-sequence',
        'image/heif-sequence'
    ];

    // Also check file extensions for cases where MIME type is incorrect
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.heic', '.heif'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Accepted formats: JPEG, PNG, GIF, WebP, SVG, HEIC/HEIF`), false);
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
     * Process image with Sharp - CRITICAL FIX for smartphone images
     * Handles EXIF orientation, format conversion, and optimization
     * @param {string} inputPath - Path to input image
     * @param {Object} options - Processing options
     * @returns {Promise<Object>} - Processed image details
     */
    async processImage(inputPath, options = {}) {
        const {
            maxWidth = 2000,       // Max width for products
            maxHeight = 2000,      // Max height
            quality = 90,          // High quality for product images
            format = 'jpeg',       // Output format (jpeg, png, webp)
            fit = 'inside'         // Resize strategy
        } = options;

        try {
            console.log('📸 Processing image:', {
                input: path.basename(inputPath),
                maxDimensions: `${maxWidth}x${maxHeight}`,
                quality,
                format
            });

            const image = sharp(inputPath);
            const metadata = await image.metadata();

            console.log('📊 Original image metadata:', {
                format: metadata.format,
                width: metadata.width,
                height: metadata.height,
                size: `${(metadata.size / 1024 / 1024).toFixed(2)}MB`,
                orientation: metadata.orientation,
                hasAlpha: metadata.hasAlpha,
                space: metadata.space
            });

            // CRITICAL FIX: Auto-rotate based on EXIF orientation
            // This fixes images appearing rotated/upside-down from smartphones
            image.rotate();

            // Resize if image exceeds max dimensions (preserve aspect ratio)
            if (metadata.width > maxWidth || metadata.height > maxHeight) {
                console.log(`🔄 Resizing from ${metadata.width}x${metadata.height} to max ${maxWidth}x${maxHeight}`);
                image.resize(maxWidth, maxHeight, {
                    fit,
                    withoutEnlargement: true
                });
            }

            // Convert to web-friendly format with optimization
            if (format === 'jpeg' || format === 'jpg') {
                image.jpeg({
                    quality,
                    progressive: true,      // Better for web display
                    mozjpeg: true,          // Use mozjpeg compression
                    chromaSubsampling: '4:4:4' // Better quality
                });
            } else if (format === 'png') {
                image.png({
                    quality,
                    compressionLevel: 9,    // Max compression
                    progressive: true
                });
            } else if (format === 'webp') {
                image.webp({
                    quality,
                    lossless: false
                });
            }

            // Strip EXIF metadata after rotation (privacy + smaller file size)
            // Keeps orientation fixed at 1 (normal)
            image.withMetadata({ orientation: undefined });

            // Generate output path
            const ext = format === 'jpeg' || format === 'jpg' ? 'jpg' : format;
            const outputPath = inputPath.replace(/\.[^.]+$/, `.processed.${ext}`);

            // Process and save
            await image.toFile(outputPath);

            // Get processed file stats
            const stats = fs.statSync(outputPath);

            console.log('✅ Image processed successfully:', {
                output: path.basename(outputPath),
                size: `${(stats.size / 1024 / 1024).toFixed(2)}MB`,
                reduction: `${((1 - stats.size / metadata.size) * 100).toFixed(1)}%`
            });

            return {
                path: outputPath,
                originalPath: inputPath,
                width: metadata.width,
                height: metadata.height,
                format: ext,
                size: stats.size,
                originalSize: metadata.size
            };
        } catch (error) {
            console.error('❌ Image processing error:', error);
            throw new Error(`Failed to process image: ${error.message}`);
        }
    }

    /**
     * Upload image to cloud storage or local
     * @param {Object} file - Multer file object
     * @param {Object} options - Upload options
     * @returns {Promise<Object>} - Upload result with URL
     */
    async uploadImage(file, options = {}) {
        const { folder = 'general', transformation = null } = options;
        let processedPath = null;

        try {
            console.log('📤 Starting upload:', {
                filename: file.originalname,
                mimetype: file.mimetype,
                size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
                folder
            });

            // CRITICAL: Process image with Sharp BEFORE upload
            // This handles EXIF orientation, format conversion, and optimization
            const processed = await this.processImage(file.path, {
                maxWidth: 2000,
                maxHeight: 2000,
                quality: 90,
                format: 'jpeg'  // Always convert to JPEG for consistency
            });

            processedPath = processed.path;

            if (cloudinaryConfigured) {
                // Upload processed image to Cloudinary
                const result = await this.uploadToCloudinary(processedPath, {
                    folder: `scaleon/${folder}`,
                    transformation
                });

                // Delete both temp and processed files
                this.deleteFile(file.path);
                this.deleteFile(processedPath);

                console.log('☁️ Uploaded to Cloudinary:', result.secure_url);

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

                // Use local storage with processed image
                const result = await this.saveLocally({ path: processedPath }, folder);

                // Delete original temp file, keep processed file
                this.deleteFile(file.path);

                console.log('💾 Saved locally:', result.url);

                return {
                    url: result.url,
                    path: result.path,
                    provider: 'local',
                    width: processed.width,
                    height: processed.height,
                    format: processed.format
                };
            }
        } catch (error) {
            // Clean up all temp files on error
            this.deleteFile(file.path);
            if (processedPath) {
                this.deleteFile(processedPath);
            }
            console.error('❌ Upload error:', error);
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

        // CRITICAL FIX: Store relative path only (not absolute URL)
        // This makes images work in all environments:
        // - Development (localhost)
        // - Production (any domain)
        // - After server restarts or URL changes
        const url = `/uploads/${folder}/${fileName}`;

        console.log('🖼️ Image path generated:', url);
        console.log('📁 File saved to:', destPath);

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

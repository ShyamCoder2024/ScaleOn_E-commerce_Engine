import { useState, useRef, useCallback } from 'react';
import { Upload, X, AlertCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import api from '../services/api';

/**
 * ImageUpload Component
 * Reusable drag-and-drop image upload component
 * 
 * @param {Object} props
 * @param {string} props.value - Current image URL
 * @param {Function} props.onChange - Callback when image changes (url) => void
 * @param {string} props.folder - Upload folder (e.g., 'products', 'logos')
 * @param {string} props.label - Label text
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Disable upload
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.maxSize - Max file size in MB (default: 5)
 * @param {boolean} props.showUrlInput - Show URL input field (default: true)
 */
const ImageUpload = ({
    value = '',
    onChange,
    folder = 'general',
    label = 'Upload Image',
    placeholder = 'Drag & drop an image here, or click to browse',
    disabled = false,
    className = '',
    maxSize = 5,
    showUrlInput = true
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const fileInputRef = useRef(null);

    const maxSizeBytes = maxSize * 1024 * 1024;

    // Handle file selection
    const handleFile = useCallback(async (file) => {
        setError('');

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            setError('Please upload a valid image file (JPEG, PNG, GIF, WebP, or SVG)');
            return;
        }

        // Validate file size
        if (file.size > maxSizeBytes) {
            setError(`File size must be less than ${maxSize}MB`);
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('folder', folder);

            const response = await api.post('/upload/image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                onChange(response.data.data.url);
            } else {
                throw new Error(response.data.message || 'Upload failed');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.response?.data?.message || 'Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
        }
    }, [folder, maxSize, maxSizeBytes, onChange]);

    // Handle drag events
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && !isUploading) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled || isUploading) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    };

    // Handle click to browse
    const handleClick = () => {
        if (!disabled && !isUploading) {
            fileInputRef.current?.click();
        }
    };

    // Handle file input change
    const handleFileChange = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
        // Reset input
        e.target.value = '';
    };

    // Handle URL input
    const handleUrlSubmit = () => {
        if (urlInput.trim()) {
            onChange(urlInput.trim());
            setUrlInput('');
        }
    };

    // Handle remove image
    const handleRemove = () => {
        onChange('');
        setError('');
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700">{label}</label>
            )}

            {/* Drop Zone */}
            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleClick}
                className={`
                    relative w-full min-h-[160px] rounded-xl border-2 border-dashed 
                    transition-all duration-200 cursor-pointer
                    flex flex-col items-center justify-center p-4
                    ${isDragging
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${isUploading ? 'cursor-wait' : ''}
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={disabled || isUploading}
                />

                {/* Preview */}
                {value && !isUploading ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img
                            src={value}
                            alt="Preview"
                            className="max-h-40 max-w-full object-contain rounded-lg"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove();
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : isUploading ? (
                    <div className="flex flex-col items-center gap-3 text-gray-500">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                        <span className="text-sm font-medium">Uploading...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 text-gray-500">
                        {isDragging ? (
                            <>
                                <Upload className="w-10 h-10 text-blue-500" />
                                <span className="text-sm font-medium text-blue-600">Drop image here</span>
                            </>
                        ) : (
                            <>
                                <ImageIcon className="w-10 h-10 text-gray-400" />
                                <div className="text-center">
                                    <span className="text-sm text-gray-500 block">{placeholder}</span>
                                    <span className="text-xs text-gray-400 mt-1 block">
                                        Max size: {maxSize}MB • JPEG, PNG, GIF, WebP, SVG
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            )}

            {/* URL Input (Optional) */}
            {showUrlInput && !value && (
                <div className="flex gap-2">
                    <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="Or paste image URL..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={disabled || isUploading}
                    />
                    <button
                        type="button"
                        onClick={handleUrlSubmit}
                        disabled={!urlInput.trim() || disabled || isUploading}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Use URL
                    </button>
                </div>
            )}
        </div>
    );
};

export default ImageUpload;

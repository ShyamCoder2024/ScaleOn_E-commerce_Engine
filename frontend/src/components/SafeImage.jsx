import { useState, useCallback, memo } from 'react';
import { ImageOff } from 'lucide-react';

/**
 * SafeImage - Optimized image component with automatic fallback
 * 
 * Performance features:
 * - Native lazy loading (loading="lazy")
 * - Async decoding (decoding="async") for non-blocking
 * - Fetch priority support for above-fold images
 * - Loading skeleton with smooth fade-in
 * - React.memo to prevent unnecessary re-renders
 * 
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text for accessibility
 * @param {string} fallbackText - Text to show in placeholder
 * @param {string} className - Tailwind/CSS classes
 * @param {string} fallbackSrc - Custom fallback image URL
 * @param {boolean} showIcon - Show placeholder icon (default: true)
 * @param {number} iconSize - Size of placeholder icon (default: 24)
 * @param {boolean} priority - High priority image (above fold)
 */
const SafeImage = memo(({
    src,
    alt = 'Image',
    fallbackText,
    className = '',
    fallbackSrc,
    showIcon = true,
    iconSize = 24,
    priority = false,
    ...props
}) => {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const handleError = useCallback(() => {
        setHasError(true);
        setIsLoading(false);
    }, []);

    const handleLoad = useCallback(() => {
        setIsLoading(false);
    }, []);

    // Generate placeholder URL with product name
    const displayText = fallbackText || alt || 'Product';
    const truncatedText = displayText.slice(0, 12);
    const defaultFallback = `https://placehold.co/400x400/e2e8f0/475569?text=${encodeURIComponent(truncatedText)}`;

    // If error occurred and we have a custom fallback, try it
    if (hasError && fallbackSrc) {
        return (
            <img
                src={fallbackSrc}
                alt={alt}
                className={className}
                loading="lazy"
                decoding="async"
                onError={() => setHasError(true)}
                {...props}
            />
        );
    }

    // If error occurred, show styled placeholder
    if (hasError) {
        return (
            <div
                className={`flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50 text-gray-400 ${className}`}
                role="img"
                aria-label={alt}
            >
                {showIcon && <ImageOff size={iconSize} strokeWidth={1.5} className="mb-1 opacity-50" />}
                <span className="text-xs text-center px-2 line-clamp-2 opacity-60">
                    {truncatedText}
                </span>
            </div>
        );
    }

    return (
        <>
            {/* Loading skeleton */}
            {isLoading && (
                <div className={`absolute inset-0 bg-gray-100 animate-pulse ${className}`} />
            )}
            <img
                src={src || defaultFallback}
                alt={alt}
                className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
                onError={handleError}
                onLoad={handleLoad}
                // Performance attributes
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={priority ? 'high' : 'auto'}
                {...props}
            />
        </>
    );
});

SafeImage.displayName = 'SafeImage';

export default SafeImage;


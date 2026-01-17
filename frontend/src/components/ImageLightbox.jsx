import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

/**
 * ImageLightbox - Fullscreen image viewer with zoom functionality
 * Supports: mouse wheel zoom, pinch-to-zoom, pan, keyboard navigation
 * Responsive across mobile, tablet, and desktop
 */
const ImageLightbox = ({
    images = [],
    initialIndex = 0,
    isOpen,
    onClose
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [lastTouchDistance, setLastTouchDistance] = useState(null);

    const containerRef = useRef(null);
    const imageRef = useRef(null);

    const MIN_SCALE = 1;
    const MAX_SCALE = 4;
    const ZOOM_STEP = 0.5;

    // Reset when opening or changing image
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            resetZoom();
        }
    }, [isOpen, initialIndex]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowLeft':
                    prevImage();
                    break;
                case 'ArrowRight':
                    nextImage();
                    break;
                case '+':
                case '=':
                    zoomIn();
                    break;
                case '-':
                    zoomOut();
                    break;
                case '0':
                    resetZoom();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Prevent scrolling when lightbox is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const resetZoom = useCallback(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, []);

    const zoomIn = useCallback(() => {
        setScale(prev => Math.min(prev + ZOOM_STEP, MAX_SCALE));
    }, []);

    const zoomOut = useCallback(() => {
        setScale(prev => {
            const newScale = Math.max(prev - ZOOM_STEP, MIN_SCALE);
            if (newScale === MIN_SCALE) {
                setPosition({ x: 0, y: 0 });
            }
            return newScale;
        });
    }, []);

    const nextImage = useCallback(() => {
        if (images.length > 1) {
            setCurrentIndex(prev => (prev + 1) % images.length);
            resetZoom();
        }
    }, [images.length, resetZoom]);

    const prevImage = useCallback(() => {
        if (images.length > 1) {
            setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
            resetZoom();
        }
    }, [images.length, resetZoom]);

    // Mouse wheel zoom
    const handleWheel = useCallback((e) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            zoomIn();
        } else {
            zoomOut();
        }
    }, [zoomIn, zoomOut]);

    // Mouse drag for panning
    const handleMouseDown = useCallback((e) => {
        if (scale > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    }, [scale, position]);

    const handleMouseMove = useCallback((e) => {
        if (isDragging && scale > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    }, [isDragging, scale, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Touch handlers for mobile pinch-to-zoom
    const getTouchDistance = (touches) => {
        if (touches.length < 2) return null;
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = useCallback((e) => {
        if (e.touches.length === 2) {
            setLastTouchDistance(getTouchDistance(e.touches));
        } else if (e.touches.length === 1 && scale > 1) {
            setIsDragging(true);
            setDragStart({
                x: e.touches[0].clientX - position.x,
                y: e.touches[0].clientY - position.y
            });
        }
    }, [scale, position]);

    const handleTouchMove = useCallback((e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const newDistance = getTouchDistance(e.touches);
            if (lastTouchDistance && newDistance) {
                const delta = newDistance - lastTouchDistance;
                const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta * 0.01));
                setScale(newScale);
                setLastTouchDistance(newDistance);

                if (newScale === MIN_SCALE) {
                    setPosition({ x: 0, y: 0 });
                }
            }
        } else if (e.touches.length === 1 && isDragging && scale > 1) {
            setPosition({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y
            });
        }
    }, [lastTouchDistance, scale, isDragging, dragStart]);

    const handleTouchEnd = useCallback(() => {
        setLastTouchDistance(null);
        setIsDragging(false);
    }, []);

    // Double tap to zoom
    const lastTap = useRef(0);
    const handleDoubleTap = useCallback((e) => {
        const now = Date.now();
        if (now - lastTap.current < 300) {
            if (scale > 1) {
                resetZoom();
            } else {
                setScale(2.5);
            }
        }
        lastTap.current = now;
    }, [scale, resetZoom]);

    if (!isOpen || images.length === 0) return null;

    const currentImage = images[currentIndex];

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm overflow-hidden"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-30 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm"
                style={{ position: 'fixed', top: '16px', right: '16px' }}
                aria-label="Close"
            >
                <X size={24} />
            </button>

            {/* Zoom Controls - Desktop */}
            <div
                className="absolute top-4 left-1/2 -translate-x-1/2 z-30 hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2"
                style={{ position: 'fixed', top: '16px' }}
            >
                <button
                    onClick={zoomOut}
                    disabled={scale <= MIN_SCALE}
                    className="p-2 hover:bg-white/20 rounded-full text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Zoom out"
                >
                    <ZoomOut size={20} />
                </button>
                <span className="text-white text-sm font-medium min-w-[60px] text-center">
                    {Math.round(scale * 100)}%
                </span>
                <button
                    onClick={zoomIn}
                    disabled={scale >= MAX_SCALE}
                    className="p-2 hover:bg-white/20 rounded-full text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Zoom in"
                >
                    <ZoomIn size={20} />
                </button>
                <div className="w-px h-6 bg-white/20 mx-1" />
                <button
                    onClick={resetZoom}
                    className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
                    aria-label="Reset zoom"
                >
                    <RotateCcw size={18} />
                </button>
            </div>

            {/* Navigation Arrows - Desktop */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm hidden sm:block"
                        style={{ position: 'fixed', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
                        aria-label="Previous image"
                    >
                        <ChevronLeft size={28} />
                    </button>
                    <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm hidden sm:block"
                        style={{ position: 'fixed', right: '16px', top: '50%', transform: 'translateY(-50%)' }}
                        aria-label="Next image"
                    >
                        <ChevronRight size={28} />
                    </button>
                </>
            )}

            {/* Image Container - Centered */}
            <div
                className="flex items-center justify-center"
                style={{
                    width: '100%',
                    height: '100%',
                    padding: '60px 16px 120px 16px',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                }}
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={handleDoubleTap}
            >
                <img
                    ref={imageRef}
                    src={currentImage?.url || currentImage}
                    alt={currentImage?.alt || `Image ${currentIndex + 1}`}
                    className={`select-none transition-transform duration-100 ${scale > 1 ? 'cursor-grab' : 'cursor-zoom-in'} ${isDragging ? 'cursor-grabbing' : ''}`}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                    }}
                    onMouseDown={handleMouseDown}
                    draggable={false}
                />
            </div>

            {/* Mobile Navigation & Zoom Controls */}
            <div className="absolute bottom-0 left-0 right-0 sm:hidden bg-gradient-to-t from-black/80 to-transparent p-4 pb-6">
                <div className="flex items-center justify-between gap-4">
                    {/* Prev */}
                    {images.length > 1 && (
                        <button
                            onClick={prevImage}
                            className="p-3 bg-white/10 rounded-full text-white backdrop-blur-sm"
                            aria-label="Previous"
                        >
                            <ChevronLeft size={24} />
                        </button>
                    )}

                    {/* Zoom Controls - Mobile */}
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                        <button
                            onClick={zoomOut}
                            disabled={scale <= MIN_SCALE}
                            className="p-2 text-white disabled:opacity-30 transition-colors"
                        >
                            <ZoomOut size={22} />
                        </button>
                        <span className="text-white text-sm font-medium min-w-[50px] text-center">
                            {Math.round(scale * 100)}%
                        </span>
                        <button
                            onClick={zoomIn}
                            disabled={scale >= MAX_SCALE}
                            className="p-2 text-white disabled:opacity-30 transition-colors"
                        >
                            <ZoomIn size={22} />
                        </button>
                    </div>

                    {/* Next */}
                    {images.length > 1 && (
                        <button
                            onClick={nextImage}
                            className="p-3 bg-white/10 rounded-full text-white backdrop-blur-sm"
                            aria-label="Next"
                        >
                            <ChevronRight size={24} />
                        </button>
                    )}
                </div>

                {/* Image Counter */}
                {images.length > 1 && (
                    <div className="text-center mt-3">
                        <span className="text-white/70 text-sm">
                            {currentIndex + 1} / {images.length}
                        </span>
                    </div>
                )}

                {/* Mobile Hint */}
                <p className="text-center text-white/50 text-xs mt-2">
                    Double-tap to zoom • Pinch to zoom • Drag to pan
                </p>
            </div>

            {/* Desktop Image Counter */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden sm:flex items-center gap-2">
                    {images.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => { setCurrentIndex(idx); resetZoom(); }}
                            className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'}`}
                            aria-label={`Go to image ${idx + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageLightbox;

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

/**
 * ProductCarousel Component
 * Horizontal scrollable carousel for products with navigation arrows
 */
const ProductCarousel = ({ products = [], loading = false }) => {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const updateScrollButtons = () => {
        const container = scrollRef.current;
        if (!container) return;
        setCanScrollLeft(container.scrollLeft > 5);
        setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 5);
    };

    useEffect(() => {
        updateScrollButtons();
        window.addEventListener('resize', updateScrollButtons);
        return () => window.removeEventListener('resize', updateScrollButtons);
    }, [products]);

    const scroll = (direction) => {
        const container = scrollRef.current;
        if (!container) return;
        const cardWidth = 280; // Approx width of product card
        const scrollAmount = cardWidth * 2;
        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
        setTimeout(updateScrollButtons, 400);
    };

    if (loading) {
        return (
            <div className="flex gap-4 overflow-hidden">
                {[...Array(4)].map((_, idx) => (
                    <div key={idx} className="flex-shrink-0 w-64 card p-4">
                        <div className="skeleton h-48 mb-4" />
                        <div className="skeleton h-4 w-3/4 mb-2" />
                        <div className="skeleton h-4 w-1/2" />
                    </div>
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return null;
    }

    return (
        <div className="relative">
            {/* Left Click Zone - Invisible clickable area on left side */}
            {canScrollLeft && (
                <div
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-0 bottom-0 w-12 z-10 cursor-pointer hover:bg-gradient-to-r hover:from-white/50 hover:to-transparent transition-all"
                    title="Scroll left"
                />
            )}

            {/* Scrollable Container */}
            <div
                ref={scrollRef}
                onScroll={updateScrollButtons}
                className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {products.map(product => (
                    <div key={product._id} className="flex-shrink-0 w-56 md:w-64">
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>

            {/* Right Click Zone - Invisible clickable area on right side */}
            {canScrollRight && (
                <div
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-0 bottom-0 w-12 z-10 cursor-pointer hover:bg-gradient-to-l hover:from-white/50 hover:to-transparent transition-all"
                    title="Scroll right"
                />
            )}
        </div>
    );
};

export default ProductCarousel;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * HeroCarousel Component
 * Auto-sliding hero banner carousel with 5 second intervals
 */
const HeroCarousel = ({ storeName, storeDescription }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            image: '/hero_banner_1_1767971868274.png',
            title: `Welcome to ${storeName}`,
            subtitle: storeDescription || 'Discover amazing products at great prices',
            cta: 'Shop Now',
            link: '/products'
        },
        {
            image: '/hero_banner_2_1767971896672.png',
            title: 'Summer Collection',
            subtitle: 'Hot deals on trending items. Limited time offer!',
            cta: 'Explore Deals',
            link: '/products'
        },
        {
            image: '/hero_banner_3_1767971923237.png',
            title: 'New Arrivals',
            subtitle: 'Check out the latest additions to our collection',
            cta: 'View Collection',
            link: '/products'
        }
    ];

    // Auto-slide every 5 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % slides.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [slides.length]);

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    const goToPrev = () => {
        setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
    };

    const goToNext = () => {
        setCurrentSlide(prev => (prev + 1) % slides.length);
    };

    return (
        <section className="relative w-full overflow-hidden aspect-[4/5] md:aspect-[16/9] lg:aspect-[21/9] max-h-[85vh]">
            {/* Slides */}
            <div
                className="flex transition-transform duration-700 ease-in-out h-full"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className="flex-shrink-0 w-full h-full relative"
                    >
                        {/* Background Image */}
                        <img
                            src={slide.image}
                            alt={slide.title}
                            className="w-full h-full object-cover"
                        />

                        {/* Overlay Content */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent">
                            <div className="container-custom h-full flex items-center">
                                <div className="max-w-xl text-white">
                                    <h1 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-lg">
                                        {slide.title}
                                    </h1>
                                    <p className="text-lg md:text-xl text-white/90 mb-6 drop-shadow">
                                        {slide.subtitle}
                                    </p>
                                    <Link
                                        to={slide.link}
                                        className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
                                    >
                                        {slide.cta}
                                        <ArrowRight size={18} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={goToPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors shadow-lg"
            >
                <ChevronLeft className="w-5 h-5 text-gray-800" />
            </button>
            <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors shadow-lg"
            >
                <ChevronRight className="w-5 h-5 text-gray-800" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentSlide
                            ? 'bg-white w-8'
                            : 'bg-white/50 hover:bg-white/80'
                            }`}
                    />
                ))}
            </div>
        </section>
    );
};

export default HeroCarousel;

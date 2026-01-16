import { useState, useEffect, useRef } from 'react';
import { ArrowRight , ChevronLeft, ChevronRight, Search, Filter, CheckCircle, ThumbsUp, ShieldCheck, Headphones, Lock, Calendar, Truck, Clock, ExternalLink, Eye, Ban, ChevronDown } from "lucide-react";
import { Link } from 'react-router-dom';
import { featureCardsAPI } from '../services/api';
import { useConfig } from '../context/ConfigContext';

/**
 * BannersCarousel Component
 * Displays promotional banners from admin-uploaded feature cards
 * Shows title/link overlay on left side of banner
 * Auto-slides and supports manual navigation
 */
const BannersCarousel = () => {
    const { isFeatureEnabled } = useConfig();
    const [cards, setCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const timerRef = useRef(null);

    const featureEnabled = isFeatureEnabled('featureCards');

    useEffect(() => {
        if (featureEnabled) {
            fetchCards();
        } else {
            setLoading(false);
        }
    }, [featureEnabled]);

    const fetchCards = async () => {
        try {
            const response = await featureCardsAPI.getAll();
            setCards(response.data.data.cards || []);
        } catch (err) {
            console.error('Failed to fetch feature cards:', err);
        } finally {
            setLoading(false);
        }
    };

    // Auto-slide every 5 seconds
    useEffect(() => {
        if (cards.length > 1) {
            timerRef.current = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % cards.length);
            }, 5000);

            return () => clearInterval(timerRef.current);
        }
    }, [cards.length]);

    const goToSlide = (index) => {
        setCurrentIndex(index);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % cards.length);
            }, 5000);
        }
    };

    const prevSlide = () => goToSlide((currentIndex - 1 + cards.length) % cards.length);
    const nextSlide = () => goToSlide((currentIndex + 1) % cards.length);

    // Don't render if feature disabled or no cards
    if (!featureEnabled || loading || cards.length === 0) {
        return null;
    }

    return (
        <section className="w-full mb-6 md:mb-8">
            <div className="relative overflow-hidden rounded-xl md:rounded-2xl shadow-lg">
                {/* Slides Container */}
                <div
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {cards.map((card, index) => (
                        <div key={card.id} className="w-full flex-shrink-0 relative">
                            {/* Banner Image */}
                            <img
                                src={card.image}
                                alt={card.title || `Banner ${index + 1}`}
                                className="w-full h-40 sm:h-52 md:h-64 lg:h-80 object-cover"
                            />

                            {/* Left Side Overlay - Title & Link */}
                            {(card.title || card.link) && (
                                <div className="absolute inset-y-0 left-0 w-full sm:w-1/2 flex items-center">
                                    {/* Gradient Background */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />

                                    {/* Content */}
                                    <div className="relative z-10 p-4 sm:p-6 md:p-8 lg:p-10">
                                        {card.title && (
                                            <h3 className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 md:mb-3 drop-shadow-lg leading-tight">
                                                {card.title}
                                            </h3>
                                        )}

                                        {card.link && (
                                            <Link
                                                to={card.link}
                                                className="inline-flex items-center gap-2 bg-white text-gray-900 px-4 py-2 md:px-6 md:py-2.5 rounded-full text-sm md:text-base font-semibold hover:bg-gray-100 transition-colors shadow-md"
                                            >
                                                Shop Now
                                                <ArrowRight size={16} className="md:w-5 md:h-5" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Navigation Arrows - Hidden on very small screens */}
                {cards.length > 1 && (
                    <>
                        <button
                            onClick={prevSlide}
                            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-1.5 md:p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors hidden sm:block"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft size={20} className="md:w-6 md:h-6" />
                        </button>
                        <button
                            onClick={nextSlide}
                            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-1.5 md:p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors hidden sm:block"
                            aria-label="Next slide"
                        >
                            <ChevronRight size={20} className="md:w-6 md:h-6" />
                        </button>
                    </>
                )}

                {/* Dot Indicators */}
                {cards.length > 1 && (
                    <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2">
                        {cards.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all ${index === currentIndex
                                        ? 'bg-white w-6 md:w-8'
                                        : 'bg-white/50 hover:bg-white/75'
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* Touch Swipe Indicators for Mobile */}
                {cards.length > 1 && (
                    <div className="absolute inset-0 sm:hidden flex">
                        <button
                            onClick={prevSlide}
                            className="w-1/4 h-full opacity-0"
                            aria-label="Previous"
                        />
                        <div className="flex-1" />
                        <button
                            onClick={nextSlide}
                            className="w-1/4 h-full opacity-0"
                            aria-label="Next"
                        />
                    </div>
                )}
            </div>
        </section>
    );
};

export default BannersCarousel;

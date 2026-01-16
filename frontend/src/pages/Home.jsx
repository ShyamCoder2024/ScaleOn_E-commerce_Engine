import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { productAPI, featureCardsAPI } from '../services/api';
import { useConfig } from '../context/ConfigContext';
import ProductCard from '../components/ProductCard';
import ServiceStrip from '../components/ServiceStrip';

// Admin Hero Carousel Component - Shows admin-uploaded banners
const AdminHeroCarousel = ({ cards }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const timerRef = useRef(null);

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

    return (
        <section className="relative w-full overflow-hidden aspect-[16/9] lg:h-[500px]">
            {/* Invisible Tap Navigation Layers */}
            <div
                className="absolute inset-y-0 left-0 w-1/2 z-20 cursor-pointer"
                onClick={prevSlide}
                aria-label="Previous Slide"
            />
            <div
                className="absolute inset-y-0 right-0 w-1/2 z-20 cursor-pointer"
                onClick={nextSlide}
                aria-label="Next Slide"
            />

            {/* Slides Container */}
            <div
                className="flex transition-transform duration-500 ease-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {cards.map((card, index) => (
                    <div key={card.id} className="w-full h-full flex-shrink-0 relative">
                        {/* Banner Image - Object Center to focus on main subject */}
                        <img
                            src={card.image}
                            alt={card.title || `Banner ${index + 1}`}
                            className="w-full h-full object-cover object-center"
                        />

                        {/* Left Side Overlay - Title & Link */}
                        {(card.title || card.link) && (
                            <div className="absolute inset-0 flex items-end md:items-center justify-start pointer-events-none">
                                {/* Enhanced Gradient for text readability */}
                                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

                                {/* Content */}
                                <div className="relative z-30 p-4 sm:p-8 md:p-12 lg:p-16 w-full md:max-w-xl pointer-events-auto mb-2 md:mb-0">
                                    {card.title && (
                                        <h2 className="text-white text-xl sm:text-3xl md:text-5xl font-bold mb-2 md:mb-4 drop-shadow-lg leading-tight">
                                            {card.title}
                                        </h2>
                                    )}

                                    {card.link && (
                                        <Link
                                            to={card.link}
                                            className="inline-flex items-center gap-2 bg-white text-gray-900 px-4 py-2 md:px-6 md:py-3 rounded-full font-bold text-xs md:text-base hover:bg-gray-50 transition-colors shadow-xl"
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

            {/* Dot Indicators */}
            {cards.length > 1 && (
                <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3">
                    {cards.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`h-2.5 md:h-3 rounded-full transition-all ${index === currentIndex
                                ? 'bg-white w-8 md:w-10'
                                : 'bg-white/50 hover:bg-white/75 w-2.5 md:w-3'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

const Home = () => {
    const { isFeatureEnabled } = useConfig();
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [featureCards, setFeatureCards] = useState([]);
    const [cardsLoading, setCardsLoading] = useState(true);

    const featureCardsEnabled = isFeatureEnabled('featureCards');

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                const response = await productAPI.getFeatured(8);
                setFeaturedProducts(response.data.data.products || []);
            } catch (err) {
                console.error('Failed to fetch featured products:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchFeatured();
    }, []);

    // Fetch admin feature cards only when feature is enabled
    useEffect(() => {
        const fetchCards = async () => {
            if (!featureCardsEnabled) {
                setFeatureCards([]);
                setCardsLoading(false);
                return;
            }
            try {
                const response = await featureCardsAPI.getAll();
                setFeatureCards(response.data.data.cards || []);
            } catch (err) {
                console.error('Failed to fetch feature cards:', err);
            } finally {
                setCardsLoading(false);
            }
        };

        fetchCards();
    }, [featureCardsEnabled]);

    // Only show hero carousel if feature is enabled AND cards exist
    const showHeroCarousel = featureCardsEnabled && featureCards.length > 0;

    return (
        <div>
            {/* Hero Section - ONLY shows if feature enabled AND admin has added cards */}
            {cardsLoading ? (
                // Loading skeleton for hero (only if feature enabled)
                featureCardsEnabled && (
                    <div className="h-48 sm:h-72 md:h-96 lg:h-[500px] bg-gray-200 animate-pulse" />
                )
            ) : showHeroCarousel ? (
                // Admin-uploaded feature cards as hero carousel
                <AdminHeroCarousel cards={featureCards} />
            ) : null}

            {/* Service/Features Strip */}
            <ServiceStrip />

            {/* Featured Products */}
            <section className="py-6 md:py-16 bg-gray-50/50">
                <div className="container-custom">
                    <div className="flex items-center justify-between mb-4 md:mb-10">
                        <div>
                            <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-1">
                                Featured Products
                            </h2>
                            <p className="text-sm md:text-base text-gray-500 hidden md:block">
                                Hand-picked items just for you
                            </p>
                        </div>
                        <Link to="/products" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 text-sm md:text-base">
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                            {[...Array(4)].map((_, idx) => (
                                <div key={idx} className="card animate-pulse">
                                    <div className="aspect-square bg-gray-200" />
                                    <div className="p-4 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : featuredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                            {featuredProducts.slice(0, 4).map(product => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p>No featured products yet.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* New Arrivals (Reusing Featured data for demo structure) */}
            <section className="py-6 md:py-16">
                <div className="container-custom">
                    <div className="flex items-center justify-between mb-4 md:mb-10">
                        <div>
                            <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-1">
                                New Arrivals
                            </h2>
                            <p className="text-sm md:text-base text-gray-500 hidden md:block">
                                The latest additions to our collection
                            </p>
                        </div>
                        <Link to="/products" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 text-sm md:text-base">
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                            {[...Array(4)].map((_, idx) => (
                                <div key={idx} className="card animate-pulse">
                                    <div className="aspect-square bg-gray-200" />
                                    <div className="p-4 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : featuredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                            {featuredProducts.slice(4, 8).length > 0 ?
                                featuredProducts.slice(4, 8).map(product => (
                                    <ProductCard key={`${product._id}-new`} product={product} />
                                )) :
                                featuredProducts.slice(0, 4).map(product => (
                                    <ProductCard key={`${product._id}-new-backup`} product={product} />
                                ))
                            }
                        </div>
                    ) : null}
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-primary-900 py-8 md:py-20 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

                <div className="container-custom text-center relative z-10 px-4">
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 md:mb-6">
                        Ready to Upgrade Your Lifestyle?
                    </h2>
                    <p className="text-primary-100 mb-8 md:mb-10 max-w-2xl mx-auto text-sm md:text-lg leading-relaxed">
                        Join thousands of happy customers who have transformed their daily lives with our premium quality products.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/products" className="bg-white text-primary-900 px-8 py-3.5 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-lg active:scale-95">
                            Start Shopping
                        </Link>
                        <Link to="/register" className="bg-transparent border-2 border-white text-white px-8 py-3.5 rounded-full font-bold hover:bg-white/10 transition-colors active:scale-95">
                            Create Account
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;

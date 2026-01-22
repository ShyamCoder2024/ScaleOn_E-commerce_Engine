import { Link } from 'react-router-dom';
import { ArrowRight, Star, TrendingUp, ShieldCheck, Truck, Clock } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { productAPI, featureCardsAPI } from '../services/api';
import { useConfig } from '../context/ConfigContext';
import ProductCard from '../components/ProductCard';

// Admin Hero Carousel Component - Redesigned for Maximum Impact
const AdminHeroCarousel = ({ cards }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const timerRef = useRef(null);

    // Auto-slide every 6 seconds
    useEffect(() => {
        if (cards.length > 1) {
            timerRef.current = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % cards.length);
            }, 6000);
            return () => clearInterval(timerRef.current);
        }
    }, [cards.length]);

    const goToSlide = (index) => {
        setCurrentIndex(index);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % cards.length);
            }, 6000);
        }
    };

    return (
        <section className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden">
            {/* Background Slides */}
            {cards.map((card, index) => (
                <div
                    key={card.id || index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                    <img
                        src={card.image}
                        alt={card.title || 'Welcome'}
                        className="w-full h-full object-cover object-center scale-105 animate-slow-zoom"
                    />
                    {/* Premium Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-90" />
                </div>
            ))}

            {/* Content Content */}
            <div className="absolute inset-0 z-20 flex items-center justify-center text-center px-4 sm:px-6">
                <div className="max-w-4xl w-full">
                    {cards.map((card, index) => (
                        <div
                            key={`content-${index}`}
                            className={`transition-all duration-700 transform ${index === currentIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 absolute inset-0 flex flex-col items-center justify-center pointer-events-none'}`}
                        >
                            {/* Animated Badge */}
                            {card.subtitle && (
                                <span className="inline-block px-4 py-1.5 mb-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-medium tracking-wider uppercase animate-fade-in">
                                    {card.subtitle}
                                </span>
                            )}

                            <h1 className="text-3xl sm:text-5xl md:text-7xl font-heading font-bold text-white mb-6 md:mb-8 leading-tight tracking-tight drop-shadow-xl">
                                {card.title || 'Elevate Your Lifestyle'}
                            </h1>

                            <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-md hidden sm:block">
                                {card.description || 'Discover our curated collection of premium products designed to enhance your everyday life.'}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full sm:w-auto px-4 sm:px-0">
                                <Link
                                    to={card.link || '/products'}
                                    className="btn-primary h-12 sm:h-14 px-8 sm:px-10 rounded-full text-base sm:text-lg font-bold shadow-xl hover:shadow-primary-500/30 hover:-translate-y-1 transition-all w-full sm:w-auto flex items-center justify-center gap-2"
                                >
                                    Shop Collection <ArrowRight size={20} />
                                </Link>
                                <Link
                                    to="/products?sort=-salesCount"
                                    className="h-12 sm:h-14 px-8 sm:px-10 rounded-full bg-white/10 backdrop-blur-md border border-white/30 text-white text-base sm:text-lg font-bold hover:bg-white/20 transition-all w-full sm:w-auto flex items-center justify-center"
                                >
                                    Best Sellers
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Progress Indicators */}
            {cards.length > 1 && (
                <div className="absolute bottom-10 left-0 right-0 z-30 flex justify-center gap-3">
                    {cards.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className="group relative h-1.5 w-16 bg-white/20 rounded-full overflow-hidden transition-all hover:bg-white/30"
                            aria-label={`Go to slide ${index + 1}`}
                        >
                            <div
                                className={`absolute left-0 top-0 bottom-0 bg-white rounded-full transition-all duration-[6000ms] ease-linear ${index === currentIndex ? 'w-full' : 'w-0'}`}
                            />
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
};

// Premium Service Strip
const FeatureStrip = () => {
    const features = [
        { icon: ShieldCheck, title: "Secure Payment", desc: "100% secure payment" },
        { icon: Truck, title: "Fast Shipping", desc: "Free on orders over $100" },
        { icon: Star, title: "Quality Guarantee", desc: "30-day money back" },
        { icon: Clock, title: "24/7 Support", desc: "We are here to help" },
    ];

    return (
        <div className="relative z-20 mt-6 sm:-mt-16 container-custom">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 md:p-8">
                {features.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-4 group p-2 rounded-xl hover:bg-primary-50 transition-colors">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-100/50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all duration-300 shadow-sm shrink-0">
                            <item.icon size={20} className="sm:w-6 sm:h-6" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-xs sm:text-base mb-0.5">{item.title}</h4>
                            <p className="text-gray-500 text-[10px] sm:text-sm leading-tight">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Home = () => {
    const { isFeatureEnabled } = useConfig();
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [featureCards, setFeatureCards] = useState([]);
    const [cardsLoading, setCardsLoading] = useState(true);

    const isMountedRef = useRef(true);
    const fetchControllerRef = useRef(null);
    const hasLoadedProductsRef = useRef(false);

    const featureCardsEnabled = isFeatureEnabled('featureCards');

    useEffect(() => {
        isMountedRef.current = true;
        const controller = new AbortController();
        fetchControllerRef.current = controller;

        const fetchAllData = async () => {
            try {
                const fetchPromises = [
                    productAPI.getFeatured(8).catch(err => {
                        console.error('Failed to fetch featured products:', err);
                        return null;
                    })
                ];

                if (featureCardsEnabled) {
                    fetchPromises.push(
                        featureCardsAPI.getAll().catch(err => {
                            console.error('Failed to fetch feature cards:', err);
                            return null;
                        })
                    );
                }

                const results = await Promise.all(fetchPromises);

                if (!isMountedRef.current) return;

                const productsResult = results[0];
                if (productsResult?.data?.data?.products) {
                    setFeaturedProducts(productsResult.data.data.products);
                    hasLoadedProductsRef.current = true;
                    setError(null);
                }

                if (featureCardsEnabled && results[1]?.data?.data?.cards) {
                    setFeatureCards(results[1].data.data.cards);
                }

            } catch (err) {
                console.error('Unexpected error in fetchAllData:', err);
            } finally {
                if (isMountedRef.current) {
                    setLoading(false);
                    setCardsLoading(false);
                }
            }
        };

        fetchAllData();

        return () => {
            isMountedRef.current = false;
            if (fetchControllerRef.current) {
                fetchControllerRef.current.abort();
            }
        };
    }, [featureCardsEnabled]);

    const showHeroCarousel = featureCardsEnabled && featureCards.length > 0;

    return (
        <div className="bg-gray-50/50 min-h-screen pb-20">
            {/* Hero Section */}
            {cardsLoading ? (
                <div className="h-[600px] w-full bg-gray-200 animate-pulse sticky top-0" />
            ) : showHeroCarousel ? (
                <AdminHeroCarousel cards={featureCards} />
            ) : (
                // Fallback Hero if no admin cards
                <section className="relative w-full h-[500px] md:h-[600px] bg-gray-900 flex items-center justify-center text-center px-4 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-950" />
                    <div className="relative z-10 max-w-3xl animate-slide-up">
                        <span className="inline-block px-4 py-1.5 mb-6 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white text-sm font-medium tracking-wider uppercase">
                            New Collection 2026
                        </span>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-8 tracking-tight">
                            Redefining Modern <span className="text-primary-400">Commerce</span>
                        </h1>
                        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                            Experience the future of online shopping with our curated selection of premium products.
                        </p>
                        <Link to="/products" className="btn-primary h-14 px-10 rounded-full text-lg shadow-xl hover:shadow-primary-500/30">
                            Start Exploring
                        </Link>
                    </div>
                </section>
            )}

            <FeatureStrip />

            {/* Featured Section */}
            <section className="py-20 md:py-32">
                <div className="container-custom">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 text-center md:text-left">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-3 tracking-tight">
                                Featured Collection
                            </h2>
                            <p className="text-gray-500 text-lg max-w-xl mx-auto md:mx-0">
                                Curated hand-picked items that define style and quality.
                            </p>
                        </div>
                        <Link
                            to="/products"
                            className="group inline-flex items-center gap-2 text-primary-600 font-bold hover:text-primary-700 transition-colors mx-auto md:mx-0"
                        >
                            View All Products
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                            {[...Array(4)].map((_, idx) => (
                                <div key={idx} className="card h-[400px] animate-pulse bg-white border-0 shadow-sm" />
                            ))}
                        </div>
                    ) : Array.isArray(featuredProducts) && featuredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                            {featuredProducts
                                .filter(p => p && p._id) // Filter out invalid products
                                .slice(0, 4)
                                .map(product => (
                                    <div key={product._id} className="animate-fade-in">
                                        <ProductCard product={product} />
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                            <p className="text-gray-400 text-lg">No featured products available at the moment.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Banner / CTA Break */}
            <section className="py-16 bg-gray-900 text-white overflow-hidden relative mb-20">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center bg-fixed" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 to-gray-900/90" />

                <div className="container-custom relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="max-w-2xl text-center md:text-left">
                            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 leading-tight">
                                Unlock Premium Members Benefits
                            </h2>
                            <p className="text-primary-100 text-lg mb-8 leading-relaxed opacity-90">
                                Join our exclusive community to get early access to sales, special discounts, and personalized recommendations.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                <Link to="/register" className="btn-primary bg-white text-primary-600 hover:bg-gray-100 h-12 px-8 rounded-full border-0">
                                    Become a Member
                                </Link>
                                <Link to="/login" className="px-8 h-12 flex items-center justify-center rounded-full border border-white/30 hover:bg-white/10 font-bold transition-all">
                                    Sign In
                                </Link>
                            </div>
                        </div>
                        <div className="hidden lg:block relative">
                            <div className="w-64 h-64 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl rotate-6 shadow-2xl flex items-center justify-center border border-white/20 backdrop-blur-sm">
                                <TrendingUp size={80} className="text-white opacity-90" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* New Arrivals Section */}
            <section className="pb-32">
                <div className="container-custom">
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 tracking-tight">
                            New Arrivals
                        </h2>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                            {[...Array(4)].map((_, idx) => (
                                <div key={idx} className="card h-[400px] animate-pulse bg-white border-0 shadow-sm" />
                            ))}
                        </div>
                    ) : featuredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                            {featuredProducts.slice(4, 8).length > 0 ?
                                featuredProducts.slice(4, 8).map(product => (
                                    <div key={product._id} className="animate-fade-in">
                                        <ProductCard product={product} />
                                    </div>
                                )) :
                                featuredProducts.slice(0, 4).map(product => (
                                    <div key={`${product._id}-dup`} className="animate-fade-in">
                                        <ProductCard product={product} />
                                    </div>
                                ))
                            }
                        </div>
                    ) : null}
                </div>
            </section>
        </div>
    );
};

export default Home;

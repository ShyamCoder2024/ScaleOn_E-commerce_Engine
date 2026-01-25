import { Link } from 'react-router-dom';
import {
    ArrowRight, Star, TrendingUp, ShieldCheck, Truck, Clock,
    Smartphone, Shirt, BookOpen, Home as HomeIcon, Sparkles, Dumbbell,
    Watch, Headphones, Monitor, Grid, Gift
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { productAPI, featureCardsAPI, categoryAPI } from '../services/api';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';

// Helper to map category names to icons
const getCategoryIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes('phone') || n.includes('mobile')) return <Smartphone size={24} />;
    if (n.includes('fashion') || n.includes('cloth') || n.includes('shirt')) return <Shirt size={24} />;
    if (n.includes('book')) return <BookOpen size={24} />;
    if (n.includes('home') || n.includes('living')) return <HomeIcon size={24} />;
    if (n.includes('beauty') || n.includes('makeup')) return <Sparkles size={24} />;
    if (n.includes('sport') || n.includes('fit')) return <Dumbbell size={24} />;
    if (n.includes('watch')) return <Watch size={24} />;
    if (n.includes('audio') || n.includes('headphone')) return <Headphones size={24} />;
    if (n.includes('computer') || n.includes('laptop') || n.includes('electron')) return <Monitor size={24} />;
    if (n.includes('gift')) return <Gift size={24} />;
    return <Grid size={24} />;
};

// AdminHeroCarousel - Strict 16:9 Ratio for Banners/Deals
const AdminHeroCarousel = ({ cards }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-slide
    useEffect(() => {
        if (cards.length > 1) {
            const timer = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % cards.length);
            }, 6000);
            return () => clearInterval(timer);
        }
    }, [cards.length]);

    const goToSlide = (index) => setCurrentIndex(index);

    return (
        <section className="container-custom pt-4 pb-2 md:pt-6 md:pb-4">
            {/* 16:9 Aspect Ratio Banner Container */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-sm bg-gray-100 ring-1 ring-gray-900/5">
                {/* Slides */}
                {cards.map((card, index) => (
                    <div
                        key={card.id || index}
                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    >
                        <img
                            src={card.image}
                            alt={card.title || 'Banner'}
                            className="w-full h-full object-cover"
                        />
                        {/* Overlay text - Optional, primarily reliance on the Banner Image itself for "Deals" */}
                        {(card.title || card.subtitle) && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4 md:p-8">
                                {card.subtitle && (
                                    <span className="text-white/95 text-[10px] md:text-sm font-bold mb-1.5 inline-block px-2 py-0.5 bg-black/40 rounded backdrop-blur-sm w-fit uppercase tracking-wider">
                                        {card.subtitle}
                                    </span>
                                )}
                                <h2 className="text-white text-lg md:text-4xl lg:text-5xl font-heading font-bold drop-shadow-md leading-tight mb-2 md:mb-4">
                                    {card.title}
                                </h2>
                                {card.link && (
                                    <Link to={card.link} className="absolute inset-0" aria-label={`Shop ${card.title}`} />
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {/* Dots */}
                {cards.length > 1 && (
                    <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
                        {cards.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`h-1.5 rounded-full transition-all shadow-sm ${index === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
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

// Category Grid - Clean, Logo-centric Grid (No Scroll)
const CategoryGrid = ({ categories }) => {
    if (!categories || categories.length === 0) return null;

    return (
        <section className="py-2 md:py-6">
            <div className="container-custom">
                <div className="flex items-center justify-between mb-4 md:mb-8">
                    <h3 className="text-lg md:text-2xl font-bold text-gray-900 tracking-tight">Browse Categories</h3>
                </div>

                {/* 3-Column Grid on Mobile, 6 on Desktop */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-6">
                    {categories.map((cat, idx) => (
                        <Link
                            key={cat._id || idx}
                            to={`/products?category=${cat._id}`}
                            className="
                                flex flex-col items-center gap-2 group
                                p-3 rounded-xl hover:bg-gray-50 transition-colors
                            "
                        >
                            <div className="
                                w-14 h-14 md:w-20 md:h-20 
                                flex items-center justify-center 
                                text-primary-600 bg-primary-50/50 rounded-2xl
                                group-hover:bg-primary-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary-500/20
                                transition-all duration-300
                            ">
                                {getCategoryIcon(cat.name)}
                            </div>

                            <span className="
                                text-xs md:text-sm font-bold text-gray-700 text-center 
                                line-clamp-1 max-w-full
                                group-hover:text-primary-700
                            ">
                                {cat.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Home = () => {
    const { isFeatureEnabled } = useConfig();
    const { isAuthenticated } = useAuth(); // Get auth state
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [newArrivals, setNewArrivals] = useState([]); // Separate state for true new arrivals
    const [categories, setCategories] = useState([]);
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
                // Fetch Featured Products, New Arrivals, Feature Cards, AND Categories
                const fetchPromises = [
                    // 1. Featured Products (curated)
                    productAPI.getFeatured(8).catch(err => {
                        console.error('Failed to fetch featured products:', err);
                        return null;
                    }),
                    // 2. New Arrivals (sorted by creation date)
                    productAPI.getProducts({ sort: '-createdAt', limit: 8 }).catch(err => {
                        console.error('Failed to fetch new arrivals:', err);
                        return null;
                    }),
                    // 3. Categories
                    categoryAPI.getCategories().catch(err => {
                        console.error('Failed to fetch categories:', err);
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

                // Process Featured
                const productsResult = results[0];
                if (productsResult?.data?.data?.products) {
                    setFeaturedProducts(productsResult.data.data.products);
                    hasLoadedProductsRef.current = true;
                    setError(null);
                }

                // Process New Arrivals
                const newArrivalsResult = results[1];
                if (newArrivalsResult?.data?.data?.products) {
                    setNewArrivals(newArrivalsResult.data.data.products);
                } else if (newArrivalsResult?.data?.data?.items) {
                    setNewArrivals(newArrivalsResult.data.data.items);
                }

                const catsResult = results[2];
                if (catsResult?.data?.data?.categories) {
                    setCategories(catsResult.data.data.categories);
                }

                if (featureCardsEnabled && results[3]?.data?.data?.cards) {
                    setFeatureCards(results[3].data.data.cards);
                }

            } catch (err) {
                console.error('Unexpected error in fetchAllData:', err);
                if (isMountedRef.current) {
                    setError('Something went wrong. Please try refreshing the page.');
                }
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
        <div className="bg-gray-50/50 min-h-screen pb-12 md:pb-20">
            {/* Hero Section */}
            {cardsLoading ? (
                <div className="h-[300px] w-full bg-gray-200 animate-pulse sticky top-0" />
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

            {/* Replaced 'Ugly' Feature Strip with Category Grid */}
            <CategoryGrid categories={categories} />

            {/* New Arrivals Section (Now ABOVE Featured) */}
            <section className="py-8 md:py-20">
                <div className="container-custom">
                    <div className="flex items-center justify-between mb-6 md:mb-12">
                        <h2 className="text-2xl md:text-4xl font-heading font-bold text-gray-900 tracking-tight">
                            New Arrivals
                        </h2>
                        <Link
                            to="/products?sort=-createdAt"
                            className="group inline-flex items-center gap-2 text-primary-600 font-bold hover:text-primary-700 transition-colors"
                        >
                            View All
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                            {[...Array(4)].map((_, idx) => (
                                <div key={idx} className="card h-[400px] animate-pulse bg-white border-0 shadow-sm" />
                            ))}
                        </div>
                    ) : Array.isArray(newArrivals) && newArrivals.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                            {newArrivals.slice(0, 4).map(product => (
                                <div key={product._id} className="animate-fade-in">
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            </section>

            {/* Banner / CTA Break - HIDDEN FOR LOGGED IN USERS */}
            {!isAuthenticated && (
                <section className="py-12 md:py-16 bg-gray-900 text-white overflow-hidden relative mb-12 md:mb-20">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center bg-fixed" />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 to-gray-900/90" />

                    <div className="container-custom relative z-10">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                            <div className="max-w-2xl text-center md:text-left">
                                <h2 className="text-2xl md:text-5xl font-heading font-bold mb-4 md:mb-6 leading-tight">
                                    Unlock Premium Members Benefits
                                </h2>
                                <p className="text-primary-100 text-base md:text-lg mb-8 leading-relaxed opacity-90">
                                    Join our exclusive community to get early access to sales, special discounts, and personalized recommendations.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                    <Link to="/register" className="btn-primary bg-white text-primary-600 hover:bg-gray-100 h-12 px-8 rounded-full border-0">
                                        Create Account
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
            )}

            {/* Featured Section (Now BELOW New Arrivals) */}
            <section className="pb-8 md:pb-16">
                <div className="container-custom">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-12 gap-4 text-center md:text-left">
                        <div>
                            {/* Adjusted Font Size for Mobile */}
                            <h2 className="text-2xl md:text-4xl font-heading font-bold text-gray-900 mb-2 md:mb-3 tracking-tight">
                                Featured Collection
                            </h2>
                            <p className="text-gray-500 text-sm md:text-lg max-w-xl mx-auto md:mx-0">
                                Curated hand-picked items that define style and quality.
                            </p>
                        </div>
                        <Link
                            to="/products?featured=true"
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
        </div>
    );
};

export default Home;

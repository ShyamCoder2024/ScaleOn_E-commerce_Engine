import { Truck, Shield, Headphones, ShoppingBag } from 'lucide-react';

/**
 * FeatureCardsCarousel Component
 * Continuously moving ticker for homepage feature cards - compact, smooth scrolling
 */
const FeatureCardsCarousel = () => {
    const features = [
        { icon: Truck, title: 'Free Shipping', description: 'Orders above ₹999' },
        { icon: Shield, title: 'Secure Payment', description: '100% secure' },
        { icon: Headphones, title: '24/7 Support', description: 'Always available' },
        { icon: ShoppingBag, title: 'Easy Returns', description: '7-day policy' },
    ];

    // Triple for seamless infinite loop
    const allFeatures = [...features, ...features, ...features, ...features];

    return (
        <section className="bg-gray-900 overflow-hidden py-2.5">
            <div
                className="flex whitespace-nowrap"
                style={{
                    animation: 'marquee 25s linear infinite',
                    width: 'max-content'
                }}
            >
                {allFeatures.map((feature, idx) => (
                    <div
                        key={idx}
                        className="flex items-center gap-2 mx-6 flex-shrink-0"
                    >
                        <feature.icon className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium text-white">{feature.title}</span>
                        <span className="text-xs text-gray-400">— {feature.description}</span>
                    </div>
                ))}
            </div>

            {/* Inline keyframes that work in React */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-50%); }
                }
            `}} />
        </section>
    );
};

export default FeatureCardsCarousel;

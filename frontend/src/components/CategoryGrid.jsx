import { Link } from 'react-router-dom';
import { ArrowRight, Smartphone, Shirt, Home, Trophy } from 'lucide-react';

const CATEGORIES = [
    {
        id: 1,
        name: "Electronics",
        slug: "electronics",
        icon: <Smartphone size={24} />,
        color: "bg-blue-100 text-blue-600",
        count: "120+"
    },
    {
        id: 2,
        name: "Fashion",
        slug: "fashion",
        icon: <Shirt size={24} />,
        color: "bg-pink-100 text-pink-600",
        count: "350+"
    },
    {
        id: 3,
        name: "Home",
        slug: "home-living",
        icon: <Home size={24} />,
        color: "bg-orange-100 text-orange-600",
        count: "85+"
    },
    {
        id: 4,
        name: "Sports",
        slug: "sports",
        icon: <Trophy size={24} />,
        color: "bg-green-100 text-green-600",
        count: "40+"
    }
];

const CategoryGrid = () => {
    return (
        <section className="py-6 md:py-12 bg-white">
            <div className="container-custom">
                <div className="flex items-center justify-between mb-4 md:mb-8">
                    <h2 className="text-lg md:text-2xl font-bold text-gray-900">
                        Shop by Category
                    </h2>
                    <Link to="/products" className="flex items-center gap-1 text-primary-600 font-medium hover:text-primary-700 text-sm md:text-base">
                        View All <ArrowRight size={16} />
                    </Link>
                </div>

                <div className="grid grid-cols-4 gap-2 md:gap-6">
                    {CATEGORIES.map((cat) => (
                        <Link
                            key={cat.id}
                            to={`/products?category=${cat.slug}`}
                            className="group flex flex-col items-center gap-2"
                        >
                            <div className={`w-14 h-14 md:w-24 md:h-24 rounded-full flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                                <div className="scale-100 md:scale-150">
                                    {cat.icon}
                                </div>
                            </div>

                            <div className="text-center">
                                <h3 className="text-gray-900 text-xs md:text-base font-semibold">
                                    {cat.name}
                                </h3>
                                <p className="text-gray-500 text-[10px] md:text-sm hidden md:block">
                                    {cat.count} Items
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CategoryGrid;

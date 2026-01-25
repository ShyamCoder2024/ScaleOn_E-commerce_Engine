import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getCategoryIcon } from '../utils/categoryHelpers';

const CategoryGrid = ({ categories = [] }) => {
    // Determine which categories to show (limit to 6 for Home)
    const displayCategories = categories.length > 0 ? categories.slice(0, 6) : [];

    if (categories.length === 0) return null;

    return (
        <section className="py-8 md:py-12 bg-white">
            <div className="container-custom">
                <div className="flex items-center justify-between mb-6 md:mb-10">
                    <h2 className="text-xl md:text-3xl font-heading font-bold text-gray-900">
                        Browse Categories
                    </h2>
                    <Link to="/categories" className="group flex items-center gap-1.5 text-primary-600 font-bold hover:text-primary-700 text-sm md:text-base transition-colors">
                        View All <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-8">
                    {displayCategories.map((cat) => (
                        <Link
                            key={cat._id}
                            to={`/products?category=${cat._id}`}
                            className="group flex flex-col items-center gap-3"
                        >
                            <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl bg-gray-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-sm">
                                <div className="scale-100 md:scale-150">
                                    {getCategoryIcon(cat.name)}
                                </div>
                            </div>

                            <div className="text-center">
                                <h3 className="text-gray-900 text-xs md:text-base font-bold truncate w-full px-2 group-hover:text-primary-600 transition-colors">
                                    {cat.name}
                                </h3>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CategoryGrid;

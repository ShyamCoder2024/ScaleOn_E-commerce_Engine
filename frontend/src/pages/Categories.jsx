import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoryAPI } from '../services/api';
import { getCategoryIcon } from '../utils/categoryHelpers';
import { ArrowLeft, Search } from 'lucide-react';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await categoryAPI.getCategories();
                if (response.data?.data?.categories) {
                    setCategories(response.data.data.categories);
                }
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 py-4 md:py-6">
                <div className="container-custom">
                    <div className="flex items-center gap-4 mb-4">
                        <Link to="/" className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft size={24} />
                        </Link>
                        <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">
                            All Categories
                        </h1>
                    </div>

                    {/* Search */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Find a category..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-100 border-transparent focus:bg-white focus:border-primary-500 rounded-xl transition-all outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="container-custom py-8">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl h-32 animate-pulse shadow-sm" />
                        ))}
                    </div>
                ) : filteredCategories.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {filteredCategories.map((cat) => (
                            <Link
                                key={cat._id}
                                to={`/products?category=${cat._id}`}
                                className="group flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-300"
                            >
                                <div className="w-16 h-16 mb-4 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all duration-300 transform group-hover:scale-110">
                                    {getCategoryIcon(cat.name)}
                                </div>
                                <h3 className="text-center font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
                                    {cat.name}
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    Browse Products
                                </p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-lg">No categories found matching "{filter}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Categories;

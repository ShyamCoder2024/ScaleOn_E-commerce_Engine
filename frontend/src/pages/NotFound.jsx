import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="text-8xl font-bold text-gray-200 mb-4">404</div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Page not found
                </h1>

                <p className="text-gray-500 mb-8">
                    Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>

                    <Link
                        to="/"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        Homepage
                    </Link>

                    <Link
                        to="/products"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Search className="w-4 h-4" />
                        Browse Products
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFound;

import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16'
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <Loader2 className={`${sizes[size]} animate-spin text-blue-600`} />
        </div>
    );
};

const PageLoader = () => (
    <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-500 mt-4">Loading...</p>
        </div>
    </div>
);

const FullPageLoader = () => (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
            <LoadingSpinner size="xl" />
            <p className="text-gray-600 mt-4 font-medium">Please wait...</p>
        </div>
    </div>
);

const ButtonLoader = ({ text = 'Loading...' }) => (
    <span className="inline-flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        {text}
    </span>
);

export { LoadingSpinner, PageLoader, FullPageLoader, ButtonLoader };
export default LoadingSpinner;

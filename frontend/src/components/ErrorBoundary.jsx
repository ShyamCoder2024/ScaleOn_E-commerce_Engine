import { Component } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        // Log to error tracking service in production
        console.error('Error caught by boundary:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center border border-gray-100">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                            Oops! Something went wrong
                        </h1>

                        <p className="text-gray-500 mb-8 text-sm sm:text-base leading-relaxed">
                            We're having trouble loading this page. It's not you, it's us. Please try refreshing the page.
                        </p>

                        {import.meta.env.MODE === 'development' && this.state.error && (
                            <details className="mb-6 text-left border rounded-lg p-2 bg-gray-50">
                                <summary className="cursor-pointer text-xs font-mono text-gray-500 hover:text-gray-700 select-none">
                                    Technical Details (Dev Only)
                                </summary>
                                <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded-lg text-xs overflow-auto max-h-40 whitespace-pre-wrap break-all">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors shadow-sm hover:shadow active:scale-95 transform duration-100"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </button>

                            <Link
                                to="/"
                                onClick={this.handleReset}
                                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-full font-medium hover:bg-gray-50 transition-colors hover:border-gray-300 active:scale-95 transform duration-100"
                            >
                                <Home className="w-4 h-4" />
                                Go Home
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

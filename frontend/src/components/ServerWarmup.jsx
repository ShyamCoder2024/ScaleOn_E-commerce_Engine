import { useState, useEffect } from 'react';
import { configAPI } from '../services/api';
import { Loader2, ServerCog } from 'lucide-react';

/**
 * ServerWarmup - Shows a friendly message when the backend is cold starting.
 * 
 * Free-tier hosting (Render, Railway, etc.) spins down servers after inactivity.
 * This can cause 15-30 second delays on first load. This component provides
 * a nice UX message instead of a blank screen.
 */
const ServerWarmup = ({ children }) => {
    const [isWakingUp, setIsWakingUp] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);

    useEffect(() => {
        let timeoutId = null;
        let isMounted = true;

        const checkServer = async () => {
            const startTime = Date.now();

            // Set a timer: if we don't get a response in 3 seconds, show the warmup message
            timeoutId = setTimeout(() => {
                if (isMounted && !isReady) {
                    setIsWakingUp(true);
                    setShowOverlay(true);
                }
            }, 3000);

            try {
                // Quick ping to the backend
                await configAPI.getPublic();

                const elapsed = Date.now() - startTime;
                console.log(`Backend responded in ${elapsed}ms`);

                if (isMounted) {
                    clearTimeout(timeoutId);
                    setIsReady(true);
                    setIsWakingUp(false);

                    // Fade out the overlay smoothly
                    setTimeout(() => {
                        if (isMounted) setShowOverlay(false);
                    }, 300);
                }
            } catch (err) {
                console.error('Server warmup check failed:', err);
                // Still allow the app to proceed - the error will be handled by the actual components
                if (isMounted) {
                    clearTimeout(timeoutId);
                    setIsReady(true);
                    setShowOverlay(false);
                }
            }
        };

        checkServer();

        return () => {
            isMounted = false;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []);

    return (
        <>
            {/* Warmup Overlay */}
            {showOverlay && (
                <div
                    className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-500 ${isReady ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                >
                    <div className="text-center p-8 max-w-md">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 mb-6">
                            {isWakingUp ? (
                                <ServerCog className="w-10 h-10 text-primary-600 animate-spin-slow" />
                            ) : (
                                <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                            )}
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 mb-3">
                            {isWakingUp ? 'Server is Waking Up' : 'Loading...'}
                        </h2>

                        {isWakingUp && (
                            <>
                                <p className="text-gray-500 mb-4 leading-relaxed">
                                    Our server was resting to save resources.
                                    It's waking up now and will be ready in just a moment!
                                </p>
                                <div className="flex items-center justify-center gap-2 text-sm text-primary-600">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>This usually takes 10-20 seconds...</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Actual App Content */}
            {children}
        </>
    );
};

export default ServerWarmup;

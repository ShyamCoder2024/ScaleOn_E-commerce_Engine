import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

const OfflineIndicator = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Show reconnected message briefly
            setShowBanner(true);
            setTimeout(() => setShowBanner(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowBanner(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!showBanner && isOnline) return null;

    return (
        <div
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-300 ${isOnline
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                }`}
        >
            {isOnline ? (
                <>
                    <Wifi className="w-4 h-4" />
                    <span className="text-sm font-medium">Back online</span>
                </>
            ) : (
                <>
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm font-medium">You're offline</span>
                </>
            )}
        </div>
    );
};

export default OfflineIndicator;

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OrderSuccessOverlay = ({ onComplete }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        // Start animation sequence
        setTimeout(() => setShowContent(true), 100);

        // Auto-dismiss after 3 seconds
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onComplete) setTimeout(onComplete, 500); // Allow fade out time
        }, 3000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!isVisible) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-green-500 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className={`flex flex-col items-center text-white transition-all duration-700 transform ${showContent ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>

                {/* Visual Circle with Checkmark */}
                <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                    {/* Ring Pulse Animation */}
                    <div className="absolute inset-0 border-4 border-white/30 rounded-full animate-ping" />
                    <div className="absolute inset-0 border-4 border-white rounded-full shadow-2xl" />

                    {/* Checkmark Animation */}
                    <svg
                        className="w-16 h-16 text-white drop-shadow-md"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                            className="checkmark-path"
                        />
                    </svg>
                </div>

                <h1 className="text-3xl md:text-5xl font-bold mb-3 text-center drop-shadow-md tracking-tight">
                    Order Placed!
                </h1>
                <p className="text-green-100 text-lg md:text-xl font-medium tracking-wide">
                    Redirecting to details...
                </p>
            </div>

            <style>{`
                .checkmark-path {
                    stroke-dasharray: 24;
                    stroke-dashoffset: 24;
                    animation: drawCheck 0.6s 0.4s cubic-bezier(0.65, 0, 0.45, 1) forwards;
                }
                
                @keyframes drawCheck {
                    100% {
                        stroke-dashoffset: 0;
                    }
                }
            `}</style>
        </div>
    );
};

export default OrderSuccessOverlay;

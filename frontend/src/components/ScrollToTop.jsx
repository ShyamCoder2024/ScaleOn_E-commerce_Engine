import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop - Scrolls to top on every route change
 * This is a universal fix to ensure pages always open from the top
 */
const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Disable browser's default scroll restoration to prevent conflicts
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }

        // Force scroll to top instantly
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant' // Instant jump to top, no animation
        });

        // Fallback: Also scroll the body/html just in case
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }, [pathname]);

    return null;
};

export default ScrollToTop;

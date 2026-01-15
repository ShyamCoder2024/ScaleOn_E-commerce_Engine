import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop - Scrolls to top on every route change
 * This is a universal fix to ensure pages always open from the top
 */
const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Scroll to top on route change
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
};

export default ScrollToTop;

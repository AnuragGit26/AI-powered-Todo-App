import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
    children: React.ReactNode;
}

/**
 * PageTransition component provides smooth animations between page transitions
 * Optimized for both web and PWA experiences with hardware acceleration
 * Mobile-optimized with reduced animation complexity
 */
const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' && window.innerWidth < 768
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 767px)');
        const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
            setIsMobile(e.matches);
        };
        handleChange(mediaQuery);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Animation variants optimized for performance
    // Using transform and opacity for GPU acceleration
    // Shorter durations on mobile for better performance
    const pageVariants = {
        initial: {
            opacity: 0,
            ...(isMobile ? {} : { scale: 0.98, y: 10 }), // Simpler on mobile
        },
        animate: {
            opacity: 1,
            ...(isMobile ? {} : { scale: 1, y: 0 }),
            transition: {
                duration: isMobile ? 0.2 : 0.4, // Faster on mobile
                ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
                when: "beforeChildren",
            }
        },
        exit: {
            opacity: 0,
            ...(isMobile ? {} : { scale: 0.98, y: -10 }),
            transition: {
                duration: isMobile ? 0.15 : 0.3, // Faster on mobile
                ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
            }
        }
    };

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="page-transition-wrapper"
                style={{
                    width: '100%',
                    height: '100%',
                }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
};

export default PageTransition;

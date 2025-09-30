import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
    children: React.ReactNode;
}

/**
 * PageTransition component provides smooth animations between page transitions
 * Optimized for both web and PWA experiences with hardware acceleration
 */
const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
    const location = useLocation();

    // Animation variants optimized for performance
    // Using transform and opacity for GPU acceleration
    const pageVariants = {
        initial: {
            opacity: 0,
            scale: 0.98,
            y: 10,
        },
        animate: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                duration: 0.4,
                ease: [0.25, 0.1, 0.25, 1], // Custom easing for smooth feel
                when: "beforeChildren",
            }
        },
        exit: {
            opacity: 0,
            scale: 0.98,
            y: -10,
            transition: {
                duration: 0.3,
                ease: [0.25, 0.1, 0.25, 1],
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

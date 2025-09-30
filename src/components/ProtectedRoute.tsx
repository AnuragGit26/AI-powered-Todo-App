import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ProtectedRouteProps {
    isAuthenticated: boolean;
    children: React.ReactNode;
}

/**
 * ProtectedRoute component with graceful transition animations
 * Optimized for both web and PWA experiences
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ isAuthenticated, children }) => {
    const [shouldRedirect, setShouldRedirect] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            // Small delay to allow any exit animations to complete
            const timer = setTimeout(() => {
                setShouldRedirect(true);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        if (shouldRedirect) {
            return <Navigate to="/login" replace />;
        }
        // Show a brief fade-out while preparing to redirect
        return (
            <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="min-h-screen"
            />
        );
    }
    
    return <>{children}</>;
};

export default ProtectedRoute;
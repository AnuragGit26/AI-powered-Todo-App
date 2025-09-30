import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface SessionTransitionProps {
    show: boolean;
    onComplete?: () => void;
}

/**
 * SessionTransition component displays a graceful animation when a session is detected
 * Shows a "Session Found" message with smooth transitions
 * Optimized for both web and PWA experiences
 */
const SessionTransition: React.FC<SessionTransitionProps> = ({ show, onComplete }) => {
    const [isVisible, setIsVisible] = useState(show);

    useEffect(() => {
        if (show) {
            setIsVisible(true);
            // Auto-hide after animation completes
            const timer = setTimeout(() => {
                setIsVisible(false);
                onComplete?.();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    style={{
                        willChange: 'opacity',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: -10 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                        }}
                        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md mx-4"
                        style={{
                            willChange: 'transform, opacity',
                        }}
                    >
                        <div className="flex flex-col items-center text-center space-y-4">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 15,
                                    delay: 0.2,
                                }}
                            >
                                <div className="relative">
                                    <CheckCircle2 
                                        className="w-16 h-16 text-green-500" 
                                        strokeWidth={2}
                                    />
                                    <motion.div
                                        className="absolute inset-0 rounded-full bg-green-500/20"
                                        initial={{ scale: 1, opacity: 0.8 }}
                                        animate={{ scale: 1.5, opacity: 0 }}
                                        transition={{
                                            duration: 1,
                                            repeat: Infinity,
                                            repeatDelay: 0.5,
                                        }}
                                    />
                                </div>
                            </motion.div>
                            
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.4 }}
                            >
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Session Found!
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mt-2">
                                    Redirecting you to your dashboard...
                                </p>
                            </motion.div>

                            <motion.div
                                className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <motion.div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
                                />
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SessionTransition;

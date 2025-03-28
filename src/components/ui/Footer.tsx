import React, { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";

export const Footer: React.FC = () => {
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

    useEffect(() => {
        // Update online status when it changes
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Clean up event listeners on unmount
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <footer className="fixed bottom-0 left-0 right-0 py-2 px-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 z-50">
            <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    © {new Date().getFullYear()} TaskMind AI
                </div>
                <div className="flex items-center gap-2">
                    {isOnline ? (
                        <>
                            <Wifi className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-green-500">Online</span>
                        </>
                    ) : (
                        <>
                            <WifiOff className="h-4 w-4 text-red-500" />
                            <span className="text-xs text-red-500">Offline</span>
                        </>
                    )}
                </div>
            </div>
        </footer>
    );
};

export default Footer; 
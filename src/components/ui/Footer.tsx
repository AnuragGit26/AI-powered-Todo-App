import React, { useState, useEffect } from "react";

export const Footer: React.FC = () => {
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <footer className="fixed bottom-0 left-0 p-3 z-10">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    {isOnline ? 'Online' : 'Offline'}
                </span>
            </div>
        </footer>
    );
};

export default Footer; 
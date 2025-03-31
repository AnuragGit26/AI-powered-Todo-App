import { ListTodo } from "lucide-react";
import React, { useEffect, useState } from "react";

interface LogoProps {
    size?: number;
    className?: string;
    showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 40, className = "", showText = false }) => {
    // Initialize in light mode by default
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Set up observer for theme changes
        const darkModeObserver = new MutationObserver(() => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        });

        darkModeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            if (!document.documentElement.classList.contains('dark') && !document.documentElement.classList.contains('light')) {
                setIsDarkMode(e.matches);
            }
        };

        mediaQuery.addEventListener('change', handleChange);

        // Set initial dark mode value based on current document class
        setIsDarkMode(document.documentElement.classList.contains('dark'));

        return () => {
            darkModeObserver.disconnect();
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    // Logo path
    const logoPath = "/assets/logo.png";

    return (
        <div className={`flex items-center ${className}`}>
            {!isDarkMode ?
                <img
                    src={logoPath}
                    alt="TaskMind AI Logo"
                    width={size}
                    height={size}
                    className="object-contain"
                    style={{ aspectRatio: '1/1' }}
                />
                : <div className="flex flex-row mt-8 m-4"><ListTodo className="w-7 h-7 pr-2 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">TaskMind AI</h1></div>}
            {showText && (
                <div className="flex flex-row m-2">
                    <span className="font-bold text-2xl text-gray-900 dark:text-white font-['Open_Sans'] p-4">
                        TaskMind AI
                    </span>
                </div>
            )}

        </div>
    );
};

export default Logo;
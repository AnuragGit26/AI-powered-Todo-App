import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, BarChart3, User, X, Menu, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { useTodoStore } from '../store/todoStore';
import ThemeCustomizer from "./ThemeCustomizer";
import ShinyText from "./ui/ShinyText";
import { MiniPomodoro } from "./MiniPomodoro";

export const NavBar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTodoStore((state) => state.theme);
    const pomodoro = useTodoStore((state) => state.pomodoro);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    // Display analytics button only on main page
    const showAnalyticsButton = location.pathname === '/';

    // Skip rendering on authentication pages
    if (['/login', '/signup', '/reset-password'].includes(location.pathname)) {
        return null;
    }

    const handleMobileMenuToggle = () => {
        setShowMobileMenu(!showMobileMenu);
    };

    const handleNavigationClick = (path: string, label: string) => {
        navigate(path);
        setShowMobileMenu(false);
        // Announce navigation to screen readers
        const announcement = `Navigated to ${label}`;
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.position = 'absolute';
        liveRegion.style.left = '-10000px';
        liveRegion.textContent = announcement;
        document.body.appendChild(liveRegion);
        setTimeout(() => document.body.removeChild(liveRegion), 1000);
    };

    const handleAnalyticsToggle = () => {
        const analyticsToggleEvent = new CustomEvent('toggleAnalytics');
        window.dispatchEvent(analyticsToggleEvent);
        setShowMobileMenu(false);
    };

    return (
        <>
            {/* Desktop Navigation */}
            <nav
                className="fixed top-0 left-0 right-0 z-50 hidden sm:flex items-center justify-between px-4 py-2 backdrop-blur-md bg-white/70 dark:bg-black/70 border-b border-gray-200 dark:border-gray-800 shadow-sm"
                style={{
                    "--primary-color": theme.primaryColor,
                    "--secondary-color": theme.secondaryColor,
                } as React.CSSProperties}
                role="navigation"
                aria-label="Main navigation"
            >
                {/* Left section with logo/home */}
                <Button
                    variant="ghost"
                    className="p-2 hover:theme-accent-bg/10 theme-accent-text dark:hover:bg-gray-900 rounded-full"
                    onClick={() => handleNavigationClick("/", "Home")}
                    aria-label="Go to home page"
                >
                    <Home className="h-5 w-5 mr-1" aria-hidden="true" />
                    <ShinyText text="Home" disabled={false} speed={2} className="font-medium theme-accent-text dark:text-white" />
                </Button>

                {/* Center section with mini pomodoro - only show if timer is active or completed sessions > 0 */}
                {(pomodoro.isActive || pomodoro.completedSessions > 0) && (
                    <div className="absolute left-1/2 transform -translate-x-1/2" role="timer" aria-label="Active Pomodoro timer">
                        <MiniPomodoro />
                    </div>
                )}

                {/* Right section with actions */}
                <div className="flex items-center gap-3" role="toolbar" aria-label="Navigation actions">
                    <Button
                        variant="ghost"
                        className="p-2 hover:theme-accent-bg/10 theme-accent-text dark:hover:bg-gray-900 rounded-full"
                        onClick={() => handleNavigationClick("/pomodoro", "Pomodoro Timer")}
                        aria-label="Go to Pomodoro Timer"
                    >
                        <Timer className="h-5 w-5" aria-hidden="true" />
                    </Button>

                    <Button
                        variant="ghost"
                        className="p-2 hover:theme-secondary-bg/10 theme-secondary-text dark:hover:bg-gray-900 rounded-full"
                        onClick={() => handleNavigationClick("/profile", "User Profile")}
                        aria-label="Go to user profile"
                    >
                        <User className="h-5 w-5" aria-hidden="true" />
                    </Button>

                    {showAnalyticsButton && (
                        <Button
                            variant="ghost"
                            className="p-2 hover:theme-accent-bg/10 theme-accent-text dark:hover:bg-gray-900 rounded-full"
                            onClick={handleAnalyticsToggle}
                            aria-label="Toggle analytics panel"
                        >
                            <BarChart3 className="h-5 w-5" aria-hidden="true" />
                        </Button>
                    )}

                    <div aria-label="Theme customizer">
                        <ThemeCustomizer />
                    </div>
                </div>
            </nav>

            {/* Mobile Navigation */}
            <nav
                className="fixed top-0 left-0 right-0 z-50 flex sm:hidden items-center justify-between px-4 py-2 backdrop-blur-md bg-white/70 dark:bg-black/70 border-b border-gray-200 dark:border-gray-800 shadow-sm"
                role="navigation"
                aria-label="Mobile navigation"
            >
                <Button
                    variant="ghost"
                    className="p-2 hover:theme-accent-bg/10 theme-accent-text dark:hover:bg-gray-900 rounded-full"
                    onClick={() => handleNavigationClick("/", "Home")}
                    aria-label="Go to home page"
                >
                    <Home className="h-5 w-5" aria-hidden="true" />
                </Button>

                {/* Center mini pomodoro for mobile */}
                {(pomodoro.isActive || pomodoro.completedSessions > 0) && (
                    <div className="absolute left-1/2 transform -translate-x-1/2" role="timer" aria-label="Active Pomodoro timer">
                        <MiniPomodoro />
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <div aria-label="Theme customizer">
                        <ThemeCustomizer />
                    </div>

                    <Button
                        variant="ghost"
                        className="p-2 hover:theme-secondary-bg/10 theme-secondary-text dark:hover:bg-gray-900 rounded-full"
                        onClick={handleMobileMenuToggle}
                        aria-label={showMobileMenu ? "Close navigation menu" : "Open navigation menu"}
                        aria-expanded={showMobileMenu}
                        aria-controls="mobile-navigation-menu"
                    >
                        {showMobileMenu ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
                    </Button>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {showMobileMenu && (
                    <motion.div
                        id="mobile-navigation-menu"
                        className="fixed top-12 left-0 right-0 z-40 sm:hidden flex flex-col p-4 backdrop-blur-md bg-white/90 dark:bg-black/90 border-b border-gray-200 dark:border-gray-800 shadow-md"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        role="menu"
                        aria-label="Mobile navigation menu"
                    >
                        <Button
                            variant="ghost"
                            className="flex justify-start p-2 mb-2 hover:theme-accent-bg/10 theme-accent-text dark:hover:bg-gray-900 rounded-lg"
                            onClick={() => handleNavigationClick("/", "Home")}
                            role="menuitem"
                            aria-label="Go to home page"
                        >
                            <Home className="h-5 w-5 mr-2" aria-hidden="true" />
                            <span>Home</span>
                        </Button>

                        <Button
                            variant="ghost"
                            className="flex justify-start p-2 mb-2 hover:theme-accent-bg/10 theme-accent-text dark:hover:bg-gray-900 rounded-lg"
                            onClick={() => handleNavigationClick("/pomodoro", "Pomodoro Timer")}
                            role="menuitem"
                            aria-label="Go to Pomodoro Timer"
                        >
                            <Timer className="h-5 w-5 mr-2" aria-hidden="true" />
                            <span>Pomodoro Timer</span>
                        </Button>

                        <Button
                            variant="ghost"
                            className="flex justify-start p-2 mb-2 hover:theme-secondary-bg/10 theme-secondary-text dark:hover:bg-gray-900 rounded-lg"
                            onClick={() => handleNavigationClick("/profile", "User Profile")}
                            role="menuitem"
                            aria-label="Go to user profile"
                        >
                            <User className="h-5 w-5 mr-2" aria-hidden="true" />
                            <span>Profile</span>
                        </Button>

                        {showAnalyticsButton && (
                            <Button
                                variant="ghost"
                                className="flex justify-start p-2 mb-2 hover:theme-accent-bg/10 theme-accent-text dark:hover:bg-gray-900 rounded-lg"
                                onClick={handleAnalyticsToggle}
                                role="menuitem"
                                aria-label="Toggle analytics panel"
                            >
                                <BarChart3 className="h-5 w-5 mr-2" aria-hidden="true" />
                                <span>Analytics</span>
                            </Button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default NavBar; 
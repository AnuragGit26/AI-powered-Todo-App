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
    if (['/login', '/signup', '/password-reset-request'].includes(location.pathname)) {
        return null;
    }

    return (
        <>
            {/* Desktop Navigation */}
            <div
                className="fixed top-0 left-0 right-0 z-30 hidden sm:flex items-center justify-between px-4 py-2 backdrop-blur-md bg-white/70 dark:bg-black/70 border-b border-gray-200 dark:border-gray-800 shadow-sm"
                style={{
                    "--primary-color": theme.primaryColor,
                    "--secondary-color": theme.secondaryColor,
                } as React.CSSProperties}
            >
                {/* Left section with logo/home */}
                <Button
                    variant="ghost"
                    className="p-2 hover:theme-accent-bg/10 theme-accent-text dark:hover:bg-gray-900 rounded-full"
                    onClick={() => navigate("/")}
                >
                    <Home className="h-5 w-5 mr-1" />
                    <ShinyText text="Home" disabled={false} speed={2} className="font-medium theme-accent-text dark:text-white" />
                </Button>

                {/* Center section with mini pomodoro - only show if timer is active or completed sessions > 0 */}
                {(pomodoro.isActive || pomodoro.completedSessions > 0) && (
                    <div className="absolute left-1/2 transform -translate-x-1/2">
                        <MiniPomodoro />
                    </div>
                )}

                {/* Right section with actions */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        className="p-2 hover:theme-accent-bg/10 theme-accent-text dark:hover:bg-gray-900 rounded-full"
                        onClick={() => navigate("/pomodoro")}
                    >
                        <Timer className="h-5 w-5" />
                    </Button>

                    <Button
                        variant="ghost"
                        className="p-2 hover:theme-secondary-bg/10 theme-secondary-text dark:hover:bg-gray-900 rounded-full"
                        onClick={() => navigate("/profile")}
                    >
                        <User className="h-5 w-5" />
                    </Button>

                    {showAnalyticsButton && (
                        <Button
                            variant="ghost"
                            className="p-2 hover:theme-accent-bg/10 theme-accent-text dark:hover:bg-gray-900 rounded-full"
                            onClick={() => {
                                // On desktop, we'll use the analytics panel instead of navigation
                                const analyticsToggleEvent = new CustomEvent('toggleAnalytics');
                                window.dispatchEvent(analyticsToggleEvent);
                            }}
                        >
                            <BarChart3 className="h-5 w-5" />
                        </Button>
                    )}

                    <ThemeCustomizer />
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className="fixed top-0 left-0 right-0 z-30 flex sm:hidden items-center justify-between px-4 py-2 backdrop-blur-md bg-white/70 dark:bg-black/70 border-b border-gray-200 dark:border-gray-800 shadow-sm">
                <Button
                    variant="ghost"
                    className="p-2 hover:theme-accent-bg/10 theme-accent-text dark:hover:bg-gray-900 rounded-full"
                    onClick={() => navigate("/")}
                >
                    <Home className="h-5 w-5" />
                </Button>

                {/* Center mini pomodoro for mobile */}
                {(pomodoro.isActive || pomodoro.completedSessions > 0) && (
                    <div className="absolute left-1/2 transform -translate-x-1/2">
                        <MiniPomodoro />
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <ThemeCustomizer />

                    <Button
                        variant="ghost"
                        className="p-2 hover:theme-secondary-bg/10 theme-secondary-text dark:hover:bg-gray-900 rounded-full"
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                    >
                        {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {showMobileMenu && (
                    <motion.div
                        className="fixed top-12 left-0 right-0 z-20 sm:hidden flex flex-col p-4 backdrop-blur-md bg-white/90 dark:bg-black/90 border-b border-gray-200 dark:border-gray-800 shadow-md"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Button
                            variant="ghost"
                            className="flex justify-start p-2 mb-2 hover:theme-accent-bg/10 theme-accent-text dark:hover:bg-gray-900 rounded-lg"
                            onClick={() => {
                                navigate("/");
                                setShowMobileMenu(false);
                            }}
                        >
                            <Home className="h-5 w-5 mr-2" />
                            <span>Home</span>
                        </Button>

                        <Button
                            variant="ghost"
                            className="flex justify-start p-2 mb-2 hover:theme-accent-bg/10 theme-accent-text dark:hover:bg-gray-900 rounded-lg"
                            onClick={() => {
                                navigate("/pomodoro");
                                setShowMobileMenu(false);
                            }}
                        >
                            <Timer className="h-5 w-5 mr-2" />
                            <span>Pomodoro Timer</span>
                        </Button>

                        <Button
                            variant="ghost"
                            className="flex justify-start p-2 mb-2 hover:theme-secondary-bg/10 theme-secondary-text dark:hover:bg-gray-900 rounded-lg"
                            onClick={() => {
                                navigate("/profile");
                                setShowMobileMenu(false);
                            }}
                        >
                            <User className="h-5 w-5 mr-2" />
                            <span>Profile</span>
                        </Button>

                        {showAnalyticsButton && (
                            <Button
                                variant="ghost"
                                className="flex justify-start p-2 mb-2 hover:theme-accent-bg/10 theme-accent-text dark:hover:bg-gray-900 rounded-lg"
                                onClick={() => {
                                    // For mobile, toggle analytics panel
                                    const analyticsToggleEvent = new CustomEvent('toggleAnalytics');
                                    window.dispatchEvent(analyticsToggleEvent);
                                    setShowMobileMenu(false);
                                }}
                            >
                                <BarChart3 className="h-5 w-5 mr-2" />
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
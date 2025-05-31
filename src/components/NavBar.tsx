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
            <nav className="nav-enterprise hidden sm:flex px-responsive py-4">
                {/* Left section with logo/home */}
                <Button
                    variant="ghost"
                    className="btn-enterprise-ghost flex items-center gap-2"
                    onClick={() => navigate("/")}
                >
                    <Home className="h-5 w-5" />
                    <ShinyText text="Home" disabled={false} speed={2} className="font-medium text-foreground" />
                </Button>

                {/* Center section with mini pomodoro - only show if timer is active or completed sessions > 0 */}
                {(pomodoro.isActive || pomodoro.completedSessions > 0) && (
                    <div className="absolute left-1/2 transform -translate-x-1/2">
                        <MiniPomodoro />
                    </div>
                )}

                {/* Right section with actions */}
                <div className="flex items-center space-enterprise-sm">
                    <Button
                        variant="ghost"
                        className="btn-enterprise-ghost p-3"
                        onClick={() => navigate("/pomodoro")}
                    >
                        <Timer className="h-5 w-5" />
                    </Button>

                    <Button
                        variant="ghost"
                        className="btn-enterprise-ghost p-3"
                        onClick={() => navigate("/profile")}
                    >
                        <User className="h-5 w-5" />
                    </Button>

                    {showAnalyticsButton && (
                        <Button
                            variant="ghost"
                            className="btn-enterprise-ghost p-3"
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
            </nav>

            {/* Mobile Navigation */}
            <nav className="nav-enterprise flex sm:hidden px-responsive py-3">
                <Button
                    variant="ghost"
                    className="btn-enterprise-ghost p-3"
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
                        className="btn-enterprise-ghost p-3"
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                    >
                        {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {showMobileMenu && (
                    <motion.div
                        className="fixed inset-x-0 top-16 z-40 sm:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <motion.div
                            className="enterprise-card glass-enterprise mx-4 mt-2 p-4 space-enterprise-sm"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Button
                                variant="ghost"
                                className="btn-enterprise-ghost w-full justify-start p-3"
                                onClick={() => {
                                    navigate("/");
                                    setShowMobileMenu(false);
                                }}
                            >
                                <Home className="h-5 w-5 mr-3" />
                                <span className="text-responsive-sm">Home</span>
                            </Button>

                            <Button
                                variant="ghost"
                                className="btn-enterprise-ghost w-full justify-start p-3"
                                onClick={() => {
                                    navigate("/pomodoro");
                                    setShowMobileMenu(false);
                                }}
                            >
                                <Timer className="h-5 w-5 mr-3" />
                                <span className="text-responsive-sm">Pomodoro Timer</span>
                            </Button>

                            <Button
                                variant="ghost"
                                className="btn-enterprise-ghost w-full justify-start p-3"
                                onClick={() => {
                                    navigate("/profile");
                                    setShowMobileMenu(false);
                                }}
                            >
                                <User className="h-5 w-5 mr-3" />
                                <span className="text-responsive-sm">Profile</span>
                            </Button>

                            {showAnalyticsButton && (
                                <Button
                                    variant="ghost"
                                    className="btn-enterprise-ghost w-full justify-start p-3"
                                    onClick={() => {
                                        // For mobile, toggle analytics panel
                                        const analyticsToggleEvent = new CustomEvent('toggleAnalytics');
                                        window.dispatchEvent(analyticsToggleEvent);
                                        setShowMobileMenu(false);
                                    }}
                                >
                                    <BarChart3 className="h-5 w-5 mr-3" />
                                    <span className="text-responsive-sm">Analytics</span>
                                </Button>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default NavBar; 
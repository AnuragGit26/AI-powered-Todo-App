import React, { useState, useCallback } from 'react';
import { Settings, Moon, Sun, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTodoStore } from '../store/todoStore';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from "react-router-dom";
import { useMetrics } from "../hooks/useMetrics.ts";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const ThemeCustomizer: React.FC = React.memo(() => {
    const [isOpen, setIsOpen] = useState(false);
    const { theme, setTheme } = useTodoStore();
    const navigate = useNavigate();
    const username = localStorage.getItem('username');
    const { logUserActivity } = useMetrics();

    const toggleTheme = useCallback(() => {
        setTheme({
            ...theme,
            mode: theme.mode === 'light' ? 'dark' : 'light',
        });
        // Force document class update
        document.documentElement.classList.toggle('dark', theme.mode === 'light');
    }, [theme, setTheme]);

    const handleLogout = useCallback(async () => {
        const userId = localStorage.getItem('userId');
        await logUserActivity(userId || "", 'User logged out');
        const { error } = await supabase.auth.signOut();
        sessionStorage.removeItem('token');
        localStorage.clear();
        if (error) {
            console.error('Error logging out:', error.message);
        }
        else {
            window.location.reload();
        }
    }, []);

    return (
        <div className="fixed top-4 right-4 z-50">
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-shadow"
            >
                <Settings className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40"
                        />

                        {/* Settings Panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95, x: 20 }}
                            className="absolute right-0 mt-2 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl w-80 z-50"
                        >
                            <div className="flex flex-col mb-4">
                                <div className="flex justify-between items-center w-full">
                                    <h3 className="text-2xl font-semibold dark:text-white">Welcome {username}!</h3>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="mt-4 mb-2">
                                    <h4 className="text-lg font-semibold dark:text-white">App Settings</h4>
                                </div>

                                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
                                    <div className="flex items-center gap-3">
                                        {localStorage.getItem('profilePicture') ?
                                            <img src={localStorage.getItem('profilePicture') || ""} alt="Profile" className="w-10 h-10 rounded-full" /> :
                                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                                {username?.charAt(0).toUpperCase()}
                                            </div>}
                                        <div className="flex flex-col">
                                            <span className="font-medium cursor-pointer dark:text-white" onClick={() => navigate('/profile')}>{username}</span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">User Profile</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-m font-medium dark:text-gray-200">Theme Mode</label>
                                    <button
                                        onClick={toggleTheme}
                                        className="w-full p-3 flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <span className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                                            {theme.mode === 'light' ? (
                                                <Sun className="w-5 h-5" />
                                            ) : (
                                                <Moon className="w-5 h-5" />
                                            )}
                                            {theme.mode === 'light' ? 'Light Mode' : 'Dark Mode'}
                                        </span>
                                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${theme.mode === 'dark' ? 'bg-blue-500' : 'bg-gray-300'
                                            }`}>
                                            <motion.div
                                                className="w-4 h-4 bg-white rounded-full"
                                                animate={{ x: theme.mode === 'dark' ? 16 : 0 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        </div>
                                    </button>
                                </div>

                                <div className="pt-4 border-t dark:border-gray-700">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
});

export default ThemeCustomizer;
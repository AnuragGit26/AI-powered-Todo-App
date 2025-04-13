import React, { useState, useCallback, useEffect } from 'react';
import { Settings, Moon, Sun, X, Palette, Type, ZoomIn, Save, Trash2, RefreshCw, ToggleLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTodoStore } from '../store/todoStore';
import { Button } from './ui/button';
import { ColorPicker } from './ui/color-picker';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from "react-router-dom";
import { useMetrics } from "../hooks/useMetrics.ts";
import { applyColorScheme, changeFontSize, toggleAnimations, resetToDefaultTheme, getOptimizedDarkModeColor, getDarkModeColors } from "../lib/themeUtils";

// Predefined color schemes
const COLOR_SCHEMES = [
    { name: 'Default', primary: '#53c9d9', secondary: '#5f4ae8' },
    { name: 'Forest', primary: '#2e7d32', secondary: '#81c784' },
    { name: 'Ocean', primary: '#0277bd', secondary: '#4fc3f7' },
    { name: 'Sunset', primary: '#ff7043', secondary: '#ffca28' },
    { name: 'Berry', primary: '#ad1457', secondary: '#f48fb1' },
    { name: 'Monochrome', primary: '#424242', secondary: '#9e9e9e' },
    // New modern theme options
    { name: 'Mint', primary: '#10B981', secondary: '#059669' },
    { name: 'Indigo', primary: '#6366F1', secondary: '#4F46E5' },
    { name: 'Rose', primary: '#F43F5E', secondary: '#E11D48' },
    { name: 'Amber', primary: '#F59E0B', secondary: '#D97706' },
    { name: 'Slate', primary: '#64748B', secondary: '#475569' },
    { name: 'Violet', primary: '#8B5CF6', secondary: '#7C3AED' },
    { name: 'Emerald', primary: '#34D399', secondary: '#10B981' },
    { name: 'Fuchsia', primary: '#D946EF', secondary: '#C026D3' },
    { name: 'Teal', primary: '#14B8A6', secondary: '#0D9488' },
];

// Font size options
const FONT_SIZES = [
    { name: 'Small', value: 'text-sm' },
    { name: 'Medium', value: 'text-base' },
    { name: 'Large', value: 'text-lg' },
    { name: 'Extra Large', value: 'text-xl' }
];

// Define preset type interface to fix 'any' type issues
interface ThemePreset {
    name: string;
    theme: {
        mode: 'light' | 'dark';
        primaryColor: string;
        secondaryColor: string;
        fontSize?: string;
        enableAnimations?: boolean;
    };
}

const ThemeCustomizer: React.FC = React.memo(() => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'general' | 'colors' | 'typography' | 'presets'>('general');
    const [customPrimary, setCustomPrimary] = useState('');
    const [customSecondary, setCustomSecondary] = useState('');
    const [userPresets, setUserPresets] = useState<Array<ThemePreset>>([]);
    const [newPresetName, setNewPresetName] = useState('');
    const [presetError, setPresetError] = useState('');
    const [fontSize, setFontSize] = useState('text-base');
    const [enableAnimations, setEnableAnimations] = useState(true);

    const { theme, setTheme } = useTodoStore();
    const navigate = useNavigate();
    const username = localStorage.getItem('username');
    const { logUserActivity } = useMetrics();

    // Initialize state from theme
    useEffect(() => {
        setCustomPrimary(theme.primaryColor || '#53c9d9');
        setCustomSecondary(theme.secondaryColor || '#5f4ae8');

        // Load font size from localStorage
        const savedFontSize = localStorage.getItem('fontSize') || 'text-base';
        setFontSize(savedFontSize);

        // Load animation preference from localStorage
        const animationPref = localStorage.getItem('enableAnimations');
        setEnableAnimations(animationPref !== 'false');

        // Load user theme presets
        const savedPresets = localStorage.getItem('themePresets');
        if (savedPresets) {
            setUserPresets(JSON.parse(savedPresets));
        }
    }, [theme]);

    const toggleTheme = useCallback(() => {
        const newMode = theme.mode === 'light' ? 'dark' : 'light';
        setTheme({
            ...theme,
            mode: newMode,
        });
        // Force document class update - fixed to use the new mode value directly
        document.documentElement.classList.toggle('dark', newMode === 'dark');
    }, [theme, setTheme]);

    const handleApplyColorScheme = useCallback((primary: string, secondary: string) => {
        setTheme({
            ...theme,
            primaryColor: primary,
            secondaryColor: secondary,
        });

        // Apply CSS variables for colors using the utility function
        applyColorScheme(primary, secondary);
    }, [theme, setTheme]);

    const handleChangeFontSize = useCallback((size: string) => {
        // Use the utility function
        changeFontSize(size);
        setFontSize(size);
    }, []);

    const handleToggleAnimations = useCallback(() => {
        const newValue = !enableAnimations;
        setEnableAnimations(newValue);

        // Use the utility function
        toggleAnimations(newValue);
    }, [enableAnimations]);

    const saveCurrentThemeAsPreset = useCallback(() => {
        if (!newPresetName.trim()) {
            setPresetError('Please enter a preset name');
            return;
        }

        // Check for duplicate name
        if (userPresets.some(preset => preset.name === newPresetName)) {
            setPresetError('A preset with this name already exists');
            return;
        }

        const newPreset = {
            name: newPresetName,
            theme: {
                mode: theme.mode,
                primaryColor: theme.primaryColor,
                secondaryColor: theme.secondaryColor,
                fontSize: fontSize,
                enableAnimations: enableAnimations
            }
        };

        const updatedPresets = [...userPresets, newPreset];
        setUserPresets(updatedPresets);
        localStorage.setItem('themePresets', JSON.stringify(updatedPresets));

        setNewPresetName('');
        setPresetError('');
    }, [newPresetName, userPresets, theme, fontSize, enableAnimations]);

    const applyPreset = useCallback((preset: ThemePreset) => {
        // Apply theme settings
        setTheme({
            mode: preset.theme.mode,
            primaryColor: preset.theme.primaryColor,
            secondaryColor: preset.theme.secondaryColor,
        });

        // Apply font size
        handleChangeFontSize(preset.theme.fontSize || 'text-base');

        // Apply animations setting
        const animationSetting = preset.theme.enableAnimations !== false;
        setEnableAnimations(animationSetting);
        toggleAnimations(animationSetting);

        // Update document classes for theme mode
        document.documentElement.classList.toggle('dark', preset.theme.mode === 'dark');
        applyColorScheme(preset.theme.primaryColor, preset.theme.secondaryColor);
    }, [setTheme, handleChangeFontSize]);

    const deletePreset = useCallback((presetName: string) => {
        const updatedPresets = userPresets.filter(preset => preset.name !== presetName);
        setUserPresets(updatedPresets);
        localStorage.setItem('themePresets', JSON.stringify(updatedPresets));
    }, [userPresets]);

    const handleResetToDefaults = useCallback(() => {
        // Use the utility function
        const defaultTheme = resetToDefaultTheme();
        setTheme(defaultTheme);
        setFontSize('text-base');
        setEnableAnimations(true);
    }, [setTheme]);

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
    }, [logUserActivity]);

    const TabButton = ({ id, label, icon }: { id: 'general' | 'colors' | 'typography' | 'presets', label: string, icon: React.ReactNode }) => (
        <button
            onClick={() => setSelectedTab(id)}
            className={`flex items-center gap-2 p-2 rounded-md transition-colors ${selectedTab === id
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    return (
        <div className="relative">
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
                            className="fixed right-0 left-0 mx-auto md:absolute md:right-0 md:left-auto mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[95%] md:w-96 max-h-[90vh] overflow-y-auto z-50"
                        >
                            <div className="flex flex-col mb-4">
                                <div className="flex justify-between items-center w-full">
                                    <h3 className="text-2xl font-semibold dark:text-white truncate pr-2">Welcome {username}!</h3>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg my-4">
                                    <div className="flex items-center gap-3">
                                        {localStorage.getItem('profilePicture') ?
                                            <img src={localStorage.getItem('profilePicture') || ""} alt="Profile" className="w-10 h-10 rounded-full" /> :
                                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                                {username?.charAt(0).toUpperCase()}
                                            </div>}
                                        <div className="flex flex-col">
                                            <span className="font-medium cursor-pointer dark:text-white truncate" onClick={() => navigate('/profile')}>{username}</span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">User Profile</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs for different settings categories - updated for responsiveness */}
                                <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto py-1">
                                    <TabButton id="general" label="General" icon={<Settings className="w-4 h-4" />} />
                                    <TabButton id="colors" label="Colors" icon={<Palette className="w-4 h-4" />} />
                                    <TabButton id="typography" label="Typography" icon={<Type className="w-4 h-4" />} />
                                    <TabButton id="presets" label="Presets" icon={<Save className="w-4 h-4" />} />
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* General Tab */}
                                {selectedTab === 'general' && (
                                    <div className="space-y-4">
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

                                        <div className="space-y-2">
                                            <label className="block text-m font-medium dark:text-gray-200">Animations</label>
                                            <button
                                                onClick={handleToggleAnimations}
                                                className="w-full p-3 flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                                                    <ToggleLeft className="w-5 h-5" />
                                                    {enableAnimations ? 'Animations Enabled' : 'Animations Disabled'}
                                                </span>
                                                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${enableAnimations ? 'bg-blue-500' : 'bg-gray-300'
                                                    }`}>
                                                    <motion.div
                                                        className="w-4 h-4 bg-white rounded-full"
                                                        animate={{ x: enableAnimations ? 16 : 0 }}
                                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                    />
                                                </div>
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            <button
                                                onClick={handleResetToDefaults}
                                                className="w-full p-3 flex items-center justify-center gap-2 bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-800/30 transition-colors"
                                            >
                                                <RefreshCw className="w-5 h-5" />
                                                Reset to Defaults
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
                                )}

                                {/* Colors Tab */}
                                {selectedTab === 'colors' && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="block text-md font-medium dark:text-gray-200">Color Schemes</label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {COLOR_SCHEMES.map((scheme) => (
                                                    <button
                                                        key={scheme.name}
                                                        onClick={() => handleApplyColorScheme(scheme.primary, scheme.secondary)}
                                                        className="relative p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group overflow-hidden"
                                                    >
                                                        <div className="flex flex-col items-center space-y-1">
                                                            <div className="flex space-x-1 mb-1">
                                                                <div
                                                                    className="w-6 h-6 rounded-full"
                                                                    style={{ backgroundColor: scheme.primary }}
                                                                ></div>
                                                                <div
                                                                    className="w-6 h-6 rounded-full"
                                                                    style={{ backgroundColor: scheme.secondary }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-sm font-medium dark:text-gray-300">{scheme.name}</span>
                                                        </div>

                                                        {/* Theme preview on hover */}
                                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                                                            <div className="flex space-x-2 justify-center">
                                                                {/* Light mode preview */}
                                                                <div className="flex flex-col items-center">
                                                                    <div className="rounded-md bg-white p-1 mb-1 shadow-sm w-12 h-12 flex flex-col">
                                                                        <div className="w-full h-2 rounded-sm mb-1" style={{ backgroundColor: scheme.primary }}></div>
                                                                        <div className="w-3/4 h-2 rounded-sm mb-1" style={{ backgroundColor: scheme.secondary }}></div>
                                                                        <div className="w-full h-2 rounded-sm bg-gray-200"></div>
                                                                    </div>
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400">Light</span>
                                                                </div>

                                                                {/* Dark mode preview */}
                                                                <div className="flex flex-col items-center">
                                                                    <div className="rounded-md bg-gray-800 p-1 mb-1 shadow-sm w-12 h-12 flex flex-col">
                                                                        <div
                                                                            className="w-full h-2 rounded-sm mb-1"
                                                                            style={{ backgroundColor: getOptimizedDarkModeColor(scheme.primary, getDarkModeColors()) }}
                                                                        ></div>
                                                                        <div
                                                                            className="w-3/4 h-2 rounded-sm mb-1"
                                                                            style={{ backgroundColor: getOptimizedDarkModeColor(scheme.secondary, getDarkModeColors()) }}
                                                                        ></div>
                                                                        <div className="w-full h-2 rounded-sm bg-gray-600"></div>
                                                                    </div>
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400">Dark</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2 mt-6">
                                            <label className="block text-md font-medium dark:text-gray-200">Custom Colors</label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Primary Color</label>
                                                    <div className="flex items-center">
                                                        <div
                                                            className="w-8 h-8 rounded-full mr-2 border border-gray-300 dark:border-gray-600 shadow-inner"
                                                            style={{ backgroundColor: customPrimary }}
                                                        ></div>
                                                        <input
                                                            type="text"
                                                            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md text-sm dark:text-white"
                                                            placeholder="#hex code"
                                                            value={customPrimary}
                                                            onChange={(e) => setCustomPrimary(e.target.value)}
                                                        />
                                                    </div>
                                                    <input
                                                        type="color"
                                                        className="w-full h-8 mt-2 rounded cursor-pointer"
                                                        value={customPrimary}
                                                        onChange={(e) => setCustomPrimary(e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Secondary Color</label>
                                                    <div className="flex items-center">
                                                        <div
                                                            className="w-8 h-8 rounded-full mr-2 border border-gray-300 dark:border-gray-600 shadow-inner"
                                                            style={{ backgroundColor: customSecondary }}
                                                        ></div>
                                                        <input
                                                            type="text"
                                                            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md text-sm dark:text-white"
                                                            placeholder="#hex code"
                                                            value={customSecondary}
                                                            onChange={(e) => setCustomSecondary(e.target.value)}
                                                        />
                                                    </div>
                                                    <input
                                                        type="color"
                                                        className="w-full h-8 mt-2 rounded cursor-pointer"
                                                        value={customSecondary}
                                                        onChange={(e) => setCustomSecondary(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleApplyColorScheme(customPrimary, customSecondary)}
                                                className="w-full mt-4 py-2 px-4 bg-primary-500 dark:bg-primary-600 text-white rounded-md hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors"
                                                style={{ backgroundColor: customPrimary }}
                                            >
                                                Apply Custom Colors
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Typography Tab */}
                                {selectedTab === 'typography' && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="block text-m font-medium dark:text-gray-200">Font Size</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {FONT_SIZES.map((size) => (
                                                    <button
                                                        key={size.value}
                                                        onClick={() => handleChangeFontSize(size.value)}
                                                        className={`p-3 rounded-lg flex items-center justify-between transition-colors ${fontSize === size.value
                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                            }`}
                                                    >
                                                        <span className={size.value}>{size.name}</span>
                                                        <ZoomIn className="w-4 h-4" />
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                                Font size changes will affect the entire application.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Presets Tab */}
                                {selectedTab === 'presets' && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="block text-m font-medium dark:text-gray-200">Save Current Theme</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={newPresetName}
                                                    onChange={(e) => setNewPresetName(e.target.value)}
                                                    placeholder="Preset name"
                                                    className="flex-1 p-2 border rounded-md dark:bg-gray-700"
                                                />
                                                <button
                                                    onClick={saveCurrentThemeAsPreset}
                                                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                                >
                                                    <Save className="w-5 h-5" />
                                                </button>
                                            </div>
                                            {presetError && (
                                                <p className="text-sm text-red-500">{presetError}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-m font-medium dark:text-gray-200">Your Presets</label>
                                            {userPresets.length > 0 ? (
                                                <div className="space-y-2">
                                                    {userPresets.map((preset) => (
                                                        <div
                                                            key={preset.name}
                                                            className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-between"
                                                        >
                                                            <div className="flex items-center">
                                                                <div className="flex space-x-1">
                                                                    <div
                                                                        className="w-5 h-5 rounded-full"
                                                                        style={{ backgroundColor: preset.theme.primaryColor }}
                                                                    ></div>
                                                                    <div
                                                                        className="w-5 h-5 rounded-full"
                                                                        style={{ backgroundColor: preset.theme.secondaryColor }}
                                                                    ></div>
                                                                </div>
                                                                <span className="ml-2 text-gray-700 dark:text-gray-200">{preset.name}</span>
                                                            </div>
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() => applyPreset(preset)}
                                                                    className="p-1 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800/40"
                                                                >
                                                                    Apply
                                                                </button>
                                                                <button
                                                                    onClick={() => deletePreset(preset.name)}
                                                                    className="p-1 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800/40"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                                    You haven't saved any theme presets yet.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
});

export default ThemeCustomizer;
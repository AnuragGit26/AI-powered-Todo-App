import React from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import DecryptedText from "./ui/Decyptedtext";
import { motion } from "framer-motion";

interface FeatureItemProps {
    title: string;
    description: string;
    icon: React.ReactNode;
}

const FeatureItem = ({ title, description, icon }: FeatureItemProps) => (
    <motion.div
        className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors duration-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        <div className="mt-1 text-primary shrink-0">{icon}</div>
        <div className="min-w-0">
            <h3 className="text-responsive-sm font-medium text-foreground mb-1">{title}</h3>
            <p className="text-responsive-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
    </motion.div>
);

// Mockup component to display a stylized task app screen
const AppMockup = () => (
    <motion.div
        className="relative mb-6 p-3 bg-black/5 dark:bg-white/5 rounded-lg shadow-inner overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.3 }}
    >
        <div className="flex items-center justify-between mb-3">
            <div className="flex space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-[10px] text-muted-foreground dark:text-gray-400">TaskMind AI</div>
        </div>

        <div className="space-y-2">
            <motion.div
                className="flex items-center bg-white/70 dark:bg-gray-800/70 p-2 rounded-md"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <div className="h-3 w-3 bg-green-400 rounded-full mr-2"></div>
                <div className="flex-1 text-[10px] text-gray-700 dark:text-gray-300">Complete project proposal</div>
                <div className="ml-2 text-xs text-green-500">✓</div>
            </motion.div>

            <motion.div
                className="flex items-center bg-white/70 dark:bg-gray-800/70 p-2 rounded-md"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
            >
                <div className="h-3 w-3 bg-blue-400 rounded-full mr-2"></div>
                <div className="flex-1 text-[10px] text-gray-700 dark:text-gray-300">AI Analysis: 2h estimate</div>
                <div className="ml-2 text-xs text-blue-500">🤖</div>
            </motion.div>

            <motion.div
                className="flex items-center bg-white/70 dark:bg-gray-800/70 p-2 rounded-md"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
            >
                <div className="h-3 w-3 bg-purple-400 rounded-full mr-2"></div>
                <div className="flex-1 text-[10px] text-gray-700 dark:text-gray-300">Team meeting prep</div>
                <div className="ml-2 text-xs text-purple-500">📋</div>
            </motion.div>

            {/* Pomodoro Timer Mockup */}
            <motion.div
                className="flex items-center bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-2 rounded-md border border-red-200 dark:border-red-800"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
            >
                <div className="h-3 w-3 bg-red-400 rounded-full mr-2 animate-pulse"></div>
                <div className="flex-1 flex justify-center">
                    <div className="text-xs font-mono text-red-600 dark:text-red-400">23:45</div>
                </div>
                <div className="ml-2 text-xs">🍅</div>
            </motion.div>

            <motion.div
                className="absolute -bottom-2 -right-2 h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9, type: "spring" }}
                whileHover={{ scale: 1.05 }}
            >
                <span className="text-white text-lg">✨</span>
            </motion.div>
        </div>
    </motion.div>
);

// Stats animation component
const AnimatedStat = ({ value, label }: { value: string; label: string }) => (
    <motion.div
        className="text-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
    >
        <motion.p
            className="text-responsive-lg font-bold text-primary"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 1.2 }}
        >
            {value}
        </motion.p>
        <p className="text-responsive-xs text-muted-foreground">{label}</p>
    </motion.div>
);

export function TodoAIIntro() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="h-full"
        >
            <Card className="enterprise-card-elevated glass-enterprise max-w-xl mx-auto h-full">
                <CardHeader className="pb-4">
                    <DecryptedText
                        text="Welcome to TaskMind AI"
                        className="heading-enterprise-3 text-center bg-gradient-to-r from-primary via-info to-primary bg-clip-text text-transparent"
                        speed={40}
                        sequential={true}
                        animateOn="view"
                        parentClassName="block mb-3"
                    />
                    <DecryptedText
                        text="AI-powered productivity with smart task management"
                        className="text-enterprise-large text-center text-muted-foreground"
                        speed={35}
                        sequential={true}
                        animateOn="view"
                        parentClassName="block"
                    />
                </CardHeader>
                <CardContent className="pt-4 overflow-y-auto">
                    <AppMockup />

                    <div className="space-enterprise-lg">
                        <div className="space-enterprise-sm">
                            <FeatureItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>}
                                title="Smart Task Management"
                                description="AI-powered task organization with automatic priority detection and intelligent categorization"
                            />
                            <FeatureItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M12 17v.01"></path><path d="M12 13.5a1.5 1.5 0 0 1 1-1.5 2.6 2.6 0 1 0-3-2.6"></path></svg>}
                                title="AI Task Analysis"
                                description="Get intelligent insights on difficulty levels, time estimates, and optimal completion strategies"
                            />
                            <FeatureItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6v6l3 3"></path><circle cx="12" cy="12" r="10"></circle></svg>}
                                title="Cross-Device Pomodoro"
                                description="Advanced focus timer with real-time sync across all devices and intelligent session tracking"
                            />
                            <FeatureItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18l18-9z"></path></svg>}
                                title="Real-time Sync"
                                description="Seamless synchronization across all your devices with instant updates and offline support"
                            />
                            <FeatureItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>}
                                title="Advanced Filtering"
                                description="Smart search with natural language queries and dynamic filtering by status, priority, and dates"
                            />
                            <FeatureItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 17 2 2 4-4" /><path d="m3 7 2 2 4-4" /><path d="M13 6h8" /><path d="M13 12h8" /><path d="M13 18h8" /></svg>}
                                title="Hierarchical Organization"
                                description="Break complex projects into subtasks with nested organization and dependency tracking"
                            />
                            <FeatureItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v4a1 1 0 0 0 1 1h3"></path><path d="M7 5.01 9 7l6-6"></path><path d="M13 14H8a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h5"></path><path d="M17 10h3a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-3"></path></svg>}
                                title="Productivity Analytics"
                                description="Comprehensive insights with visual charts, completion trends, and personalized performance metrics"
                            />
                            <FeatureItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6"></path><path d="m15.5 8.5 4.5-4.5M4 4l4.5 4.5m11 11L15 15M4 20l4.5-4.5"></path></svg>}
                                title="Custom Themes"
                                description="Personalize your workspace with custom color themes and dark/light mode preferences"
                            />
                        </div>

                        {/* Stats section */}
                        <motion.div
                            className="py-6 grid grid-cols-3 gap-4 border-t border-b border-border"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            <AnimatedStat value="40%" label="Time Saved" />
                            <AnimatedStat value="1.2K+" label="Active Users" />
                            <AnimatedStat value="4.9" label="User Rating" />
                        </motion.div>

                        <div className="pt-6 pb-4">
                            <motion.p
                                className="text-responsive-sm text-center text-muted-foreground mb-6"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.2 }}
                            >
                                Join thousands of professionals who've revolutionized their productivity with AI-powered task management
                            </motion.p>

                            <motion.div
                                className="flex justify-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.3 }}
                            >
                                <div className="flex -space-x-2 shadow-sm">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-info border-2 border-background z-10"></div>
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-info to-primary border-2 border-background z-20"></div>
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary via-info to-primary border-2 border-background z-30"></div>
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-info to-success border-2 border-background z-40"></div>
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-success to-primary border-2 border-background z-50"></div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}


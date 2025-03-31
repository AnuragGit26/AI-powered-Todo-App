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
        className="flex items-start gap-3 mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        <div className="mt-1 text-primary dark:text-primary">{icon}</div>
        <div>
            <h3 className="font-medium text-sm text-gray-900 dark:text-gray-200">{title}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
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
            <div className="text-[10px] text-muted-foreground dark:text-gray-400">TodoAI</div>
        </div>

        <div className="space-y-2">
            <motion.div
                className="flex items-center bg-white/70 dark:bg-gray-800/70 p-2 rounded-md"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <div className="h-3 w-3 bg-blue-400 rounded-full mr-2"></div>
                <div className="h-2 flex-1 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                <div className="ml-2 h-3 w-3 text-xs">✓</div>
            </motion.div>

            <motion.div
                className="flex items-center bg-white/70 dark:bg-gray-800/70 p-2 rounded-md"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
            >
                <div className="h-3 w-3 bg-green-400 rounded-full mr-2"></div>
                <div className="h-2 flex-1 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                <div className="ml-2 h-3 w-3 text-xs">📊</div>
            </motion.div>

            <motion.div
                className="flex items-center bg-white/70 dark:bg-gray-800/70 p-2 rounded-md"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
            >
                <div className="h-3 w-3 bg-purple-400 rounded-full mr-2"></div>
                <div className="h-2 flex-1 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                <div className="ml-2 h-3 w-3 text-xs">📝</div>
            </motion.div>

            {/* Pomodoro Timer Mockup */}
            <motion.div
                className="flex items-center bg-white/70 dark:bg-gray-800/70 p-2 rounded-md"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
            >
                <div className="h-3 w-3 bg-red-400 rounded-full mr-2"></div>
                <div className="flex-1 flex justify-center">
                    <div className="text-xs font-mono dark:text-gray-200">25:00</div>
                </div>
                <div className="ml-2 h-3 w-3 text-xs">⏱️</div>
            </motion.div>

            <motion.div
                className="absolute -bottom-2 -right-2 h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9, type: "spring" }}
                whileHover={{ scale: 1.05 }}
            >
                <span className="text-white text-lg">+</span>
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
            className="text-lg font-bold text-primary dark:text-primary"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 1.2 }}
        >
            {value}
        </motion.p>
        <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
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
            <Card className="max-w-md shadow-lg border-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-lg overflow-hidden h-full border border-white/20 dark:border-gray-800/50">
                <CardHeader className="pb-2 flex items-center justify-between">
                    <DecryptedText
                        text="Welcome to TodoAI"
                        className="text-xl font-bold text-center text-gray-900 dark:text-white"
                        speed={40}
                        sequential={true}
                        animateOn="view"
                        parentClassName="block mb-2"
                    />
                    <DecryptedText
                        text="The smarter task management app"
                        className="text-sm text-muted-foreground text-center text-gray-600 dark:text-gray-400"
                        speed={35}
                        sequential={true}
                        animateOn="view"
                        parentClassName="block mb-2"
                    />
                </CardHeader>
                <CardContent className="pt-4 overflow-y-auto">
                    <AppMockup />

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <FeatureItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>}
                                title="Task Management"
                                description="Organize tasks with priorities, due dates, and completion tracking"
                            />
                            <FeatureItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M12 17v.01"></path><path d="M12 13.5a1.5 1.5 0 0 1 1-1.5 2.6 2.6 0 1 0-3-2.6"></path></svg>}
                                title="Task Analysis"
                                description="Get insights on task difficulty and estimated completion time"
                            />
                            <FeatureItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6v6l3 3"></path><circle cx="12" cy="12" r="10"></circle></svg>}
                                title="Pomodoro Timer"
                                description="Boost productivity with customizable work/break intervals and session tracking"
                            />
                            <FeatureItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>}
                                title="Status Tracking"
                                description="Track tasks with Not Started, In Progress, and Completed statuses"
                            />
                            <FeatureItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>}
                                title="Search & Filter"
                                description="Easily find and filter tasks based on various criteria"
                            />
                            <FeatureItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 17 2 2 4-4" /><path d="m3 7 2 2 4-4" /><path d="M13 6h8" /><path d="M13 12h8" /><path d="M13 18h8" /></svg>}
                                title="Subtasks & Organization"
                                description="Break down complex tasks into manageable subtasks"
                            />
                            <FeatureItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4" /><path d="M8 8l4-4 4 4" /><path d="M20 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" /></svg>}
                                title="Productivity Analytics"
                                description="Track your progress with visual charts and completion trends"
                            />
                        </div>

                        {/* Stats section */}
                        <motion.div
                            className="py-3 grid grid-cols-3 gap-2 border-t border-b border-gray-200 dark:border-gray-700"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            <AnimatedStat value="25%" label="Time Saved" />
                            <AnimatedStat value="500+" label="Users" />
                            <AnimatedStat value="4.7" label="Rating" />
                        </motion.div>

                        <div className="pt-4 pb-2">
                            <motion.p
                                className="text-xs text-center text-gray-600 dark:text-gray-400 mb-4"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.2 }}
                            >
                                Join thousands of professionals enjoying our AI-powered task management revolution
                            </motion.p>

                            <motion.div
                                className="flex justify-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.3 }}
                            >
                                <div className="flex -space-x-3 shadow-sm">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 border-2 border-white dark:border-gray-800 z-10"></div>
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 border-2 border-white dark:border-gray-800 z-20"></div>
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 border-2 border-white dark:border-gray-800 z-30"></div>
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-600 border-2 border-white dark:border-gray-800 z-40"></div>
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-600 border-2 border-white dark:border-gray-800 z-50"></div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}


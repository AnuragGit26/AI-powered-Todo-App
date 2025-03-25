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
        <div className="mt-1 text-primary">{icon}</div>
        <div>
            <h3 className="font-medium text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>
    </motion.div>
);

export function TodoAIIntro() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
        >
            <Card className="max-w-md shadow-lg border-0 bg-white/70 backdrop-blur-md rounded-lg">
                <CardHeader className="pb-2">
                    <DecryptedText
                        text="Welcome to TodoAI"
                        className="text-xl font-bold text-center"
                        speed={40}
                        sequential={true}
                        animateOn="view"
                        parentClassName="block mb-2"
                    />
                    <p className="text-sm text-muted-foreground text-center">
                        The smart way to organize your tasks
                    </p>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <FeatureItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>}
                                title="Smart Task Management"
                                description="AI-powered organization keeps your tasks sorted by priority and deadline"
                            />
                            <FeatureItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M12 17v.01"></path><path d="M12 13.5a1.5 1.5 0 0 1 1-1.5 2.6 2.6 0 1 0-3-2.6"></path></svg>}
                                title="Intelligent Suggestions"
                                description="Get personalized recommendations based on your productivity patterns"
                            />
                            <FeatureItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>}
                                title="Smart Reminders"
                                description="Never miss a deadline with contextual notifications"
                            />
                            <FeatureItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>}
                                title="Cross-platform Sync"
                                description="Access your tasks from any device with real-time synchronization"
                            />
                        </div>

                        <div className="pt-2 border-t border-border">
                            <p className="text-xs text-center text-muted-foreground">
                                Join thousands of users who have boosted their productivity by 40%
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
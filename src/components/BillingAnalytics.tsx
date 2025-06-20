import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
    TrendingUp,
    TrendingDown,
    BarChart3,
    Clock,
    Target,
    Zap,
    Calendar,
    Award,
    Sparkles,
    DollarSign
} from 'lucide-react';
import { useBillingStore } from '../store/billingStore';

interface UsageInsight {
    metric: string;
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
    description: string;
}

interface ProductivityScore {
    score: number;
    category: string;
    improvement: string;
}

interface SavingsCalculation {
    timeSaved: number;
    monetaryValue: number;
    aiAnalyses: number;
    focusSessions: number;
}

const tabContentVariants = {
    initial: { opacity: 0, y: 10 },
    enter: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
};

const BillingAnalytics: React.FC = () => {
    const { subscription: initialSubscription } = useBillingStore();
    const [activeTab, setActiveTab] = useState('insights');
    const [usageInsights, setUsageInsights] = useState<UsageInsight[]>([]);
    const [productivityScore, setProductivityScore] = useState<ProductivityScore | null>(null);
    const [savingsCalculation, setSavingsCalculation] = useState<SavingsCalculation | null>(null);

    // Create a mutable copy of the subscription
    const subscription = useMemo(() => {
        if (!initialSubscription) return null;

        // Check if all usage metrics are zero
        const isUsageEmpty =
            initialSubscription.usage.tasksCreated === 0 &&
            initialSubscription.usage.aiAnalysisUsed === 0 &&
            initialSubscription.usage.pomodoroSessions === 0;

        if (isUsageEmpty) {
            return {
                ...initialSubscription,
                usage: {
                    tasksCreated: Math.floor(Math.random() * 50) + 10, // Mock data
                    aiAnalysisUsed: Math.floor(Math.random() * 20) + 5,  // Mock data
                    pomodoroSessions: Math.floor(Math.random() * 30) + 10, // Mock data
                },
            };
        }
        return initialSubscription;
    }, [initialSubscription]);

    useEffect(() => {
        if (subscription) {
            generateUsageInsights();
            calculateProductivityScore();
            calculateSavings();
        }
    }, [subscription]);

    const generateUsageInsights = () => {
        if (!subscription) return;

        const { usage, limits } = subscription;
        const insights: UsageInsight[] = [];

        // Tasks insight
        if (limits.maxTasks !== -1) {
            const taskUsagePercent = (usage.tasksCreated / limits.maxTasks) * 100;
            insights.push({
                metric: 'Task Creation',
                value: taskUsagePercent,
                change: Math.random() * 20 - 10, // Mock change
                trend: taskUsagePercent > 70 ? 'up' : 'stable',
                description: `You've created ${usage.tasksCreated} tasks this period`
            });
        }

        // AI Analysis insight
        if (limits.maxAiAnalysis !== -1) {
            const aiUsagePercent = (usage.aiAnalysisUsed / limits.maxAiAnalysis) * 100;
            insights.push({
                metric: 'AI Analysis',
                value: aiUsagePercent,
                change: Math.random() * 15 - 5,
                trend: aiUsagePercent > 60 ? 'up' : 'stable',
                description: `${usage.aiAnalysisUsed} AI analyses used for smarter task management`
            });
        }

        // Pomodoro insight
        const pomodoroHours = (usage.pomodoroSessions * 25) / 60; // 25 min sessions
        insights.push({
            metric: 'Focus Time',
            value: pomodoroHours,
            change: Math.random() * 10,
            trend: 'up',
            description: `${pomodoroHours.toFixed(1)} hours of focused work completed`
        });

        setUsageInsights(insights);
    };

    const calculateProductivityScore = () => {
        if (!subscription) return;

        const { usage } = subscription;

        // Calculate score based on usage patterns
        let score = 0;
        let factors = 0;

        // Task completion rate (mock calculation)
        const taskCompletionRate = Math.min(usage.tasksCreated / 10, 1) * 30;
        score += taskCompletionRate;
        factors++;

        // AI usage efficiency
        if (usage.aiAnalysisUsed > 0) {
            score += Math.min(usage.aiAnalysisUsed / 5, 1) * 25;
            factors++;
        }

        // Pomodoro consistency
        if (usage.pomodoroSessions > 0) {
            score += Math.min(usage.pomodoroSessions / 20, 1) * 25;
            factors++;
        }

        // Feature utilization
        const featureUtilization = subscription.tier !== 'free' ? 20 : 10;
        score += featureUtilization;
        factors++;

        const finalScore = Math.round(score / factors);

        let category = 'Getting Started';
        let improvement = 'Try using more AI features to boost productivity';

        if (finalScore >= 80) {
            category = 'Productivity Master';
            improvement = 'You\'re maximizing your potential! Consider Enterprise for team features';
        } else if (finalScore >= 60) {
            category = 'Efficient Worker';
            improvement = 'Great progress! Try voice-to-task for even faster task creation';
        } else if (finalScore >= 40) {
            category = 'Building Momentum';
            improvement = 'Use Pomodoro timer more regularly to improve focus';
        }

        setProductivityScore({
            score: finalScore,
            category,
            improvement
        });
    };

    const calculateSavings = () => {
        if (!subscription) return;

        const { usage } = subscription;

        // Calculate time saved through AI features
        const aiTimeSaved = usage.aiAnalysisUsed * 5; // 5 minutes per analysis
        const pomodoroEfficiency = usage.pomodoroSessions * 0.3; // 30% efficiency boost
        const totalTimeSaved = aiTimeSaved + (pomodoroEfficiency * 25);

        // Calculate monetary value (assuming $50/hour productivity rate)
        const monetaryValue = (totalTimeSaved / 60) * 50;

        setSavingsCalculation({
            timeSaved: totalTimeSaved,
            monetaryValue,
            aiAnalyses: usage.aiAnalysisUsed,
            focusSessions: usage.pomodoroSessions
        });
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
            default: return <BarChart3 className="h-4 w-4 text-blue-500" />;
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 dark:text-green-400';
        if (score >= 60) return 'text-blue-600 dark:text-blue-400';
        if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-gray-600 dark:text-gray-400';
    };

    if (!subscription) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No billing data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Tabs
                defaultValue="insights"
                className="w-full"
                onValueChange={setActiveTab}
            >
                <div className="relative">
                    <TabsList className="w-full justify-start overflow-x-auto md:justify-center">
                        <TabsTrigger value="insights" className={activeTab === 'insights' ? 'shadow-md' : ''}>Usage Insights</TabsTrigger>
                        <TabsTrigger value="productivity" className={activeTab === 'productivity' ? 'shadow-md' : ''}>Productivity Score</TabsTrigger>
                        <TabsTrigger value="savings" className={activeTab === 'savings' ? 'shadow-md' : ''}>Value Analysis</TabsTrigger>
                    </TabsList>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        variants={tabContentVariants}
                        initial="initial"
                        animate="enter"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'insights' && (
                            <TabsContent value="insights" className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {usageInsights.map((insight, index) => (
                                        <motion.div
                                            key={insight.metric}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <Card>
                                                <CardHeader className="pb-2">
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="text-sm font-medium">
                                                            {insight.metric}
                                                        </CardTitle>
                                                        {getTrendIcon(insight.trend)}
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-2xl font-bold">
                                                                {insight.metric === 'Focus Time'
                                                                    ? `${insight.value.toFixed(1)}h`
                                                                    : `${Math.round(insight.value)}%`}
                                                            </span>
                                                            <Badge variant={insight.trend === 'up' ? 'default' : 'secondary'}>
                                                                {insight.change > 0 ? '+' : ''}{insight.change.toFixed(1)}%
                                                            </Badge>
                                                        </div>
                                                        {insight.metric !== 'Focus Time' && (
                                                            <Progress value={insight.value} className="h-2" />
                                                        )}
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            {insight.description}
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            </TabsContent>
                        )}

                        {activeTab === 'productivity' && (
                            <TabsContent value="productivity" className="space-y-4">
                                {productivityScore && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                    >
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Award className="h-5 w-5 text-yellow-500" />
                                                    Productivity Score
                                                </CardTitle>
                                                <CardDescription>
                                                    Based on your usage patterns and efficiency metrics
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <div className="text-center">
                                                    <div className={`text-6xl font-bold ${getScoreColor(productivityScore.score)}`}>
                                                        {productivityScore.score}
                                                    </div>
                                                    <div className="text-lg font-medium text-gray-600 dark:text-gray-400 mt-2">
                                                        {productivityScore.category}
                                                    </div>
                                                    <Progress
                                                        value={productivityScore.score}
                                                        className="h-3 mt-4"
                                                    />
                                                </div>

                                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                                    <div className="flex items-start gap-3">
                                                        <Sparkles className="h-5 w-5 text-blue-500 mt-0.5" />
                                                        <div>
                                                            <h4 className="font-medium text-blue-900 dark:text-blue-100">
                                                                Improvement Suggestion
                                                            </h4>
                                                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                                                {productivityScore.improvement}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}
                            </TabsContent>
                        )}

                        {activeTab === 'savings' && (
                            <TabsContent value="savings" className="space-y-4">
                                {savingsCalculation && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <DollarSign className="h-5 w-5 text-green-500" />
                                                    Value Analysis
                                                </CardTitle>
                                                <CardDescription>
                                                    Time and money saved through productivity features
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div className="space-y-4">
                                                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Clock className="h-4 w-4 text-green-600" />
                                                                <span className="font-medium text-green-900 dark:text-green-100">
                                                                    Time Saved
                                                                </span>
                                                            </div>
                                                            <div className="text-2xl font-bold text-green-600">
                                                                {Math.round(savingsCalculation.timeSaved)} min
                                                            </div>
                                                            <p className="text-xs text-green-700 dark:text-green-300">
                                                                Through AI assistance and focus sessions
                                                            </p>
                                                        </div>

                                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Target className="h-4 w-4 text-blue-600" />
                                                                <span className="font-medium text-blue-900 dark:text-blue-100">
                                                                    Productivity Value
                                                                </span>
                                                            </div>
                                                            <div className="text-2xl font-bold text-blue-600">
                                                                ${savingsCalculation.monetaryValue.toFixed(0)}
                                                            </div>
                                                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                                                Estimated value of time saved
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <h4 className="font-medium">Feature Usage Breakdown</h4>

                                                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                            <div className="flex items-center gap-2">
                                                                <Zap className="h-4 w-4 text-purple-500" />
                                                                <span className="text-sm">AI Analyses</span>
                                                            </div>
                                                            <Badge variant="secondary">
                                                                {savingsCalculation.aiAnalyses}
                                                            </Badge>
                                                        </div>

                                                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="h-4 w-4 text-orange-500" />
                                                                <span className="text-sm">Focus Sessions</span>
                                                            </div>
                                                            <Badge variant="secondary">
                                                                {savingsCalculation.focusSessions}
                                                            </Badge>
                                                        </div>

                                                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                                            <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                                                💡 <strong>Tip:</strong> Your {subscription.tier} plan is saving you
                                                                significant time. Consider upgrading for even more productivity features!
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}
                            </TabsContent>
                        )}
                    </motion.div>
                </AnimatePresence>
            </Tabs>
        </div>
    );
};

export default BillingAnalytics; 
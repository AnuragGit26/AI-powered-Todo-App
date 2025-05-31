import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
    Crown,
    Mic,
    BarChart3,
    RefreshCw,
    Users,
    Brain,
    Zap,
    Star,
    CheckCircle2,
    TrendingUp,
    Clock,
    Calendar,
    Settings,
    Sparkles
} from 'lucide-react';
import VoiceToTask from './VoiceToTask';
import { useBillingUsage } from '../hooks/useBillingUsage';
import { toast } from 'react-hot-toast';

const PremiumFeaturesDemo: React.FC = () => {
    const [activeDemo, setActiveDemo] = useState<string | null>(null);
    const { isFeatureAvailable, subscription } = useBillingUsage();

    const premiumFeatures = [
        {
            id: 'voice-to-task',
            name: 'Voice-to-Task AI',
            description: 'Convert speech to intelligent tasks with AI analysis',
            icon: Mic,
            color: 'from-purple-500 to-pink-500',
            benefits: [
                'Natural voice input processing',
                'Automatic priority detection',
                'Smart time estimation',
                'Context-aware categorization',
                'Multi-language support'
            ],
            demoComponent: VoiceToTask,
            comingSoon: false,
        },
        {
            id: 'advanced-analytics',
            name: 'Advanced Analytics',
            description: 'Deep productivity insights and predictive analytics',
            icon: BarChart3,
            color: 'from-blue-500 to-cyan-500',
            benefits: [
                'Productivity trend analysis',
                'Time spent per task category',
                'Peak productivity hours',
                'Completion rate predictions',
                'Goal achievement tracking'
            ],
            comingSoon: false,
        },
        {
            id: 'offline-sync',
            name: 'Offline Sync',
            description: 'Work offline and sync when connected',
            icon: RefreshCw,
            color: 'from-green-500 to-emerald-500',
            benefits: [
                'Full offline functionality',
                'Auto-sync when online',
                'Conflict resolution',
                'Local data encryption',
                'Cross-device continuity'
            ],
            comingSoon: false,
        },
        {
            id: 'team-collaboration',
            name: 'Team Collaboration',
            description: 'Real-time collaboration and task delegation',
            icon: Users,
            color: 'from-orange-500 to-red-500',
            benefits: [
                'Real-time task sharing',
                'Team progress tracking',
                'Assignment & delegation',
                'Collaborative editing',
                'Team chat integration'
            ],
            comingSoon: false,
        },
        {
            id: 'smart-prioritization',
            name: 'AI Smart Prioritization',
            description: 'AI-powered task prioritization based on deadlines and importance',
            icon: Brain,
            color: 'from-indigo-500 to-purple-500',
            benefits: [
                'Intelligent priority scoring',
                'Deadline-aware scheduling',
                'Workload balancing',
                'Context switching minimization',
                'Productivity optimization'
            ],
            comingSoon: false,
        }
    ];

    const AdvancedAnalyticsDemo = () => (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-blue-500" />
                    Advanced Analytics Dashboard
                </CardTitle>
                <CardDescription>
                    Deep insights into your productivity patterns
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Weekly Productivity</p>
                                <h3 className="text-2xl font-bold text-blue-600">87%</h3>
                            </div>
                            <TrendingUp className="h-8 w-8 text-blue-500" />
                        </div>
                        <p className="text-xs text-green-600 mt-1">↑ 12% from last week</p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Tasks Completed</p>
                                <h3 className="text-2xl font-bold text-green-600">142</h3>
                            </div>
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                        <p className="text-xs text-green-600 mt-1">↑ 8% from last week</p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Focus Time</p>
                                <h3 className="text-2xl font-bold text-purple-600">24h</h3>
                            </div>
                            <Clock className="h-8 w-8 text-purple-500" />
                        </div>
                        <p className="text-xs text-green-600 mt-1">↑ 15% from last week</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="font-medium">Productivity Insights</h4>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-sm">Peak productivity hours: 9-11 AM</span>
                            <Badge variant="secondary">AI Insight</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-sm">You complete 40% more tasks on Tuesdays</span>
                            <Badge variant="secondary">Pattern Detected</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-sm">Average task completion time: 23 minutes</span>
                            <Badge variant="secondary">Performance</Badge>
                        </div>
                    </div>
                </div>

                {!isFeatureAvailable('advancedAnalytics') && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            🔒 Upgrade to Premium to unlock detailed analytics and AI insights
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    const OfflineSyncDemo = () => (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-6 w-6 text-green-500" />
                    Offline Sync
                </CardTitle>
                <CardDescription>
                    Work seamlessly offline with automatic synchronization
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="font-medium">Online - All synced</span>
                        </div>
                        <Badge variant="secondary">Connected</Badge>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-medium">Offline Capabilities</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="text-sm">Create and edit tasks</span>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="text-sm">Mark tasks complete</span>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="text-sm">Use Pomodoro timer</span>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="text-sm">View analytics</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-medium">Sync Status</h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Last sync: 2 minutes ago</span>
                                <Badge variant="default">Up to date</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Pending changes: 0</span>
                                <Badge variant="secondary">All synced</Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {!isFeatureAvailable('offlineSync') && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            🔒 Upgrade to Premium to work offline with automatic sync
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    const TeamCollaborationDemo = () => (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-orange-500" />
                    Team Collaboration
                </CardTitle>
                <CardDescription>
                    Collaborate with your team in real-time
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium">Team Members</h4>
                        <Button size="sm" disabled={!isFeatureAvailable('maxTeamMembers')}>
                            <Users className="h-4 w-4 mr-2" />
                            Invite Member
                        </Button>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                    JD
                                </div>
                                <div>
                                    <p className="font-medium">John Doe</p>
                                    <p className="text-xs text-gray-500">john@example.com</p>
                                </div>
                            </div>
                            <Badge variant="default">Owner</Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                    SM
                                </div>
                                <div>
                                    <p className="font-medium">Sarah Miller</p>
                                    <p className="text-xs text-gray-500">sarah@example.com</p>
                                </div>
                            </div>
                            <Badge variant="secondary">Editor</Badge>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-medium">Shared Tasks</h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div>
                                    <p className="font-medium">Website Redesign</p>
                                    <p className="text-sm text-gray-500">Assigned to Sarah Miller</p>
                                </div>
                                <Badge variant="default">In Progress</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div>
                                    <p className="font-medium">Sprint Planning</p>
                                    <p className="text-sm text-gray-500">Assigned to John Doe</p>
                                </div>
                                <Badge variant="secondary">Completed</Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {!isFeatureAvailable('maxTeamMembers') && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            🔒 Upgrade to Premium to collaborate with up to 5 team members
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    const SmartPrioritizationDemo = () => (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Brain className="h-6 w-6 text-indigo-500" />
                    AI Smart Prioritization
                </CardTitle>
                <CardDescription>
                    AI-powered task prioritization for optimal productivity
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium">AI Prioritized Tasks</h4>
                        <Button size="sm" disabled={!isFeatureAvailable('customThemes')}>
                            <Brain className="h-4 w-4 mr-2" />
                            Re-prioritize
                        </Button>
                    </div>

                    <div className="space-y-3">
                        <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-red-800 dark:text-red-200">Client Presentation</p>
                                    <p className="text-sm text-red-600 dark:text-red-300">Due tomorrow, high impact</p>
                                </div>
                                <Badge variant="destructive">Priority 1</Badge>
                            </div>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                                🧠 AI: High deadline urgency + client dependency detected
                            </p>
                        </div>

                        <div className="p-4 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-orange-800 dark:text-orange-200">Code Review</p>
                                    <p className="text-sm text-orange-600 dark:text-orange-300">Blocking team progress</p>
                                </div>
                                <Badge variant="secondary">Priority 2</Badge>
                            </div>
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                                🧠 AI: Team dependency + medium effort required
                            </p>
                        </div>

                        <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-blue-800 dark:text-blue-200">Documentation Update</p>
                                    <p className="text-sm text-blue-600 dark:text-blue-300">When time permits</p>
                                </div>
                                <Badge variant="outline">Priority 3</Badge>
                            </div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                🧠 AI: Low urgency + can be done in background time
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-medium">AI Insights</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-sm font-medium">Workload Balance</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Optimal for your schedule</p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-sm font-medium">Context Switching</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Minimized by 65%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {!isFeatureAvailable('customThemes') && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            🔒 Upgrade to Premium to unlock AI-powered smart prioritization
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    const handleFeatureDemo = (featureId: string) => {
        if (!isFeatureAvailable(featureId as any)) {
            toast.error('Upgrade to Premium to access this feature!');
            return;
        }
        setActiveDemo(activeDemo === featureId ? null : featureId);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full"
                >
                    <Crown className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">Premium Features</span>
                </motion.div>

                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Unlock Next-Level Productivity
                </h1>

                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                    Experience the most innovative and demanded features in the productivity industry.
                    Built with cutting-edge AI and designed for modern teams.
                </p>

                {subscription && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <span className="text-sm">Current Plan:</span>
                        <Badge variant="secondary" className="capitalize">
                            {subscription.tier}
                        </Badge>
                    </div>
                )}
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {premiumFeatures.map((feature, index) => {
                    const Icon = feature.icon;
                    const isAvailable = isFeatureAvailable(feature.id as any);

                    return (
                        <motion.div
                            key={feature.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card
                                className={`h-full cursor-pointer transition-all duration-300 hover:shadow-lg ${activeDemo === feature.id ? 'ring-2 ring-purple-500' : ''
                                    } ${!isAvailable ? 'opacity-75' : ''}`}
                                onClick={() => handleFeatureDemo(feature.id)}
                            >
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className={`p-3 rounded-xl bg-gradient-to-r ${feature.color}`}>
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                        {!isAvailable && (
                                            <Crown className="h-5 w-5 text-yellow-500" />
                                        )}
                                    </div>

                                    <CardTitle className="text-lg">{feature.name}</CardTitle>
                                    <CardDescription>{feature.description}</CardDescription>
                                </CardHeader>

                                <CardContent>
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-sm">Key Benefits:</h4>
                                        <ul className="space-y-1">
                                            {feature.benefits.slice(0, 3).map((benefit, idx) => (
                                                <li key={idx} className="flex items-center gap-2 text-sm">
                                                    <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                                                    <span>{benefit}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <Button
                                            className="w-full"
                                            variant={isAvailable ? "default" : "outline"}
                                            size="sm"
                                        >
                                            {isAvailable ? (
                                                <>
                                                    <Sparkles className="h-4 w-4 mr-2" />
                                                    Try Demo
                                                </>
                                            ) : (
                                                <>
                                                    <Crown className="h-4 w-4 mr-2" />
                                                    Upgrade to Access
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Feature Demos */}
            <AnimatePresence>
                {activeDemo && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <div className="text-center">
                            <h3 className="text-2xl font-bold mb-2">
                                {premiumFeatures.find(f => f.id === activeDemo)?.name} Demo
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Experience the power of this premium feature
                            </p>
                        </div>

                        {activeDemo === 'voice-to-task' && <VoiceToTask />}
                        {activeDemo === 'advanced-analytics' && <AdvancedAnalyticsDemo />}
                        {activeDemo === 'offline-sync' && <OfflineSyncDemo />}
                        {activeDemo === 'team-collaboration' && <TeamCollaborationDemo />}
                        {activeDemo === 'smart-prioritization' && <SmartPrioritizationDemo />}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PremiumFeaturesDemo; 
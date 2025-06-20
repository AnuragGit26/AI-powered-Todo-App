import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
    Mic,
    Brain,
    RefreshCw,
    Users,
    BarChart3,
    Crown,
    Sparkles,
    Play,
    Pause,
    Volume2,
    TrendingUp,
    Calendar,
    Target,
    Zap,
    Shield,
    Clock,
    CheckCircle2,
    ArrowRight,
    Star,
    Rocket,
    X
} from 'lucide-react';
import { useBillingUsage } from '../hooks/useBillingUsage';
import { toast } from 'react-hot-toast';

interface FeatureDemo {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    category: string;
    benefits: string[];
    demoComponent: React.ReactNode;
    tier: 'premium' | 'enterprise';
}

const PremiumFeaturesShowcase: React.FC = () => {
    const { canUseFeature, showUpgradePrompt, tier } = useBillingUsage();
    const [activeDemo, setActiveDemo] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [voiceText, setVoiceText] = useState('');
    const [activeTab, setActiveTab] = useState('ai-assistant');

    // Voice-to-Task Demo
    const VoiceToTaskDemo = () => {
        const handleStartRecording = () => {
            if (!canUseFeature('voiceToTask')) {
                showUpgradePrompt('voiceToTask', 'Upgrade to Premium to use Voice-to-Task AI');
                return;
            }

            setIsRecording(true);
            setVoiceText('Listening...');

            // Simulate voice recognition
            setTimeout(() => {
                setVoiceText('Analyzing speech...');
                setTimeout(() => {
                    setVoiceText('✨ Task created: "Review quarterly reports by Friday" with High priority and 2-hour estimate');
                    setIsRecording(false);
                    toast.success('Task created from voice input!');
                }, 1500);
            }, 2000);
        };

        return (
            <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-3">
                        <Mic className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">Voice Input</span>
                    </div>
                    <Button
                        onClick={handleStartRecording}
                        disabled={isRecording}
                        className={`w-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                    >
                        {isRecording ? (
                            <>
                                <Pause className="h-4 w-4 mr-2" />
                                Recording...
                            </>
                        ) : (
                            <>
                                <Play className="h-4 w-4 mr-2" />
                                Try Voice Input
                            </>
                        )}
                    </Button>
                </div>

                {voiceText && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-800 p-4 rounded-lg border"
                    >
                        <div className="flex items-start gap-3">
                            <Brain className="h-5 w-5 text-purple-500 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium mb-1">AI Analysis Result</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{voiceText}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        );
    };

    // Advanced Analytics Demo
    const AdvancedAnalyticsDemo = () => {
        const mockData = [
            { day: 'Mon', productivity: 85, tasks: 12 },
            { day: 'Tue', productivity: 92, tasks: 15 },
            { day: 'Wed', productivity: 78, tasks: 9 },
            { day: 'Thu', productivity: 95, tasks: 18 },
            { day: 'Fri', productivity: 88, tasks: 14 },
        ];

        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">Peak Hours</span>
                        </div>
                        <p className="text-lg font-bold text-green-600">10-11 AM</p>
                        <p className="text-xs text-gray-600">95% productivity</p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">Completion Rate</span>
                        </div>
                        <p className="text-lg font-bold text-blue-600">87%</p>
                        <p className="text-xs text-gray-600">+12% this week</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-purple-500" />
                        Weekly Productivity Trend
                    </h4>
                    <div className="space-y-2">
                        {mockData.map((day) => (
                            <div key={day.day} className="flex items-center gap-3">
                                <span className="text-sm w-8">{day.day}</span>
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${day.productivity}%` }}
                                        transition={{ delay: 0.1, duration: 0.5 }}
                                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                                    />
                                </div>
                                <span className="text-sm text-gray-600 w-12">{day.productivity}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // Offline Sync Demo
    const OfflineSyncDemo = () => {
        const [syncStatus, setSyncStatus] = useState<'online' | 'offline' | 'syncing'>('online');

        const toggleOfflineMode = () => {
            if (syncStatus === 'online') {
                setSyncStatus('offline');
                toast('Offline mode activated', { icon: '📱' });
            } else if (syncStatus === 'offline') {
                setSyncStatus('syncing');
                toast('Syncing changes...', { icon: '🔄' });
                setTimeout(() => {
                    setSyncStatus('online');
                    toast.success('All changes synced!');
                }, 2000);
            }
        };

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-lg border">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${syncStatus === 'online' ? 'bg-green-500' :
                            syncStatus === 'offline' ? 'bg-orange-500' : 'bg-blue-500 animate-pulse'
                            }`} />
                        <span className="font-medium capitalize">{syncStatus}</span>
                    </div>
                    <Button
                        onClick={toggleOfflineMode}
                        variant="outline"
                        size="sm"
                        disabled={syncStatus === 'syncing'}
                    >
                        {syncStatus === 'syncing' ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Syncing...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                {syncStatus === 'online' ? 'Go Offline' : 'Sync Now'}
                            </>
                        )}
                    </Button>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Task created offline</span>
                        <Badge variant="secondary" className="ml-auto">Pending sync</Badge>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Task completed offline</span>
                        <Badge variant="secondary" className="ml-auto">Pending sync</Badge>
                    </div>
                </div>
            </div>
        );
    };

    // Team Collaboration Demo
    const TeamCollaborationDemo = () => {
        const teamMembers = [
            { name: 'Alice Johnson', avatar: '👩‍💼', status: 'online', tasks: 5 },
            { name: 'Bob Smith', avatar: '👨‍💻', status: 'away', tasks: 3 },
            { name: 'Carol Davis', avatar: '👩‍🎨', status: 'online', tasks: 7 },
        ];

        return (
            <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-500" />
                        Team Members
                    </h4>
                    <div className="space-y-3">
                        {teamMembers.map((member) => (
                            <div key={member.name} className="flex items-center gap-3">
                                <span className="text-xl">{member.avatar}</span>
                                <div>
                                    <p className="font-medium">{member.name}</p>
                                    <p className="text-sm text-gray-600">{member.tasks} tasks assigned</p>
                                </div>
                                <div className={`ml-auto flex items-center gap-1.5 text-xs ${member.status === 'online' ? 'text-green-500' : 'text-orange-500'
                                    }`}>
                                    <div className={`w-2 h-2 rounded-full ${member.status === 'online' ? 'bg-green-500' : 'bg-orange-500'
                                        }`} />
                                    <span>{member.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <Button className="w-full bg-purple-500 hover:bg-purple-600">
                    Invite Team Members
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        );
    };

    // AI Smart Prioritization Demo
    const SmartPrioritizationDemo = () => {
        const tasks = [
            { id: 1, title: 'Finalize Q3 report', priority: 'High', deadline: '2 days' },
            { id: 2, title: 'Draft marketing email', priority: 'Medium', deadline: '4 days' },
            { id: 3, title: 'Update server dependencies', priority: 'Low', deadline: '1 week' },
        ];

        return (
            <div className="space-y-4">
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Brain className="h-4 w-4 text-blue-500" />
                        AI Prioritization Matrix
                    </h4>
                    <div className="space-y-2">
                        {tasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-md">
                                <div>
                                    <p className="font-medium">{task.title}</p>
                                    <p className="text-xs text-gray-500">Deadline: {task.deadline}</p>
                                </div>
                                <Badge variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'secondary' : 'default'}>
                                    {task.priority}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </Card>
                <Button variant="outline" className="w-full">
                    View Full Priority Matrix
                </Button>
            </div>
        );
    };

    const premiumFeatures: FeatureDemo[] = [
        {
            id: 'voice-to-task',
            name: 'Voice-to-Task AI',
            description: 'Convert speech to intelligent tasks with AI analysis, priority detection, and time estimation.',
            icon: <Mic className="h-6 w-6" />,
            category: 'AI Assistant',
            benefits: ['Natural speech recognition', 'Automatic priority detection', 'Smart time estimation', 'Context-aware task creation'],
            demoComponent: <VoiceToTaskDemo />,
            tier: 'premium'
        },
        {
            id: 'smart-prioritization',
            name: 'AI Smart Prioritization',
            description: 'Intelligent priority scoring based on deadlines, importance, and workload balancing.',
            icon: <Brain className="h-6 w-6" />,
            category: 'AI Assistant',
            benefits: ['Reduces manual sorting', 'Focuses on high-impact tasks', 'Adapts to changing priorities', 'Balances team workload'],
            demoComponent: <SmartPrioritizationDemo />,
            tier: 'premium'
        },
        {
            id: 'advanced-analytics',
            name: 'Advanced Analytics',
            description: 'Gain deeper insights into your productivity with trend analysis, peak performance tracking, and more.',
            icon: <BarChart3 className="h-6 w-6" />,
            category: 'Analytics',
            benefits: ['Identify productivity patterns', 'Optimize your work schedule', 'Track progress over time', 'Data-driven decision making'],
            demoComponent: <AdvancedAnalyticsDemo />,
            tier: 'premium'
        },
        {
            id: 'offline-sync',
            name: 'Offline Sync',
            description: 'Work seamlessly without an internet connection. Your data syncs automatically when you\'re back online.',
            icon: <RefreshCw className="h-6 w-6" />,
            category: 'Sync',
            benefits: ['Uninterrupted workflow', 'Work from anywhere', 'Automatic data synchronization', 'Peace of mind'],
            demoComponent: <OfflineSyncDemo />,
            tier: 'premium'
        },
        {
            id: 'team-collaboration',
            name: 'Team Collaboration',
            description: 'Collaborate with your team in real-time with shared projects, task assignments, and progress tracking.',
            icon: <Users className="h-6 w-6" />,
            category: 'Collaboration',
            benefits: ['Centralized team projects', 'Clear task ownership', 'Real-time progress updates', 'Improved team communication'],
            demoComponent: <TeamCollaborationDemo />,
            tier: 'enterprise'
        },
        {
            id: 'priority-support',
            name: 'Priority Support',
            description: 'Get dedicated, fast-tracked support from our expert team to resolve issues and answer questions quickly.',
            icon: <Shield className="h-6 w-6" />,
            category: 'Support',
            benefits: ['Skip the queue', 'Expert assistance', '24/7 availability', 'Personalized solutions'],
            demoComponent: <></>, // No demo component for support
            tier: 'enterprise'
        },
    ];

    const handleTryDemo = (feature: FeatureDemo) => {
        if (canUseFeature(feature.id)) {
            setActiveDemo(feature.id);
        } else {
            showUpgradePrompt(feature.id, `Upgrade to ${feature.tier} to try this feature`);
        }
    };

    const categories = Array.from(new Set(premiumFeatures.map(f => f.category)));

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-3">
                    <Crown className="h-8 w-8 text-yellow-500" />
                    Premium Features
                </h2>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Unlock powerful productivity features with our premium plans.
                    Collaborate, analyze, and achieve more.
                </p>
            </div>

            <Tabs defaultValue="ai-assistant" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="flex flex-wrap h-auto p-2 mb-6 bg-gray-100/50 dark:bg-gray-800/30 rounded-lg">
                    {categories.map(category => (
                        <TabsTrigger
                            key={category}
                            value={category.toLowerCase().replace(' ', '-')}
                            className="flex-grow md:flex-grow-0"
                        >
                            {category}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {categories.map(category => (
                    <TabsContent
                        key={category}
                        value={category.toLowerCase().replace(' ', '-')}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {premiumFeatures
                                .filter(f => f.category === category)
                                .map((feature) => (
                                    <motion.div
                                        key={feature.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <Card className="h-full bg-white dark:bg-gray-800/20">
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-2 rounded-lg">
                                                            {feature.icon}
                                                        </div>
                                                        <CardTitle className="text-lg">{feature.name}</CardTitle>
                                                    </div>
                                                    <Badge variant={feature.tier === 'premium' ? 'default' : 'secondary'} className="capitalize">
                                                        {feature.tier}
                                                    </Badge>
                                                </div>
                                                <CardDescription className="pt-2">{feature.description}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <ul className="space-y-2">
                                                    {feature.benefits.map((benefit, index) => (
                                                        <li key={index} className="flex items-center gap-2 text-sm">
                                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                            <span>{benefit}</span>
                                                        </li>
                                                    ))}
                                                </ul>

                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        onClick={() => handleTryDemo(feature)}
                                                        className="w-full"
                                                        disabled={feature.tier === 'enterprise' && tier !== 'enterprise'}
                                                    >
                                                        <Sparkles className="h-4 w-4 mr-2" />
                                                        Try Demo
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            <AnimatePresence>
                {activeDemo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setActiveDemo(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Card className="border-0">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-3">
                                            <Sparkles className="h-5 w-5 text-yellow-500" />
                                            {premiumFeatures.find(f => f.id === activeDemo)?.name} Demo
                                        </CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setActiveDemo(null)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {premiumFeatures.find(f => f.id === activeDemo)?.demoComponent}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PremiumFeaturesShowcase; 
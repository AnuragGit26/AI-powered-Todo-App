import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
    Mic,
    Brain,
    Sync,
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
    Rocket
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
                                <Sync className="h-4 w-4 mr-2 animate-spin" />
                                Syncing...
                            </>
                        ) : (
                            <>
                                <Sync className="h-4 w-4 mr-2" />
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
                    <div className="space-y-2">
                        {teamMembers.map((member, index) => (
                            <motion.div
                                key={member.name}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-lg"
                            >
                                <span className="text-lg">{member.avatar}</span>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{member.name}</p>
                                    <p className="text-xs text-gray-500">{member.tasks} active tasks</p>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${member.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                                    }`} />
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                    <h4 className="font-medium mb-3">Recent Activity</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <span>👩‍💼</span>
                            <span>Alice assigned "Design Review" to you</span>
                            <span className="text-xs text-gray-500 ml-auto">2m ago</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>👨‍💻</span>
                            <span>Bob completed "API Integration"</span>
                            <span className="text-xs text-gray-500 ml-auto">5m ago</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // AI Smart Prioritization Demo
    const SmartPrioritizationDemo = () => {
        const tasks = [
            { name: 'Client presentation', priority: 'High', aiScore: 95, deadline: '2 hours' },
            { name: 'Code review', priority: 'Medium', aiScore: 78, deadline: '1 day' },
            { name: 'Team meeting prep', priority: 'Medium', aiScore: 82, deadline: '4 hours' },
            { name: 'Documentation update', priority: 'Low', aiScore: 45, deadline: '1 week' },
        ];

        return (
            <div className="space-y-4">
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-4 rounded-lg border">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Brain className="h-4 w-4 text-indigo-500" />
                        AI-Prioritized Tasks
                    </h4>
                    <div className="space-y-2">
                        {tasks.map((task, index) => (
                            <motion.div
                                key={task.name}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg"
                            >
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{task.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge
                                            variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'default' : 'secondary'}
                                            className="text-xs"
                                        >
                                            {task.priority}
                                        </Badge>
                                        <span className="text-xs text-gray-500">Due in {task.deadline}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1">
                                        <Zap className="h-3 w-3 text-yellow-500" />
                                        <span className="text-sm font-medium">{task.aiScore}</span>
                                    </div>
                                    <p className="text-xs text-gray-500">AI Score</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const features: FeatureDemo[] = [
        {
            id: 'voice-to-task',
            name: 'Voice-to-Task AI',
            description: 'Convert speech to intelligent tasks with AI analysis, priority detection, and time estimation',
            icon: <Mic className="h-6 w-6" />,
            category: 'AI Assistant',
            benefits: [
                'Natural speech recognition',
                'Automatic priority detection',
                'Smart time estimation',
                'Context-aware task creation'
            ],
            demoComponent: <VoiceToTaskDemo />,
            tier: 'premium'
        },
        {
            id: 'advanced-analytics',
            name: 'Advanced Analytics',
            description: 'Deep productivity insights with trend analysis, peak hours detection, and completion predictions',
            icon: <BarChart3 className="h-6 w-6" />,
            category: 'Analytics',
            benefits: [
                'Productivity trend analysis',
                'Peak performance hours',
                'Completion rate tracking',
                'Predictive insights'
            ],
            demoComponent: <AdvancedAnalyticsDemo />,
            tier: 'premium'
        },
        {
            id: 'offline-sync',
            name: 'Offline Sync',
            description: 'Work offline with full functionality and automatic sync when connected',
            icon: <Sync className="h-6 w-6" />,
            category: 'Sync',
            benefits: [
                'Full offline functionality',
                'Automatic conflict resolution',
                'Real-time sync when online',
                'Local data encryption'
            ],
            demoComponent: <OfflineSyncDemo />,
            tier: 'premium'
        },
        {
            id: 'team-collaboration',
            name: 'Team Collaboration',
            description: 'Real-time task sharing, team progress tracking, and assignment delegation',
            icon: <Users className="h-6 w-6" />,
            category: 'Collaboration',
            benefits: [
                'Real-time collaboration',
                'Task assignment & delegation',
                'Team progress tracking',
                'Activity notifications'
            ],
            demoComponent: <TeamCollaborationDemo />,
            tier: 'premium'
        },
        {
            id: 'smart-prioritization',
            name: 'AI Smart Prioritization',
            description: 'Intelligent priority scoring based on deadlines, importance, and workload balancing',
            icon: <Brain className="h-6 w-6" />,
            category: 'AI Assistant',
            benefits: [
                'Intelligent priority scoring',
                'Deadline-aware scheduling',
                'Workload balancing',
                'Context-based recommendations'
            ],
            demoComponent: <SmartPrioritizationDemo />,
            tier: 'premium'
        }
    ];

    const categories = [...new Set(features.map(f => f.category))];

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                    <Crown className="h-6 w-6 text-yellow-500" />
                    Premium Features
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Unlock powerful productivity features with our premium plans
                </p>
            </div>

            <Tabs defaultValue={categories[0]} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    {categories.map((category) => (
                        <TabsTrigger key={category} value={category}>
                            {category}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {categories.map((category) => (
                    <TabsContent key={category} value={category} className="space-y-4">
                        <div className="grid gap-4">
                            {features
                                .filter(feature => feature.category === category)
                                .map((feature) => (
                                    <Card key={feature.id} className="overflow-hidden">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white">
                                                        {feature.icon}
                                                    </div>
                                                    <div>
                                                        <CardTitle className="flex items-center gap-2">
                                                            {feature.name}
                                                            <Badge variant="secondary" className="capitalize">
                                                                {feature.tier}
                                                            </Badge>
                                                        </CardTitle>
                                                        <CardDescription>
                                                            {feature.description}
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setActiveDemo(activeDemo === feature.id ? null : feature.id)}
                                                >
                                                    {activeDemo === feature.id ? 'Hide Demo' : 'Try Demo'}
                                                </Button>
                                            </div>
                                        </CardHeader>

                                        <CardContent>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <h4 className="font-medium mb-2">Key Benefits</h4>
                                                    <ul className="space-y-1">
                                                        {feature.benefits.map((benefit, index) => (
                                                            <li key={index} className="flex items-center gap-2 text-sm">
                                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                                {benefit}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <AnimatePresence>
                                                    {activeDemo === feature.id && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="md:col-span-2"
                                                        >
                                                            <div className="border-t pt-4">
                                                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                                                    <Sparkles className="h-4 w-4 text-purple-500" />
                                                                    Interactive Demo
                                                                </h4>
                                                                {feature.demoComponent}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            {tier === 'free' && (
                <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <Rocket className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">Ready to unlock these features?</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Upgrade to Premium and boost your productivity with AI-powered features
                            </p>
                            <Button
                                onClick={() => window.dispatchEvent(new CustomEvent('showUpgradeModal'))}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            >
                                <Crown className="h-4 w-4 mr-2" />
                                Upgrade to Premium
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default PremiumFeaturesShowcase; 
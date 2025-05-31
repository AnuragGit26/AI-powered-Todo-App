import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import {
    CreditCard,
    Star,
    Check,
    X,
    Crown,
    Zap,
    TrendingUp,
    Users,
    Mic,
    Brain,
    RefreshCw,
    BarChart3,
    Calendar,
    Shield,
    ExternalLink,
    Download,
    Settings,
    AlertCircle,
    Clock,
    Sparkles,
    Gift,
    Rocket,
    Target
} from 'lucide-react';
import { useBillingStore, initializeFreeTierSubscription } from '../store/billingStore';
import { billingService, pricingPlans, getPremiumFeatures } from '../services/billingService';
import { toast } from 'react-hot-toast';
import { PricingPlan, SubscriptionTier } from '../types';
import PremiumFeaturesShowcase from './PremiumFeaturesShowcase';
import BillingAnalytics from './BillingAnalytics';
import SubscriptionManager from './SubscriptionManager';

interface BillingDashboardProps {
    userId: string;
}

const BillingDashboard: React.FC<BillingDashboardProps> = ({ userId }) => {
    const {
        subscription,
        paymentMethods,
        invoices,
        isLoading,
        error,
        setSubscription,
        setPaymentMethods,
        setInvoices,
        setLoading,
        setError,
    } = useBillingStore();

    const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showUsageWarning, setShowUsageWarning] = useState(false);

    // Listen for upgrade modal events
    useEffect(() => {
        const handleShowUpgradeModal = () => setShowUpgradeModal(true);
        window.addEventListener('showUpgradeModal', handleShowUpgradeModal);
        return () => window.removeEventListener('showUpgradeModal', handleShowUpgradeModal);
    }, []);

    useEffect(() => {
        loadBillingData();
    }, [userId]);

    // Check for usage warnings
    useEffect(() => {
        if (subscription) {
            const warnings = getUsageWarnings();
            setShowUsageWarning(warnings.length > 0);
        }
    }, [subscription]);

    const loadBillingData = async () => {
        if (!userId) return;

        setLoading(true);
        try {
            // Get or create subscription
            let userSubscription = await billingService.getSubscription(userId);

            if (!userSubscription) {
                // Create free tier subscription for new users
                userSubscription = initializeFreeTierSubscription(userId);
                setSubscription(userSubscription);
                toast.success('Welcome! You\'re on the Free tier with full access to basic features.');
            } else {
                setSubscription(userSubscription);
            }

            // Load payment methods and invoices
            const [methods, billingInvoices] = await Promise.all([
                billingService.getPaymentMethods(userId),
                billingService.getInvoices(userId),
            ]);

            setPaymentMethods(methods);
            setInvoices(billingInvoices);
        } catch (err) {
            setError('Failed to load billing information');
            console.error('Billing data error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (plan: PricingPlan) => {
        try {
            if (plan.stripePriceId) {
                const { url } = await billingService.createCheckoutSession(plan.stripePriceId, userId);
                window.open(url, '_blank');
            } else {
                toast.success(`Upgraded to ${plan.name} plan!`);
                setShowUpgradeModal(false);
            }
        } catch (error) {
            toast.error('Failed to initiate upgrade');
        }
    };

    const getUsagePercentage = (used: number, limit: number) => {
        if (limit === -1) return 0; // Unlimited
        return Math.min((used / limit) * 100, 100);
    };

    const getUsageWarnings = () => {
        if (!subscription) return [];

        const warnings = [];
        const { usage, limits } = subscription;

        // Check each usage metric for warnings (80% threshold)
        if (limits.maxTasks !== -1 && (usage.tasksCreated / limits.maxTasks) >= 0.8) {
            warnings.push({
                type: 'tasks',
                message: `You've used ${usage.tasksCreated} of ${limits.maxTasks} tasks (${Math.round((usage.tasksCreated / limits.maxTasks) * 100)}%)`
            });
        }

        if (limits.maxAiAnalysis !== -1 && (usage.aiAnalysisUsed / limits.maxAiAnalysis) >= 0.8) {
            warnings.push({
                type: 'ai',
                message: `You've used ${usage.aiAnalysisUsed} of ${limits.maxAiAnalysis} AI analyses (${Math.round((usage.aiAnalysisUsed / limits.maxAiAnalysis) * 100)}%)`
            });
        }

        if (limits.maxPomodoroSessions !== -1 && (usage.pomodoroSessions / limits.maxPomodoroSessions) >= 0.8) {
            warnings.push({
                type: 'pomodoro',
                message: `You've used ${usage.pomodoroSessions} of ${limits.maxPomodoroSessions} Pomodoro sessions (${Math.round((usage.pomodoroSessions / limits.maxPomodoroSessions) * 100)}%)`
            });
        }

        return warnings;
    };

    const getTierIcon = (tier: SubscriptionTier) => {
        switch (tier) {
            case 'premium': return <Crown className="h-5 w-5 text-yellow-500" />;
            case 'enterprise': return <Star className="h-5 w-5 text-purple-500" />;
            default: return <Zap className="h-5 w-5 text-blue-500" />;
        }
    };

    const getTierColor = (tier: SubscriptionTier) => {
        switch (tier) {
            case 'premium': return 'from-yellow-400 to-yellow-600';
            case 'enterprise': return 'from-purple-400 to-purple-600';
            default: return 'from-blue-400 to-blue-600';
        }
    };

    const getProgressColor = (percentage: number) => {
        if (percentage >= 90) return 'bg-red-500';
        if (percentage >= 80) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const premiumFeatures = getPremiumFeatures();
    const usageWarnings = getUsageWarnings();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Usage Warning Banner */}
            <AnimatePresence>
                {showUsageWarning && usageWarnings.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
                    >
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                                    Usage Limit Warning
                                </h4>
                                <div className="space-y-1">
                                    {usageWarnings.map((warning, index) => (
                                        <p key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                                            {warning.message}
                                        </p>
                                    ))}
                                </div>
                                <Button
                                    onClick={() => setShowUpgradeModal(true)}
                                    size="sm"
                                    className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white"
                                >
                                    <Rocket className="h-4 w-4 mr-2" />
                                    Upgrade Now
                                </Button>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowUsageWarning(false)}
                                className="text-yellow-600 hover:text-yellow-700"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Current Subscription Status */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {subscription && getTierIcon(subscription.tier)}
                            <div>
                                <CardTitle className="capitalize text-xl">
                                    {subscription?.tier || 'Free'} Plan
                                </CardTitle>
                                <CardDescription>
                                    {subscription?.status === 'active' ? 'Active subscription' : 'Manage your subscription'}
                                </CardDescription>
                            </div>
                        </div>
                        {subscription?.tier !== 'enterprise' && (
                            <Button
                                onClick={() => setShowUpgradeModal(true)}
                                className={`bg-gradient-to-r ${getTierColor(subscription?.tier || 'free')} hover:shadow-lg transition-all`}
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Upgrade
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {subscription && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {/* Enhanced Usage Statistics with Color Coding */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Tasks</span>
                                    <span className={getUsagePercentage(subscription.usage.tasksCreated, subscription.limits.maxTasks) >= 80 ? 'text-red-600 font-semibold' : ''}>
                                        {subscription.usage.tasksCreated}/{subscription.limits.maxTasks === -1 ? '∞' : subscription.limits.maxTasks}
                                    </span>
                                </div>
                                <Progress
                                    value={getUsagePercentage(subscription.usage.tasksCreated, subscription.limits.maxTasks)}
                                    className="h-2"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>AI Analysis</span>
                                    <span className={getUsagePercentage(subscription.usage.aiAnalysisUsed, subscription.limits.maxAiAnalysis) >= 80 ? 'text-red-600 font-semibold' : ''}>
                                        {subscription.usage.aiAnalysisUsed}/{subscription.limits.maxAiAnalysis === -1 ? '∞' : subscription.limits.maxAiAnalysis}
                                    </span>
                                </div>
                                <Progress
                                    value={getUsagePercentage(subscription.usage.aiAnalysisUsed, subscription.limits.maxAiAnalysis)}
                                    className="h-2"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Pomodoro Sessions</span>
                                    <span className={getUsagePercentage(subscription.usage.pomodoroSessions, subscription.limits.maxPomodoroSessions) >= 80 ? 'text-red-600 font-semibold' : ''}>
                                        {subscription.usage.pomodoroSessions}/{subscription.limits.maxPomodoroSessions === -1 ? '∞' : subscription.limits.maxPomodoroSessions}
                                    </span>
                                </div>
                                <Progress
                                    value={getUsagePercentage(subscription.usage.pomodoroSessions, subscription.limits.maxPomodoroSessions)}
                                    className="h-2"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Integrations</span>
                                    <span className={getUsagePercentage(subscription.usage.integrationsSynced, subscription.limits.maxIntegrations) >= 80 ? 'text-red-600 font-semibold' : ''}>
                                        {subscription.usage.integrationsSynced}/{subscription.limits.maxIntegrations === -1 ? '∞' : subscription.limits.maxIntegrations}
                                    </span>
                                </div>
                                <Progress
                                    value={getUsagePercentage(subscription.usage.integrationsSynced, subscription.limits.maxIntegrations)}
                                    className="h-2"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Team Members</span>
                                    <span>{subscription.usage.teamMembersInvited}/{subscription.limits.maxTeamMembers === -1 ? '∞' : subscription.limits.maxTeamMembers}</span>
                                </div>
                                <Progress value={getUsagePercentage(subscription.usage.teamMembersInvited, subscription.limits.maxTeamMembers)} className="h-2" />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Tabs defaultValue="plans" className="w-full">
                <TabsList className="grid grid-cols-6 w-full">
                    <TabsTrigger value="plans">Pricing Plans</TabsTrigger>
                    <TabsTrigger value="features">Premium Features</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="billing">Billing History</TabsTrigger>
                    <TabsTrigger value="manage">Manage Plan</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                {/* Pricing Plans */}
                <TabsContent value="plans" className="space-y-6">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <Button
                            variant={billingInterval === 'monthly' ? 'default' : 'outline'}
                            onClick={() => setBillingInterval('monthly')}
                        >
                            Monthly
                        </Button>
                        <Button
                            variant={billingInterval === 'yearly' ? 'default' : 'outline'}
                            onClick={() => setBillingInterval('yearly')}
                        >
                            Yearly
                            <Badge variant="secondary" className="ml-2">Save 17%</Badge>
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pricingPlans
                            .filter(plan => plan.interval === billingInterval || plan.tier === 'free')
                            .map((plan) => (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative"
                                >
                                    <Card className={`relative h-full ${plan.popular ? 'border-yellow-400 shadow-lg' : ''}`}>
                                        {plan.popular && (
                                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                                <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black">
                                                    Most Popular
                                                </Badge>
                                            </div>
                                        )}

                                        <CardHeader className="text-center">
                                            <div className={`w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r ${getTierColor(plan.tier)} flex items-center justify-center`}>
                                                {getTierIcon(plan.tier)}
                                            </div>

                                            <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                            <div className="space-y-1">
                                                <div className="text-3xl font-bold">
                                                    ${plan.price}
                                                    <span className="text-lg text-gray-500">/{plan.interval}</span>
                                                </div>
                                                {plan.interval === 'yearly' && plan.tier === 'premium' && (
                                                    <p className="text-sm text-green-600">Save $20 per year</p>
                                                )}
                                            </div>
                                        </CardHeader>

                                        <CardContent className="space-y-4">
                                            <ul className="space-y-3">
                                                {plan.features.map((feature, index) => (
                                                    <li key={index} className="flex items-center gap-2">
                                                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                        <span className="text-sm">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            <Button
                                                className="w-full"
                                                variant={plan.tier === subscription?.tier ? 'outline' : 'default'}
                                                disabled={plan.tier === subscription?.tier}
                                                onClick={() => plan.tier !== subscription?.tier && handleUpgrade(plan)}
                                            >
                                                {plan.tier === subscription?.tier ? 'Current Plan' :
                                                    plan.tier === 'free' ? 'Downgrade' : 'Upgrade Now'}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                    </div>
                </TabsContent>

                {/* Premium Features */}
                <TabsContent value="features" className="space-y-6">
                    <PremiumFeaturesShowcase />
                </TabsContent>

                {/* Analytics */}
                <TabsContent value="analytics" className="space-y-6">
                    <BillingAnalytics userId={userId} />
                </TabsContent>

                {/* Manage Plan */}
                <TabsContent value="manage" className="space-y-6">
                    <SubscriptionManager userId={userId} />
                </TabsContent>

                {/* Billing History */}
                <TabsContent value="billing" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Billing History
                            </CardTitle>
                            <CardDescription>View your past invoices and payment history</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {invoices.length > 0 ? (
                                <div className="space-y-4">
                                    {invoices.map((invoice) => (
                                        <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="space-y-1">
                                                <p className="font-medium">Invoice #{invoice.id.slice(-8)}</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(invoice.invoiceDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-medium">${invoice.amount}</p>
                                                    <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                                                        {invoice.status}
                                                    </Badge>
                                                </div>
                                                {invoice.downloadUrl && (
                                                    <Button size="sm" variant="outline">
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500">No billing history yet</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Settings */}
                <TabsContent value="settings" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Billing Settings
                            </CardTitle>
                            <CardDescription>Manage your payment methods and preferences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Subscription Status */}
                            {subscription && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Subscription Status</span>
                                        <Badge variant={subscription.status === 'active' ? 'default' : 'destructive'}>
                                            {subscription.status}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Next Billing Date</span>
                                        <span className="text-sm">
                                            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {subscription.cancelAtPeriodEnd && (
                                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="h-5 w-5 text-yellow-600" />
                                                <span className="font-medium text-yellow-800 dark:text-yellow-200">
                                                    Subscription will cancel at period end
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <Separator />

                            {/* Payment Methods */}
                            <div className="space-y-4">
                                <h4 className="font-medium">Payment Methods</h4>
                                {paymentMethods.length > 0 ? (
                                    <div className="space-y-2">
                                        {paymentMethods.map((method) => (
                                            <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <CreditCard className="h-5 w-5" />
                                                    <div>
                                                        <p className="font-medium">
                                                            {method.brand} •••• {method.last4}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Expires {method.expiryMonth}/{method.expiryYear}
                                                        </p>
                                                    </div>
                                                </div>
                                                {method.isDefault && (
                                                    <Badge variant="secondary">Default</Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-500">No payment methods added</p>
                                        <Button variant="outline" className="mt-2">
                                            Add Payment Method
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Upgrade Modal */}
            <AnimatePresence>
                {showUpgradeModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowUpgradeModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <Crown className="h-6 w-6 text-yellow-500" />
                                            Upgrade Your Plan
                                        </h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Choose the perfect plan for your productivity needs
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowUpgradeModal(false)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-center justify-center gap-4 mb-6">
                                        <span className={billingInterval === 'monthly' ? 'font-medium' : 'text-gray-500'}>
                                            Monthly
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
                                            className="relative"
                                        >
                                            <div className={`w-12 h-6 rounded-full transition-colors ${billingInterval === 'yearly' ? 'bg-blue-500' : 'bg-gray-300'
                                                }`}>
                                                <div className={`w-5 h-5 bg-white rounded-full transition-transform transform ${billingInterval === 'yearly' ? 'translate-x-6' : 'translate-x-0.5'
                                                    } mt-0.5`} />
                                            </div>
                                        </Button>
                                        <span className={billingInterval === 'yearly' ? 'font-medium' : 'text-gray-500'}>
                                            Yearly
                                            <Badge variant="secondary" className="ml-2">Save 17%</Badge>
                                        </span>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {pricingPlans
                                        .filter(plan => plan.interval === billingInterval && plan.tier !== 'free')
                                        .map((plan) => (
                                            <motion.div
                                                key={plan.id}
                                                whileHover={{ scale: 1.02 }}
                                                className={`relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}
                                            >
                                                {plan.popular && (
                                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                                        <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                                                    </div>
                                                )}
                                                <Card className="h-full">
                                                    <CardHeader>
                                                        <div className="flex items-center justify-between">
                                                            <CardTitle className="flex items-center gap-2">
                                                                {getTierIcon(plan.tier)}
                                                                {plan.name}
                                                            </CardTitle>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-3xl font-bold">${plan.price}</span>
                                                                <span className="text-gray-500">/{plan.interval}</span>
                                                            </div>
                                                            {plan.interval === 'yearly' && (
                                                                <p className="text-sm text-green-600">
                                                                    Save ${((plan.price / 12) * 12 * 1.2 - plan.price).toFixed(0)} per year
                                                                </p>
                                                            )}
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <ul className="space-y-2">
                                                            {plan.features.map((feature, index) => (
                                                                <li key={index} className="flex items-start gap-2 text-sm">
                                                                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                                    {feature}
                                                                </li>
                                                            ))}
                                                        </ul>

                                                        <Button
                                                            className="w-full"
                                                            variant={plan.tier === subscription?.tier ? 'outline' : 'default'}
                                                            disabled={plan.tier === subscription?.tier}
                                                            onClick={() => {
                                                                handleUpgrade(plan);
                                                                setShowUpgradeModal(false);
                                                            }}
                                                        >
                                                            {plan.tier === subscription?.tier ? 'Current Plan' : 'Upgrade Now'}
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                </div>

                                <div className="mt-6 text-center text-sm text-gray-500">
                                    <p>All plans include a 14-day free trial. Cancel anytime.</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BillingDashboard; 
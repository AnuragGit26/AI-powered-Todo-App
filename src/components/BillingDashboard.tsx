import React, { useState, useEffect, useMemo } from 'react';
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
import SubscriptionManager from './SubscriptionManager';
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider
} from "./ui/tooltip";

const BillingDashboard: React.FC = () => {
    const {
        subscription: initialSubscription,
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

    const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showUsageWarning, setShowUsageWarning] = useState(false);
    const [activeTab, setActiveTab] = useState('plans');
    const [currency, setCurrency] = useState('USD');
    const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({ USD: 1 });
    const [currencyLoaded, setCurrencyLoaded] = useState(false);

    // Listen for upgrade modal events
    useEffect(() => {
        const handleShowUpgradeModal = () => setShowUpgradeModal(true);
        window.addEventListener('showUpgradeModal', handleShowUpgradeModal);
        return () => window.removeEventListener('showUpgradeModal', handleShowUpgradeModal);
    }, []);

    useEffect(() => {
        loadBillingData();
    }, []);

    // Check for usage warnings
    useEffect(() => {
        if (subscription) {
            const warnings = getUsageWarnings();
            setShowUsageWarning(warnings.length > 0);
        }
    }, [subscription]);

    useEffect(() => {
        async function fetchCurrencyAndRates() {
            try {
                // Get user currency
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                const userCurrency = data.currency || 'USD';
                setCurrency(userCurrency);
                // Get exchange rates
                const ratesRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                const ratesData = await ratesRes.json();
                setExchangeRates(ratesData.rates);
            } catch (e) {
                setCurrency('USD');
                setExchangeRates({ USD: 1 });
            } finally {
                setCurrencyLoaded(true);
            }
        }
        fetchCurrencyAndRates();
    }, []);

    const loadBillingData = async () => {
        setLoading(true);
        try {
            // Get or create subscription
            let userSubscription = await billingService.getSubscription('user-id-placeholder'); // Placeholder

            if (!userSubscription) {
                // Create free tier subscription for new users
                userSubscription = initializeFreeTierSubscription('user-id-placeholder'); // Placeholder
                setSubscription(userSubscription);
                toast.success('Welcome! You\'re on the Free tier with full access to basic features.');
            } else {
                setSubscription(userSubscription);
            }

            // Load payment methods and invoices
            const [methods, billingInvoices] = await Promise.all([
                billingService.getPaymentMethods('user-id-placeholder'), // Placeholder
                billingService.getInvoices('user-id-placeholder'), // Placeholder
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
                const { url } = await billingService.createCheckoutSession(plan.stripePriceId, 'user-id-placeholder'); // Placeholder
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
            case 'premium': return <Crown className="h-5 w-5 text-yellow-500 icon-contrast" />;
            case 'enterprise': return <Star className="h-5 w-5 text-purple-500 icon-contrast" />;
            default: return <Zap className="h-5 w-5 text-blue-500 icon-contrast" />;
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

    function formatPrice(usdPrice: number) {
        const rate = exchangeRates[currency] || 1;
        const price = (usdPrice * rate).toFixed(2);
        return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(price));
    }

    if (isLoading || !currencyLoaded) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            {/* Usage Warning Banner */}
            <AnimatePresence>
                {showUsageWarning && usageWarnings.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 sm:p-4"
                    >
                        <div className="flex flex-col sm:flex-row items-start gap-3">
                            <div className="flex items-start gap-3 flex-1 w-full">
                                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm sm:text-base text-yellow-800 dark:text-yellow-200 mb-2">
                                        Usage Limit Warning
                                    </h4>
                                    <div className="space-y-1">
                                        {usageWarnings.map((warning, index) => (
                                            <p key={index} className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 break-words">
                                                {warning.message}
                                            </p>
                                        ))}
                                    </div>
                                    <Button
                                        onClick={() => setShowUpgradeModal(true)}
                                        size="sm"
                                        className="mt-3 w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 text-white text-sm sm:text-base py-2 px-4 min-h-[44px] touch-manipulation"
                                    >
                                        <Rocket className="h-4 w-4 mr-2" />
                                        Upgrade Now
                                    </Button>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowUsageWarning(false)}
                                className="text-yellow-600 hover:text-yellow-700 self-end sm:self-start min-h-[44px] min-w-[44px] touch-manipulation"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Current Subscription Status */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                            {subscription && <div className="flex-shrink-0">{getTierIcon(subscription.tier)}</div>}
                            <div className="min-w-0 flex-1">
                                <CardTitle className="capitalize text-lg sm:text-xl truncate">
                                    {subscription?.tier || 'Free'} Plan
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm">
                                    {subscription?.status === 'active' ? 'Active subscription' : 'Manage your subscription'}
                                </CardDescription>
                            </div>
                        </div>
                        {subscription?.tier !== 'enterprise' && (
                            <Button
                                onClick={() => setShowUpgradeModal(true)}
                                className={`w-full sm:w-auto bg-gradient-to-r ${getTierColor(subscription?.tier || 'free')} hover:shadow-lg transition-all min-h-[44px] touch-manipulation text-sm sm:text-base`}
                            >
                                <Sparkles className="h-4 w-4 mr-2 icon-contrast" />
                                Upgrade
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    {subscription && (
                        <TooltipProvider delayDuration={0}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                                {/* Enhanced Usage Statistics with Color Coding */}
                                <div className="space-y-2 p-2 sm:p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                                    <div className="usage-row-responsive text-xs sm:text-sm">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="usage-row-label cursor-help font-medium">Tasks</span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">Tasks</TooltipContent>
                                        </Tooltip>
                                        <span className={`text-xs sm:text-sm ${getUsagePercentage(subscription.usage.tasksCreated, subscription.limits.maxTasks) >= 80 ? 'text-red-600 font-semibold usage-row-value' : 'usage-row-value'}`}>
                                            {subscription.usage.tasksCreated}/{subscription.limits.maxTasks === -1 ? '∞' : subscription.limits.maxTasks}
                                        </span>
                                    </div>
                                    <Progress
                                        value={getUsagePercentage(subscription.usage.tasksCreated, subscription.limits.maxTasks)}
                                        className="h-1.5 sm:h-2"
                                    />
                                </div>

                                <div className="space-y-2 p-2 sm:p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                                    <div className="usage-row-responsive text-xs sm:text-sm">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="usage-row-label cursor-help font-medium">AI Analysis</span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">AI Analysis</TooltipContent>
                                        </Tooltip>
                                        <span className={`text-xs sm:text-sm ${getUsagePercentage(subscription.usage.aiAnalysisUsed, subscription.limits.maxAiAnalysis) >= 80 ? 'text-red-600 font-semibold usage-row-value' : 'usage-row-value'}`}>
                                            {subscription.usage.aiAnalysisUsed}/{subscription.limits.maxAiAnalysis === -1 ? '∞' : subscription.limits.maxAiAnalysis}
                                        </span>
                                    </div>
                                    <Progress
                                        value={getUsagePercentage(subscription.usage.aiAnalysisUsed, subscription.limits.maxAiAnalysis)}
                                        className="h-1.5 sm:h-2"
                                    />
                                </div>

                                <div className="space-y-2 p-2 sm:p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                                    <div className="usage-row-responsive text-xs sm:text-sm">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="usage-row-label cursor-help font-medium">Pomodoro</span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">Pomodoro Sessions</TooltipContent>
                                        </Tooltip>
                                        <span className={`text-xs sm:text-sm ${getUsagePercentage(subscription.usage.pomodoroSessions, subscription.limits.maxPomodoroSessions) >= 80 ? 'text-red-600 font-semibold usage-row-value' : 'usage-row-value'}`}>
                                            {subscription.usage.pomodoroSessions}/{subscription.limits.maxPomodoroSessions === -1 ? '∞' : subscription.limits.maxPomodoroSessions}
                                        </span>
                                    </div>
                                    <Progress
                                        value={getUsagePercentage(subscription.usage.pomodoroSessions, subscription.limits.maxPomodoroSessions)}
                                        className="h-1.5 sm:h-2"
                                    />
                                </div>

                                <div className="space-y-2 p-2 sm:p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                                    <div className="usage-row-responsive text-xs sm:text-sm">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="usage-row-label cursor-help font-medium">Integrations</span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">Integrations</TooltipContent>
                                        </Tooltip>
                                        <span className={`text-xs sm:text-sm ${getUsagePercentage(subscription.usage.integrationsSynced, subscription.limits.maxIntegrations) >= 80 ? 'text-red-600 font-semibold usage-row-value' : 'usage-row-value'}`}>
                                            {subscription.usage.integrationsSynced}/{subscription.limits.maxIntegrations === -1 ? '∞' : subscription.limits.maxIntegrations}
                                        </span>
                                    </div>
                                    <Progress
                                        value={getUsagePercentage(subscription.usage.integrationsSynced, subscription.limits.maxIntegrations)}
                                        className="h-1.5 sm:h-2"
                                    />
                                </div>

                                <div className="space-y-2 p-2 sm:p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                                    <div className="usage-row-responsive text-xs sm:text-sm">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="usage-row-label cursor-help font-medium">Team</span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">Team Members</TooltipContent>
                                        </Tooltip>
                                        <span className={`text-xs sm:text-sm ${getUsagePercentage(subscription.usage.teamMembersInvited, subscription.limits.maxTeamMembers) >= 80 ? 'text-red-600 font-semibold usage-row-value' : 'usage-row-value'}`}>
                                            {subscription.usage.teamMembersInvited}/{subscription.limits.maxTeamMembers === -1 ? '∞' : subscription.limits.maxTeamMembers}
                                        </span>
                                    </div>
                                    <Progress
                                        value={getUsagePercentage(subscription.usage.teamMembersInvited, subscription.limits.maxTeamMembers)}
                                        className="h-1.5 sm:h-2"
                                    />
                                </div>
                            </div>
                        </TooltipProvider>
                    )}
                </CardContent>
            </Card>

            <Tabs defaultValue="plans" className="w-full" onValueChange={setActiveTab}>
                <div className="relative -mx-2 sm:mx-0">
                    <TabsList className="w-full justify-start overflow-x-auto md:justify-center gap-1 sm:gap-2 px-2 sm:px-0 scrollbar-hide touch-pan-x">
                        <TabsTrigger value="plans" className={`billing-tabs-trigger min-h-[44px] touch-manipulation ${activeTab === 'plans' ? 'shadow-md' : ''}`}>Pricing Plans</TabsTrigger>
                        <TabsTrigger value="features" className={`billing-tabs-trigger min-h-[44px] touch-manipulation ${activeTab === 'features' ? 'shadow-md' : ''}`}>Premium Features</TabsTrigger>
                        <TabsTrigger value="billing" className={`billing-tabs-trigger min-h-[44px] touch-manipulation ${activeTab === 'billing' ? 'shadow-md' : ''}`}>Billing History</TabsTrigger>
                        <TabsTrigger value="manage" className={`billing-tabs-trigger min-h-[44px] touch-manipulation ${activeTab === 'manage' ? 'shadow-md' : ''}`}>Manage Plan</TabsTrigger>
                        <TabsTrigger value="settings" className={`billing-tabs-trigger min-h-[44px] touch-manipulation ${activeTab === 'settings' ? 'shadow-md' : ''}`}>Settings</TabsTrigger>
                    </TabsList>
                </div>

                {/* Pricing Plans */}
                <TabsContent value="plans" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-6 px-2 sm:px-0">
                        <Button
                            variant={billingInterval === 'monthly' ? 'default' : 'outline'}
                            onClick={() => setBillingInterval('monthly')}
                            className="min-h-[44px] touch-manipulation text-sm sm:text-base flex-1 sm:flex-initial"
                        >
                            Monthly
                        </Button>
                        <Button
                            variant={billingInterval === 'yearly' ? 'default' : 'outline'}
                            onClick={() => setBillingInterval('yearly')}
                            className="min-h-[44px] touch-manipulation text-sm sm:text-base flex-1 sm:flex-initial"
                        >
                            Yearly
                            <Badge variant="secondary" className="ml-2 text-xs">Save 17%</Badge>
                        </Button>
                    </div>

                    <div className="mobile-pricing-grid px-2 sm:px-0">
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

                                        <CardHeader className="text-center p-4 sm:p-6">
                                            <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-r ${getTierColor(plan.tier)} flex items-center justify-center`}>
                                                {getTierIcon(plan.tier)}
                                            </div>

                                            <CardTitle className="text-xl sm:text-2xl">{plan.name}</CardTitle>
                                            <div className="space-y-1 mt-2">
                                                <div className="text-2xl sm:text-3xl font-bold">
                                                    {formatPrice(plan.price)}
                                                    <span className="text-base sm:text-lg text-gray-500">/{plan.interval}</span>
                                                </div>
                                                {plan.interval === 'yearly' && plan.tier === 'premium' && (
                                                    <p className="text-xs sm:text-sm text-green-600">Save $20 per year</p>
                                                )}
                                                {plan.comingSoon && (
                                                    <Badge className="bg-gradient-to-r from-gray-400 to-gray-600 text-white text-xs">Coming Soon</Badge>
                                                )}
                                            </div>
                                        </CardHeader>

                                        <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                                            <ul className="space-y-2 sm:space-y-3">
                                                {plan.features.map((feature, index) => (
                                                    <li key={index} className="flex items-start gap-2">
                                                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                        <span className="text-xs sm:text-sm leading-relaxed">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            <Button
                                                className="w-full min-h-[44px] touch-manipulation text-sm sm:text-base"
                                                variant={plan.tier === subscription?.tier ? 'outline' : 'default'}
                                                disabled={plan.tier === subscription?.tier || plan.comingSoon}
                                                onClick={() => plan.tier !== subscription?.tier && !plan.comingSoon && handleUpgrade(plan)}
                                            >
                                                {plan.comingSoon ? 'Coming Soon' :
                                                    plan.tier === subscription?.tier ? 'Current Plan' :
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

                {/* Manage Plan */}
                <TabsContent value="manage" className="space-y-6">
                    <SubscriptionManager />
                </TabsContent>

                {/* Billing History */}
                <TabsContent value="billing" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                    <Card>
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                <BarChart3 className="h-5 w-5" />
                                Billing History
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">View your past invoices and payment history</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0">
                            {invoices.length > 0 ? (
                                <div className="space-y-3 sm:space-y-4">
                                    {invoices.map((invoice) => (
                                        <div key={invoice.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
                                            <div className="space-y-1 flex-1 min-w-0">
                                                <p className="font-medium text-sm sm:text-base truncate">Invoice #{invoice.id.slice(-8)}</p>
                                                <p className="text-xs sm:text-sm text-gray-500">
                                                    {new Date(invoice.invoiceDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                                <div className="text-left sm:text-right">
                                                    <p className="font-medium text-sm sm:text-base">{formatPrice(invoice.amount)}</p>
                                                    <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'} className="text-xs mt-1">
                                                        {invoice.status}
                                                    </Badge>
                                                </div>
                                                {invoice.downloadUrl && (
                                                    <Button size="sm" variant="outline" className="min-h-[44px] min-w-[44px] touch-manipulation">
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
                                    <p className="text-gray-500 text-sm sm:text-base">No billing history yet</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Settings */}
                <TabsContent value="settings" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                    <Card>
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                <Settings className="h-5 w-5" />
                                Billing Settings
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Manage your payment methods and preferences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
                            {/* Subscription Status */}
                            {subscription && (
                                <div className="space-y-3 sm:space-y-4">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                        <span className="font-medium text-sm sm:text-base">Subscription Status</span>
                                        <Badge variant={subscription.status === 'active' ? 'default' : 'destructive'} className="text-xs sm:text-sm">
                                            {subscription.status}
                                        </Badge>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                        <span className="font-medium text-sm sm:text-base">Next Billing Date</span>
                                        <span className="text-xs sm:text-sm">
                                            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {subscription.cancelAtPeriodEnd && (
                                        <div className="p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                            <div className="flex items-start gap-2">
                                                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                                <span className="font-medium text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
                                                    Subscription will cancel at period end
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <Separator />

                            {/* Payment Methods */}
                            <div className="space-y-3 sm:space-y-4">
                                <h4 className="font-medium text-sm sm:text-base">Payment Methods</h4>
                                {paymentMethods.length > 0 ? (
                                    <div className="space-y-2 sm:space-y-3">
                                        {paymentMethods.map((method) => (
                                            <div key={method.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 border rounded-lg">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <CreditCard className="h-5 w-5 flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm sm:text-base truncate">
                                                            {method.brand} •••• {method.last4}
                                                        </p>
                                                        <p className="text-xs sm:text-sm text-gray-500">
                                                            Expires {method.expiryMonth}/{method.expiryYear}
                                                        </p>
                                                    </div>
                                                </div>
                                                {method.isDefault && (
                                                    <Badge variant="secondary" className="text-xs sm:text-sm self-start sm:self-center">Default</Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm sm:text-base mb-3">No payment methods added</p>
                                        <Button variant="outline" className="min-h-[44px] touch-manipulation text-sm sm:text-base">
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4"
                        onClick={() => setShowUpgradeModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="mobile-modal bg-white dark:bg-gray-900 shadow-2xl max-w-4xl w-full overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4 sm:p-6">
                                <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                                            <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 flex-shrink-0" />
                                            <span className="truncate">Upgrade Your Plan</span>
                                        </h2>
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Choose the perfect plan for your productivity needs
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowUpgradeModal(false)}
                                        className="min-h-[44px] min-w-[44px] touch-manipulation flex-shrink-0"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="mb-4 sm:mb-6">
                                    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                                        <span className={`text-sm sm:text-base ${billingInterval === 'monthly' ? 'font-medium' : 'text-gray-500'}`}>
                                            Monthly
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
                                            className="relative min-h-[44px] touch-manipulation"
                                        >
                                            <div className={`w-12 h-6 rounded-full transition-colors ${billingInterval === 'yearly' ? 'bg-blue-500' : 'bg-gray-300'
                                                }`}>
                                                <div className={`w-5 h-5 bg-white rounded-full transition-transform transform ${billingInterval === 'yearly' ? 'translate-x-6' : 'translate-x-0.5'
                                                    } mt-0.5`} />
                                            </div>
                                        </Button>
                                        <span className={`text-sm sm:text-base ${billingInterval === 'yearly' ? 'font-medium' : 'text-gray-500'}`}>
                                            Yearly
                                            <Badge variant="secondary" className="ml-2 text-xs">Save 17%</Badge>
                                        </span>
                                    </div>
                                </div>

                                <div className="mobile-pricing-grid">
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
                                                    <CardHeader className="p-4 sm:p-6">
                                                        <div className="flex items-center justify-between">
                                                            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                                                {getTierIcon(plan.tier)}
                                                                <span className="truncate">{plan.name}</span>
                                                            </CardTitle>
                                                        </div>
                                                        <div className="space-y-2 mt-2">
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-2xl sm:text-3xl font-bold">{formatPrice(plan.price)}</span>
                                                                <span className="text-sm sm:text-base text-gray-500">/{plan.interval}</span>
                                                            </div>
                                                            {plan.interval === 'yearly' && (
                                                                <p className="text-xs sm:text-sm text-green-600">
                                                                    Save ${((plan.price / 12) * 12 * 1.2 - plan.price).toFixed(0)} per year
                                                                </p>
                                                            )}
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                                                        <ul className="space-y-2">
                                                            {plan.features.map((feature, index) => (
                                                                <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                                                                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                                    <span className="leading-relaxed">{feature}</span>
                                                                </li>
                                                            ))}
                                                        </ul>

                                                        <Button
                                                            className="w-full min-h-[44px] touch-manipulation text-sm sm:text-base"
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

                                <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500 px-2">
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
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
    AlertTriangle,
    CheckCircle2,
    Crown,
    Star,
    Zap,
    Calendar,
    CreditCard,
    Shield,
    X,
    ArrowUpCircle,
    ArrowDownCircle,
    Pause,
    Play
} from 'lucide-react';
import { useBillingStore } from '../store/billingStore';
import { billingService, pricingPlans } from '../services/billingService';
import { toast } from 'react-hot-toast';
import { SubscriptionTier, PricingPlan } from '../types';

interface PlanChangeConfirmation {
    type: 'upgrade' | 'downgrade' | 'cancel' | 'pause' | 'resume';
    plan?: PricingPlan;
    show: boolean;
}

const SubscriptionManager: React.FC = () => {
    const { subscription, setSubscription } = useBillingStore();
    const [isLoading, setIsLoading] = useState(false);
    const [confirmation, setConfirmation] = useState<PlanChangeConfirmation>({
        type: 'upgrade',
        show: false
    });
    const [currency, setCurrency] = useState('USD');
    const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({ USD: 1 });
    const [currencyLoaded, setCurrencyLoaded] = useState(false);

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

    function formatPrice(usdPrice: number) {
        const rate = exchangeRates[currency] || 1;
        const price = (usdPrice * rate).toFixed(2);
        return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(price));
    }

    const getCurrentPlan = () => {
        if (!subscription) return null;
        return pricingPlans.find(plan => plan.tier === subscription.tier);
    };

    const getAvailableUpgrades = () => {
        if (!subscription) return [];

        const tierOrder: SubscriptionTier[] = ['free', 'premium', 'enterprise'];
        const currentTierIndex = tierOrder.indexOf(subscription.tier);

        return pricingPlans.filter(plan => {
            const planTierIndex = tierOrder.indexOf(plan.tier);
            return planTierIndex > currentTierIndex;
        });
    };

    const getAvailableDowngrades = () => {
        if (!subscription) return [];

        const tierOrder: SubscriptionTier[] = ['free', 'premium', 'enterprise'];
        const currentTierIndex = tierOrder.indexOf(subscription.tier);

        return pricingPlans.filter(plan => {
            const planTierIndex = tierOrder.indexOf(plan.tier);
            return planTierIndex < currentTierIndex;
        });
    };

    const handlePlanChange = async (plan: PricingPlan, changeType: 'upgrade' | 'downgrade') => {
        setConfirmation({
            type: changeType,
            plan,
            show: true
        });
    };

    const confirmPlanChange = async () => {
        if (!confirmation.plan) return;

        setIsLoading(true);
        try {
            if (confirmation.type === 'upgrade') {
                // Handle upgrade
                if (confirmation.plan.stripePriceId) {
                    const { url } = await billingService.createCheckoutSession(confirmation.plan.stripePriceId, 'user-id-placeholder');
                    window.open(url, '_blank');
                } else {
                    toast.success(`Upgraded to ${confirmation.plan.name} plan!`);
                }
            } else {
                // Handle downgrade
                toast.success(`Downgraded to ${confirmation.plan.name} plan. Changes will take effect at the end of your current billing period.`);
            }

            setConfirmation({ type: 'upgrade', show: false });
        } catch (error) {
            toast.error('Failed to change subscription plan');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelSubscription = () => {
        setConfirmation({
            type: 'cancel',
            show: true
        });
    };

    const confirmCancellation = async () => {
        setIsLoading(true);
        try {
            // In a real app, this would call the billing service
            toast.success('Subscription cancelled. You\'ll retain access until the end of your billing period.');
            setConfirmation({ type: 'cancel', show: false });
        } catch (error) {
            toast.error('Failed to cancel subscription');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePauseSubscription = () => {
        setConfirmation({
            type: 'pause',
            show: true
        });
    };

    const handleResumeSubscription = () => {
        setConfirmation({
            type: 'resume',
            show: true
        });
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

    const currentPlan = getCurrentPlan();
    const availableUpgrades = getAvailableUpgrades();
    const availableDowngrades = getAvailableDowngrades();

    if (!subscription || !currencyLoaded) {
        return (
            <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No subscription found</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            {/* Current Plan Status */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
                        {getTierIcon(subscription.tier)}
                        <span className="truncate">Current Plan: {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                        {subscription.status === 'active' ? 'Your subscription is active' : `Status: ${subscription.status}`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div className="text-center p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg">
                            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 mx-auto mb-2" />
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Next Billing</p>
                            <p className="font-semibold text-sm sm:text-base">
                                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                            </p>
                        </div>

                        <div className="text-center p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg">
                            <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mx-auto mb-2" />
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Plan Price</p>
                            <p className="font-semibold text-sm sm:text-base">
                                {currentPlan ? `${formatPrice(currentPlan.price)}/${currentPlan.interval}` : 'Free'}
                            </p>
                        </div>

                        <div className="text-center p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg">
                            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 mx-auto mb-2" />
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Status</p>
                            <Badge variant={subscription.status === 'active' ? 'default' : 'destructive'} className="text-xs sm:text-sm mt-1">
                                {subscription.status}
                            </Badge>
                        </div>
                    </div>

                    {subscription.cancelAtPeriodEnd && (
                        <div className="p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <span className="font-medium text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
                                    Your subscription will cancel on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Plan Management Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Upgrade Options */}
                {availableUpgrades.length > 0 && (
                    <Card>
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                <ArrowUpCircle className="h-5 w-5 text-green-500" />
                                Upgrade Options
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Unlock more features and higher limits
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
                            {availableUpgrades.slice(0, 2).map((plan) => (
                                <div key={plan.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                        <div className="flex-shrink-0">{getTierIcon(plan.tier)}</div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm sm:text-base truncate">{plan.name}</p>
                                            <p className="text-xs sm:text-sm text-gray-500">
                                                {formatPrice(plan.price)}/{plan.interval}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => !plan.comingSoon && handlePlanChange(plan, 'upgrade')}
                                        className={`w-full sm:w-auto bg-gradient-to-r ${getTierColor(plan.tier)} min-h-[44px] touch-manipulation text-sm sm:text-base`}
                                        disabled={!!plan.comingSoon}
                                    >
                                        {plan.comingSoon ? 'Coming Soon' : 'Upgrade'}
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Downgrade Options */}
                {availableDowngrades.length > 0 && subscription.tier !== 'free' && (
                    <Card>
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                <ArrowDownCircle className="h-5 w-5 text-orange-500" />
                                Downgrade Options
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Reduce costs with a lower-tier plan
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
                            {availableDowngrades.slice(0, 2).map((plan) => (
                                <div key={plan.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                        <div className="flex-shrink-0">{getTierIcon(plan.tier)}</div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm sm:text-base truncate">{plan.name}</p>
                                            <p className="text-xs sm:text-sm text-gray-500">
                                                {plan.price === 0 ? 'Free' : `${formatPrice(plan.price)}/${plan.interval}`}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handlePlanChange(plan, 'downgrade')}
                                        className="w-full sm:w-auto min-h-[44px] touch-manipulation text-sm sm:text-base"
                                    >
                                        Downgrade
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Subscription Controls */}
            {subscription.tier !== 'free' && (
                <Card>
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-lg sm:text-xl">Subscription Controls</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            Manage your subscription settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                            {!subscription.cancelAtPeriodEnd && (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={handlePauseSubscription}
                                        className="flex items-center justify-center gap-2 min-h-[44px] touch-manipulation text-sm sm:text-base w-full sm:w-auto"
                                    >
                                        <Pause className="h-4 w-4" />
                                        Pause Subscription
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleCancelSubscription}
                                        className="flex items-center justify-center gap-2 min-h-[44px] touch-manipulation text-sm sm:text-base w-full sm:w-auto"
                                    >
                                        <X className="h-4 w-4" />
                                        Cancel Subscription
                                    </Button>
                                </>
                            )}

                            {subscription.cancelAtPeriodEnd && (
                                <Button
                                    onClick={handleResumeSubscription}
                                    className="flex items-center justify-center gap-2 min-h-[44px] touch-manipulation text-sm sm:text-base w-full sm:w-auto"
                                >
                                    <Play className="h-4 w-4" />
                                    Resume Subscription
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Confirmation Modal */}
            <AnimatePresence>
                {confirmation.show && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4"
                        onClick={() => setConfirmation({ ...confirmation, show: false })}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-gray-900 rounded-none sm:rounded-xl shadow-2xl max-w-md w-full h-full sm:h-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4 sm:p-6 h-full flex flex-col">
                                <div className="flex items-center gap-2 sm:gap-3 mb-4">
                                    {confirmation.type === 'cancel' ? (
                                        <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 flex-shrink-0" />
                                    ) : (
                                        <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 flex-shrink-0" />
                                    )}
                                    <h3 className="text-base sm:text-lg font-semibold">
                                        {confirmation.type === 'cancel' && 'Cancel Subscription'}
                                        {confirmation.type === 'upgrade' && 'Upgrade Plan'}
                                        {confirmation.type === 'downgrade' && 'Downgrade Plan'}
                                        {confirmation.type === 'pause' && 'Pause Subscription'}
                                        {confirmation.type === 'resume' && 'Resume Subscription'}
                                    </h3>
                                </div>

                                <div className="mb-4 sm:mb-6 flex-1">
                                    {confirmation.type === 'cancel' && (
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                            Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.
                                        </p>
                                    )}
                                    {confirmation.type === 'upgrade' && confirmation.plan && (
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                            Upgrade to {confirmation.plan.name} plan for {formatPrice(confirmation.plan.price)}/{confirmation.plan.interval}? You'll get immediate access to all premium features.
                                        </p>
                                    )}
                                    {confirmation.type === 'downgrade' && confirmation.plan && (
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                            Downgrade to {confirmation.plan.name} plan? Changes will take effect at the end of your current billing period.
                                        </p>
                                    )}
                                    {confirmation.type === 'pause' && (
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                            Pause your subscription? You can resume anytime and your data will be preserved.
                                        </p>
                                    )}
                                    {confirmation.type === 'resume' && (
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                            Resume your subscription? You'll regain access to all premium features immediately.
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setConfirmation({ ...confirmation, show: false })}
                                        className="flex-1 min-h-[44px] touch-manipulation text-sm sm:text-base"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={confirmation.type === 'cancel' ? confirmCancellation : confirmPlanChange}
                                        disabled={isLoading}
                                        variant={confirmation.type === 'cancel' ? 'destructive' : 'default'}
                                        className="flex-1 min-h-[44px] touch-manipulation text-sm sm:text-base"
                                    >
                                        {isLoading ? 'Processing...' : 'Confirm'}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SubscriptionManager; 
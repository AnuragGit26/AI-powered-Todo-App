import { useCallback } from 'react';
import { useBillingStore } from '../store/billingStore';
import { toast } from 'react-hot-toast';
import { SubscriptionLimits } from '../types';

interface UsageCheckResult {
    allowed: boolean;
    remaining: number;
    percentage: number;
    shouldShowUpgrade: boolean;
    upgradeMessage?: string;
}

export const useBillingUsage = () => {
    const { subscription, checkUsageLimits, incrementUsage } = useBillingStore();

    const checkFeatureAccess = useCallback((feature: keyof SubscriptionLimits): UsageCheckResult => {
        if (!subscription) {
            return {
                allowed: false,
                remaining: 0,
                percentage: 100,
                shouldShowUpgrade: true,
                upgradeMessage: 'Please upgrade to access this feature'
            };
        }

        const { usage, limits } = subscription;
        const limit = limits[feature];
        
        // Handle boolean features (premium features)
        if (typeof limit === 'boolean') {
            return {
                allowed: limit,
                remaining: limit ? 1 : 0,
                percentage: limit ? 0 : 100,
                shouldShowUpgrade: !limit,
                upgradeMessage: !limit ? `Upgrade to ${subscription.tier === 'free' ? 'Premium' : 'Enterprise'} to unlock ${feature}` : undefined
            };
        }

        // Handle numeric limits
        let currentUsage = 0;
        switch (feature) {
            case 'maxTasks':
                currentUsage = usage.tasksCreated;
                break;
            case 'maxAiAnalysis':
                currentUsage = usage.aiAnalysisUsed;
                break;
            case 'maxPomodoroSessions':
                currentUsage = usage.pomodoroSessions;
                break;
            case 'maxIntegrations':
                currentUsage = usage.integrationsSynced;
                break;
            case 'maxTeamMembers':
                currentUsage = usage.teamMembersInvited;
                break;
            default:
                currentUsage = 0;
        }

        if (limit === -1) {
            // Unlimited
            return {
                allowed: true,
                remaining: -1,
                percentage: 0,
                shouldShowUpgrade: false
            };
        }

        const remaining = Math.max(0, limit - currentUsage);
        const percentage = (currentUsage / limit) * 100;
        const allowed = currentUsage < limit;
        const shouldShowUpgrade = percentage >= 80;

        let upgradeMessage;
        if (!allowed) {
            upgradeMessage = `You've reached your ${feature} limit. Upgrade to continue.`;
        } else if (shouldShowUpgrade) {
            upgradeMessage = `You're using ${Math.round(percentage)}% of your ${feature} limit. Consider upgrading.`;
        }

        return {
            allowed,
            remaining,
            percentage,
            shouldShowUpgrade,
            upgradeMessage
        };
    }, [subscription]);

    const trackUsage = useCallback((feature: keyof SubscriptionLimits, showToast = true): boolean => {
        const check = checkFeatureAccess(feature);
        
        if (!check.allowed) {
            if (showToast) {
                toast.error(check.upgradeMessage || 'Feature not available on your current plan');
            }
            return false;
        }

        // Increment usage for numeric features
        if (typeof subscription?.limits[feature] === 'number') {
            const usageField = getUsageField(feature);
            if (usageField) {
                incrementUsage(usageField);
            }
        }

        // Show upgrade suggestion if approaching limit
        if (check.shouldShowUpgrade && showToast) {
            toast(check.upgradeMessage || 'Consider upgrading for more features', {
                icon: '⚡',
                duration: 4000,
            });
        }

        return true;
    }, [subscription, checkFeatureAccess, incrementUsage]);

    const getUsageField = (feature: keyof SubscriptionLimits): keyof typeof subscription.usage | null => {
        switch (feature) {
            case 'maxTasks':
                return 'tasksCreated';
            case 'maxAiAnalysis':
                return 'aiAnalysisUsed';
            case 'maxPomodoroSessions':
                return 'pomodoroSessions';
            case 'maxIntegrations':
                return 'integrationsSynced';
            case 'maxTeamMembers':
                return 'teamMembersInvited';
            default:
                return null;
        }
    };

    const getUpgradeRecommendation = useCallback(() => {
        if (!subscription) return null;

        const { usage, limits, tier } = subscription;
        const recommendations = [];

        // Check which features are being heavily used
        if (limits.maxTasks !== -1 && (usage.tasksCreated / limits.maxTasks) >= 0.7) {
            recommendations.push('More task storage');
        }
        if (limits.maxAiAnalysis !== -1 && (usage.aiAnalysisUsed / limits.maxAiAnalysis) >= 0.7) {
            recommendations.push('More AI analysis');
        }
        if (limits.maxPomodoroSessions !== -1 && (usage.pomodoroSessions / limits.maxPomodoroSessions) >= 0.7) {
            recommendations.push('Unlimited Pomodoro sessions');
        }

        if (recommendations.length === 0) return null;

        const nextTier = tier === 'free' ? 'Premium' : 'Enterprise';
        return {
            tier: nextTier,
            reasons: recommendations,
            message: `Upgrade to ${nextTier} for ${recommendations.join(', ')} and more!`
        };
    }, [subscription]);

    const canUseFeature = useCallback((feature: keyof SubscriptionLimits): boolean => {
        return checkFeatureAccess(feature).allowed;
    }, [checkFeatureAccess]);

    const getFeatureStatus = useCallback((feature: keyof SubscriptionLimits) => {
        return checkFeatureAccess(feature);
    }, [checkFeatureAccess]);

    const showUpgradePrompt = useCallback((feature: keyof SubscriptionLimits, customMessage?: string) => {
        const check = checkFeatureAccess(feature);
        const message = customMessage || check.upgradeMessage || 'Upgrade to unlock this feature';
        
        toast.error(message, {
            duration: 5000,
            action: {
                label: 'Upgrade',
                onClick: () => {
                    // Trigger upgrade modal or redirect
                    window.dispatchEvent(new CustomEvent('showUpgradeModal'));
                }
            }
        });
    }, [checkFeatureAccess]);

    return {
        subscription,
        checkFeatureAccess,
        trackUsage,
        canUseFeature,
        getFeatureStatus,
        getUpgradeRecommendation,
        showUpgradePrompt,
        isLoading: !subscription,
        tier: subscription?.tier || 'free',
        usage: subscription?.usage,
        limits: subscription?.limits,
    };
}; 
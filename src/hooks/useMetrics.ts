import { useCallback } from 'react';
import { logActivity, updateUsageMetrics } from '../services/activityMetrics';

export const useMetrics = () => {
    const logUserActivity = useCallback(
        async (userId: string, activity: string) => {
            await logActivity(userId, activity);
        },
        []
    );

    const updateUserMetrics = useCallback(
        async (
            userId: string,
            updates: { last_login?: Date; total_logins_inc?: number; changes_count_inc?: number;ip_address?: string; }
        ) => {
            await updateUsageMetrics(userId, updates);
        },
        []
    );

    return { logUserActivity, updateUserMetrics };
};
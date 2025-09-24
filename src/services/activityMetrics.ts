import { supabase } from '../lib/supabaseClient';
export const logActivity = async (userId: string, activity: string) => {
    const timestamp = new Date();
    const id = crypto.randomUUID();
    const { data, error } = await supabase
        .from('activity_logs')
        .insert([{ id,user_id: userId, activity, timestamp }]);
    if (error) {
        console.error('Error logging activity:', error);
    }
    return { data, error };
};

export const updateUsageMetrics = async (
    userId: string,
    updates: { last_login?: Date; total_logins_inc?: number; changes_count_inc?: number;ip_address?: string; }
) => {
    // Try to fetch the existing metrics record
    const { data: existingMetrics, error: fetchError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching usage metrics:', fetchError);
        return { error: fetchError };
    }

    const newMetrics = {
        last_login: updates.last_login || new Date(),
        total_logins: (existingMetrics?.total_logins || 0) + (updates.total_logins_inc || 0),
        changes_count: (existingMetrics?.changes_count || 0) + (updates.changes_count_inc || 0),
        ip_address: updates.ip_address || '',
    };

    // Upsert (create or update) the usage metrics for the user.
    const { data, error } = await supabase
        .from('user_stats')
        .upsert({ user_id: userId, ...newMetrics });

    if (error) {
        console.error('Error updating usage metrics:', error);
    }
    return { data, error};
};
import { supabase } from '../lib/supabaseClient';
import { PomodoroState } from '../types';

export interface PomodoroSession {
    user_id: string;
    state: PomodoroState;
    updated_at: string;
    device_id: string;
}

export const pomodoroService = {
    // Sync pomodoro state to server
    async syncState(userId: string, state: PomodoroState): Promise<void> {
        try {
            const { error } = await supabase
                .from('pomodoro_sessions')
                .upsert({
                    user_id: userId,
                    state: state,
                    updated_at: new Date().toISOString(),
                    device_id: state.deviceId
                }, {
                    onConflict: 'user_id'
                });

            if (error) throw error;
        } catch (error) {
            console.error('Failed to sync pomodoro state:', error);
            throw error;
        }
    },

    // Load pomodoro state from server
    async loadState(userId: string): Promise<PomodoroState | null> {
        try {
            const { data, error } = await supabase
                .from('pomodoro_sessions')
                .select('state, updated_at, device_id')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data && data.state) {
                return data.state as PomodoroState;
            }

            return null;
        } catch (error) {
            console.error('Failed to load pomodoro state:', error);
            throw error;
        }
    },

    // Real-time subscription to pomodoro state changes
    subscribeToStateChanges(userId: string, callback: (state: PomodoroState) => void) {
        const subscription = supabase
            .channel(`pomodoro_session_${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'pomodoro_sessions',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    if (payload.new && payload.new.state) {
                        callback(payload.new.state as PomodoroState);
                    }
                }
            )
            .subscribe();

        return subscription;
    },

    // Initialize pomodoro sessions table if it doesn't exist
    async initializeTable(): Promise<void> {
        try {
            // Check if table exists by trying to select from it
            const { error } = await supabase
                .from('pomodoro_sessions')
                .select('user_id')
                .limit(1);

            // If table doesn't exist, create it
            if (error && error.code === '42P01') {
                const { error: createError } = await supabase.rpc('create_pomodoro_sessions_table');
                if (createError) {
                    console.log('Table might already exist or creation handled differently:', createError);
                }
            }
        } catch (error) {
            console.error('Error initializing pomodoro sessions table:', error);
        }
    }
}; 
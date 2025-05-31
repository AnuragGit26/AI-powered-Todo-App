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
            // Ensure deviceId is always present
            const deviceId = state.deviceId || crypto.randomUUID();
            
            // If deviceId was missing, we should update the local state too
            if (!state.deviceId) {
                console.warn('Device ID was missing, generating new one:', deviceId);
            }

            const { error } = await supabase
                .from('pomodoro_sessions')
                .upsert({
                    user_id: userId,
                    state: {
                        ...state,
                        deviceId: deviceId // Ensure deviceId is in the state
                    },
                    updated_at: new Date().toISOString(),
                    device_id: deviceId
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
                const loadedState = data.state as PomodoroState;
                
                // Ensure deviceId is present in loaded state
                if (!loadedState.deviceId) {
                    loadedState.deviceId = data.device_id || crypto.randomUUID();
                }
                
                return loadedState;
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
                (payload: any) => {
                    if (payload.new && payload.new.state) {
                        const newState = payload.new.state as PomodoroState;
                        
                        // Ensure deviceId is present
                        if (!newState.deviceId) {
                            newState.deviceId = payload.new.device_id || crypto.randomUUID();
                        }
                        
                        callback(newState);
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
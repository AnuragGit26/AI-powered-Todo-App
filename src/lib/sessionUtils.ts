import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface UserSession {
    id: string;
    user_id: string;
    created_at: string;
    last_seen_at: string;
    user_agent?: string;
    ip?: string;
    device_type?: string;
    location?: string;
    is_current?: boolean;
}

/**
 * Fetches all active sessions for a user
 */
export async function fetchUserSessions(userId: string): Promise<UserSession[]> {
    try {
        // Get current session to mark the current one
        const { data: currentSession } = await supabase.auth.getSession();

        // Fetch all sessions for the user from our custom table
        const { data, error } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

        // Mark the current session
        return (data || []).map((session: UserSession) => ({
            ...session,
            is_current: session.id === currentSession?.session?.id
        }));
    } catch (error) {
        console.error('Error fetching user sessions:', error);
        throw error;
    }
}

/**
 * Terminates a specific user session
 */
export async function terminateSession(sessionId: string): Promise<void> {
    try {
        // First, check if it's the current session
        const { data: currentSession } = await supabase.auth.getSession();
        const isCurrentSession = currentSession?.session?.id === sessionId;

        // Delete from our sessions table
        const { error } = await supabase
            .from('user_sessions')
            .delete()
            .eq('id', sessionId);

        if (error) throw error;

        // If it's the current session, sign out the user
        if (isCurrentSession) {
            await supabase.auth.signOut();
        }
    } catch (error) {
        console.error('Error terminating session:', error);
        throw error;
    }
}

/**
 * Records a new session in our custom table
 * Call this when a user signs in
 */
export async function recordSession(): Promise<void> {
    try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session) return;

        // Get user agent info
        const userAgent = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
        let deviceType = 'Desktop';

        if (isMobile) deviceType = 'Mobile';
        if (isTablet) deviceType = 'Tablet';

        // Insert using regular client
        const { error } = await supabase.from('user_sessions').upsert({
            id: session.session.id,
            user_id: session.session.user.id,
            created_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
            user_agent: userAgent,
            device_type: deviceType
        });

        // Log any error for debugging
        if (error) console.error('Session recording error:', error);
    } catch (error) {
        console.error('Error recording session:', error);
    }
}

/**
 * Updates the last_seen_at timestamp for a session
 * Call this periodically to track active sessions
 */
export async function updateSessionActivity(): Promise<void> {
    try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session) return;

        const { error } = await supabase
            .from('user_sessions')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('id', session.session.id);

        if (error) throw error;
    } catch (error) {
        console.error('Error updating session activity:', error);
    }
}

/**
 * Test function for manual session insertion
 * Only run this in browser console for testing purposes
 */
export async function testSessionInsertion() {
    const { data: sessionData } = await supabase.auth.getSession();
    console.log("Current session:", sessionData);

    if (!sessionData?.session) {
        console.log("No active session found");
        return;
    }

    // Then try to manually insert a record
    const result = await supabase.from('user_sessions').insert({
        id: sessionData.session.id,
        user_id: sessionData.session.user.id,
        created_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        device_type: 'Manual Test'
    });
    console.log("Insert result:", result);
} 
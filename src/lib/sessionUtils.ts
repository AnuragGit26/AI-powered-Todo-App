import { getUserRegion } from '../hooks/getUserRegion';
import { getUserIP } from '../services/ipService';
import { supabase } from './supabaseClient';

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
    device_fingerprint?: string;
}

/**
 * Generates a simplified device fingerprint based on available browser information
 * This is not as sophisticated as commercial fingerprinting but provides reasonable uniqueness
 */
function generateDeviceFingerprint(): string {
    try {
        const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const language = navigator.language;
        const platform = navigator.platform;
        const userAgent = navigator.userAgent;

        // Create a simple hash of the above information
        const fingerprint = `${screenInfo}|${timeZone}|${language}|${platform}|${userAgent}`;

        // Convert to a more compact representation
        return btoa(fingerprint)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '')
            .substring(0, 40); // Limit length for storage
    } catch (error) {
        console.error('Error generating device fingerprint:', error);
        // Fallback to a random identifier if fingerprinting fails
        return 'fp_' + Math.random().toString(36).substring(2, 15);
    }
}

/**
 * Fetches all active sessions for a user
 */
export async function fetchUserSessions(userId: string): Promise<UserSession[]> {
    try {
        // Get current device fingerprint
        const deviceFingerprint = generateDeviceFingerprint();

        // Fetch all sessions for the user from our custom table
        const { data, error } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

        // Mark the current session based on device fingerprint
        return (data || []).map((session: UserSession) => ({
            ...session,
            is_current: session.device_fingerprint === deviceFingerprint
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
        // Get current device fingerprint
        const deviceFingerprint = generateDeviceFingerprint();

        // Get session details to check if it's the current device
        const { data: sessionData } = await supabase
            .from('user_sessions')
            .select('device_fingerprint')
            .eq('id', sessionId)
            .single();

        const isCurrentDevice = sessionData?.device_fingerprint === deviceFingerprint;

        // Delete from our sessions table
        const { error } = await supabase
            .from('user_sessions')
            .delete()
            .eq('id', sessionId);

        if (error) throw error;

        // If it's the current device's session, sign out the user
        if (isCurrentDevice) {
            await supabase.auth.signOut();
        }
    } catch (error) {
        console.error('Error terminating session:', error);
        throw error;
    }
}

/**
 * Records a new session in our custom table or updates an existing one
 * Call this when a user signs in
 */
export async function recordSession(): Promise<void> {
    try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
            console.log('No active session found');
            return;
        }

        const userId = sessionData.session.user.id;
        if (!userId) {
            console.error('Cannot record session: Missing user ID');
            return;
        }

        // Get user agent info
        const userAgent = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
        let deviceType = 'Desktop';

        if (isMobile) deviceType = 'Mobile';
        if (isTablet) deviceType = 'Tablet';

        // Generate device fingerprint
        const deviceFingerprint = generateDeviceFingerprint();
        console.log('Generated device fingerprint:', deviceFingerprint);

        // First, try to find an existing session with this fingerprint
        const { data: existingSession, error: findError } = await supabase
            .from('user_sessions')
            .select('id')
            .eq('device_fingerprint', deviceFingerprint)
            .single();

        if (findError && findError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('Error finding existing session:', findError);
        }

        if (existingSession) {
            console.log('Found existing session:', existingSession.id);
            // Update the existing session
            const { error: updateError } = await supabase
                .from('user_sessions')
                .update({
                    last_seen_at: new Date().toISOString(),
                    user_agent: userAgent,
                    device_type: deviceType,
                    ip: await getUserIP(),
                    location: (await getUserRegion()).location,
                    user_id: userId // Update user_id in case it changed
                })
                .eq('id', existingSession.id);

            if (updateError) {
                console.error('Error updating existing session:', updateError);
                throw updateError;
            }

            // Store session ID in localStorage
            localStorage.setItem('current_session_id', existingSession.id);
            return;
        }

        // If no existing session found, create a new one
        const sessionId = crypto.randomUUID();
        console.log('Creating new session with ID:', sessionId);

        // Insert the new session
        const { error } = await supabase.from('user_sessions').insert({
            id: sessionId,
            user_id: userId,
            created_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
            ip: await getUserIP(),
            location: (await getUserRegion()).location,
            user_agent: userAgent,
            device_type: deviceType,
            device_fingerprint: deviceFingerprint
        });

        if (error) {
            console.error('Error inserting new session:', error);
            throw error;
        }

        // Store session ID in localStorage
        localStorage.setItem('current_session_id', sessionId);
    } catch (error) {
        console.error('Error recording session:', error);
        // If we get a unique constraint violation, try to find and update the existing session
        if (error && typeof error === 'object' && 'code' in error && error.code === '23505') { // Unique constraint violation
            console.log('Handling unique constraint violation');
            try {
                const deviceFingerprint = generateDeviceFingerprint();
                const { data: existingSession, error: findError } = await supabase
                    .from('user_sessions')
                    .select('id')
                    .eq('device_fingerprint', deviceFingerprint)
                    .single();

                if (findError) {
                    console.error('Error finding session after constraint violation:', findError);
                }

                if (existingSession) {
                    console.log('Found existing session after constraint violation:', existingSession.id);
                    localStorage.setItem('current_session_id', existingSession.id);
                }
            } catch (recoveryError) {
                console.error('Error recovering from unique constraint violation:', recoveryError);
            }
        }
    }
}

/**
 * Updates the last_seen_at timestamp for a session
 * Call this periodically to track active sessions
 */
export async function updateSessionActivity(): Promise<void> {
    try {
        // Get the session ID from localStorage
        let sessionId: string | null = null;
        try {
            sessionId = localStorage.getItem('current_session_id');
        } catch (error) {
            console.warn('Unable to access localStorage for session ID:', error);
            return;
        }

        if (!sessionId) {
            console.warn('Cannot update session: No session ID in localStorage');

            // Try to find or create a session as a recovery mechanism
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session?.user?.id) {
                await recordSession();
            }
            return;
        }

        const { error } = await supabase
            .from('user_sessions')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('id', sessionId);

        if (error) {
            console.error('Error updating session activity:', error);

            // If the session no longer exists, try to record a new one
            if (error.code === '22P02' || error.code === '23503') { // Invalid UUID or Foreign key violation
                await recordSession();
            }
        }
    } catch (error) {
        console.error('Error updating session activity:', error);
    }
}

/**
 * Check if a user has an active session and handle accordingly
 * Call this when initializing the app
 */
export async function checkExistingSession(): Promise<void> {
    try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) return;

        const userId = sessionData.session.user.id;
        if (!userId) return;

        // Generate device fingerprint
        const deviceFingerprint = generateDeviceFingerprint();

        // 1. First, check localStorage for an existing session ID
        const storedSessionId = localStorage.getItem('current_session_id');

        // 2. If we have a stored session ID, try to use it first (most efficient path)
        if (storedSessionId) {
            try {
                // Update the session with current fingerprint and timestamp
                const { error } = await supabase
                    .from('user_sessions')
                    .update({
                        device_fingerprint: deviceFingerprint,
                        last_seen_at: new Date().toISOString()
                    })
                    .eq('id', storedSessionId)
                    .eq('user_id', userId);

                // If this succeeds (no error), we're done
                if (!error) return;

                // If error, continue to the next approach
            } catch (error) {
                console.warn('Error updating stored session:', error);
                // Continue to fallback approaches
            }
        }

        // 3. If stored ID didn't work, look for a session with matching fingerprint
        try {
            const { data, error } = await supabase
                .from('user_sessions')
                .select('id')
                .eq('user_id', userId)
                .eq('device_fingerprint', deviceFingerprint)
                .order('last_seen_at', { ascending: false })
                .limit(1);

            if (!error && data && data.length > 0) {
                const sessionId = data[0].id;
                localStorage.setItem('current_session_id', sessionId);

                // Update timestamp (fire and forget, don't await)
                void supabase
                    .from('user_sessions')
                    .update({ last_seen_at: new Date().toISOString() })
                    .eq('id', sessionId);

                return;
            }
        } catch (error) {
            console.warn('Error finding session by fingerprint:', error);
        }

        // 4. As a last resort, create a new session
        await recordSession();
    } catch (error) {
        console.error('Error checking existing session:', error);
        // Don't try to create a new session here to avoid potential infinite loops
    }
}

/**
 * Clean up duplicate sessions for the same device
 * This can be called periodically to ensure we don't have multiple sessions
 * per device
 */
export async function cleanupDuplicateSessions(userId: string): Promise<void> {
    // Use a timeout to ensure this function doesn't run too long
    const timeoutPromise = new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('Session cleanup timed out')), 3000)
    );

    try {
        await Promise.race([
            (async () => {
                // Get device fingerprint
                const deviceFingerprint = generateDeviceFingerprint();

                // Get all sessions for this device - limit to 10 to avoid processing too many
                const { data } = await supabase
                    .from('user_sessions')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('device_fingerprint', deviceFingerprint)
                    .order('last_seen_at', { ascending: false })
                    .limit(10);

                if (!data || data.length <= 1) {
                    // No duplicates, nothing to do
                    return;
                }

                // Keep the most recent session, delete the rest
                const mostRecentSessionId = data[0].id;
                const sessionsToDelete = data.slice(1).map(session => session.id);

                if (sessionsToDelete.length > 0) {
                    console.log(`Cleaning up ${sessionsToDelete.length} duplicate sessions`);

                    // Fire and forget - don't await
                    void supabase
                        .from('user_sessions')
                        .delete()
                        .in('id', sessionsToDelete);

                    // Ensure we're using the correct session ID in localStorage
                    localStorage.setItem('current_session_id', mostRecentSessionId);
                }
            })(),
            timeoutPromise
        ]);
    } catch (error) {
        // Log and continue - don't let this block the app
        console.warn('Session cleanup operation:', error);
    }
}

/**
 * Test function for manual session insertion
 * Only run this in browser console for testing purposes
 */
export async function testSessionInsertion() {
    try {
        const { data: sessionData } = await supabase.auth.getSession();
        console.log("Current session:", sessionData);

        if (!sessionData?.session) {
            console.log("No active session found");
            return;
        }

        const userId = sessionData.session.user.id;
        if (!userId) {
            console.error("Missing user ID");
            return;
        }

        // Generate a UUID for the session
        const sessionId = crypto.randomUUID();
        const deviceFingerprint = generateDeviceFingerprint();

        // Get location and IP data with timeout and error handling
        let locationData = '';
        let ipAddress = '';
        try {
            // Set a timeout
            const timeout = (ms: number) => new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout getting user data')), ms)
            );

            // Get IP with a timeout
            const ipPromise = Promise.race([
                getUserIP(),
                timeout(3000)
            ]).catch(err => {
                console.warn('Could not get IP:', err);
                return '';
            });

            // Get location with a timeout
            const regionPromise = Promise.race([
                getUserRegion(),
                timeout(3000)
            ]).catch(err => {
                console.warn('Could not get region:', err);
                return { location: '', region: '' };
            });

            // Wait for both but don't block if they fail
            const [ip, region] = await Promise.all([ipPromise, regionPromise]);
            ipAddress = typeof ip === 'string' ? ip : '';
            locationData = region && typeof region === 'object' && 'location' in region ?
                String(region.location || '') : '';
        } catch (error) {
            console.warn('Error getting user location/IP:', error);
            // Continue with empty values
        }

        // Insert a test session
        const result = await supabase.from('user_sessions').insert({
            id: sessionId,
            user_id: userId,
            ...(ipAddress && { ip: ipAddress }),
            ...(locationData && { location: locationData }),
            created_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
            device_type: 'Manual Test',
            device_fingerprint: deviceFingerprint
        });

        console.log("Device fingerprint:", deviceFingerprint);
        console.log("Insert result:", result);
    } catch (error) {
        console.error("Error in test session insertion:", error);
    }
}

/**
 * Cleanup all existing duplicate sessions across all users
 * This should be run as a one-time operation by an admin
 */
export async function cleanupAllDuplicateSessions(): Promise<void> {
    try {
        // Get all users
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('user_id');

        if (usersError || !users) {
            console.error('Failed to get users for session cleanup:', usersError);
            return;
        }

        console.log(`Starting cleanup for ${users.length} users`);

        // For each user, get their sessions
        for (const user of users) {
            const userId = user.user_id;

            // Get sessions grouped by device fingerprint
            const { data: sessions, error: sessionsError } = await supabase
                .from('user_sessions')
                .select('*')
                .eq('user_id', userId);

            if (sessionsError || !sessions) {
                console.error(`Failed to get sessions for user ${userId}:`, sessionsError);
                continue;
            }

            // Group sessions by device fingerprint
            const sessionsByDevice: Record<string, UserSession[]> = {};

            for (const session of sessions) {
                const fingerprint = session.device_fingerprint || 'unknown';
                if (!sessionsByDevice[fingerprint]) {
                    sessionsByDevice[fingerprint] = [];
                }
                sessionsByDevice[fingerprint].push(session);
            }

            // For each device with multiple sessions, keep only the most recent
            let deletedCount = 0;

            for (const [, deviceSessions] of Object.entries(sessionsByDevice)) {
                if (deviceSessions.length <= 1) continue;

                // Sort by last_seen_at (most recent first)
                deviceSessions.sort((a, b) =>
                    new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime()
                );

                // Keep the most recent, delete the rest
                const sessionsToDelete = deviceSessions.slice(1).map(s => s.id);

                if (sessionsToDelete.length > 0) {
                    const { error: deleteError } = await supabase
                        .from('user_sessions')
                        .delete()
                        .in('id', sessionsToDelete);

                    if (deleteError) {
                        console.error(`Failed to delete duplicate sessions for user ${userId}:`, deleteError);
                    } else {
                        deletedCount += sessionsToDelete.length;
                    }
                }
            }

            if (deletedCount > 0) {
                console.log(`Cleaned up ${deletedCount} duplicate sessions for user ${userId}`);
            }
        }

        console.log('Session cleanup complete');
    } catch (error) {
        console.error('Error in session cleanup:', error);
    }
} 
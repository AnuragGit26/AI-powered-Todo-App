import { getUserRegion } from '../hooks/getUserRegion';
import { getUserIP } from '../services/ipService';
import { supabase } from './supabaseClient';

// Session type
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

// Make a simple device fingerprint
function generateDeviceFingerprint(): string {
    try {
        const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const language = navigator.language;
        const platform = navigator.platform;
        const userAgent = navigator.userAgent;

        const fingerprint = `${screenInfo}|${timeZone}|${language}|${platform}|${userAgent}`;

        return btoa(fingerprint)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '')
            .substring(0, 40);
    } catch (error) {
        console.error('Error generating device fingerprint:', error);
        return 'fp_' + Math.random().toString(36).substring(2, 15);
    }
}

// Sign out + clear local stuff
export async function signOutAndCleanup(options?: { scope?: 'local' | 'global'; clearAll?: boolean }) {
    try {
        const scope = options?.scope || 'local';
        await supabase.auth.signOut({ scope });
    } catch (e) {
        console.warn('Sign out encountered an issue (continuing with cleanup):', e);
    } finally {
        try { sessionStorage.removeItem('token'); } catch { /* noop */ }
        try { localStorage.removeItem('current_session_id'); } catch { /* noop */ }
        try { localStorage.removeItem('userId'); } catch { /* noop */ }
        try { localStorage.removeItem('username'); } catch { /* noop */ }
        try { localStorage.removeItem('profilePicture'); } catch { /* noop */ }
        if (options?.clearAll) {
            try { localStorage.clear(); } catch { /* noop */ }
        }
    }
}

// Listen for revoke for this device
export function subscribeToSessionRevocation(activeSession?: { user?: { id?: string } } | string | null): () => void {
    try {
        const sessionId = localStorage.getItem('current_session_id');
        if (!sessionId) return () => { /* noop */ };

        const scopeSuffix = typeof activeSession === 'string'
            ? activeSession
            : activeSession?.user?.id || 'unknown';

        const channel = supabase
            .channel(`session_revoke_${sessionId}_${scopeSuffix}`)
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'user_sessions', filter: `id=eq.${sessionId}` },
                async () => {
                    await signOutAndCleanup({ scope: 'local' });
                    try { window.location.assign('/login'); } catch { /* noop */ }
                }
            )
            .subscribe();

        return () => {
            try { supabase.removeChannel(channel); } catch { /* noop */ }
        };
    } catch {
        return () => { /* noop */ };
    }
}

// Sign out everywhere
export async function signOutOnAllDevices(): Promise<void> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
            await supabase
                .from('user_sessions')
                .delete()
                .eq('user_id', user.id);
        }
    } catch (e) {
        console.warn('Error deleting user sessions during global sign-out:', e);
        // still sign out
    } finally {
        await signOutAndCleanup({ scope: 'global', clearAll: true });
        try { window.location.assign('/login'); } catch { /* noop */ }
    }
}

// List sessions for user
export async function fetchUserSessions(userId: string): Promise<UserSession[]> {
    try {
        const deviceFingerprint = generateDeviceFingerprint();
        const { data, error } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        return (data || []).map((session: UserSession) => ({
            ...session,
            is_current: session.device_fingerprint === deviceFingerprint
        }));
    } catch (error) {
        console.error('Error fetching user sessions:', error);
        throw error;
    }
}

// Kill one session
export async function terminateSession(sessionId: string): Promise<void> {
    try {
        const deviceFingerprint = generateDeviceFingerprint();
        const { data: sessionData } = await supabase
            .from('user_sessions')
            .select('device_fingerprint')
            .eq('id', sessionId)
            .single();

        const isCurrentDevice = sessionData?.device_fingerprint === deviceFingerprint;

        const { error } = await supabase
            .from('user_sessions')
            .delete()
            .eq('id', sessionId);

        if (error) throw error;

        if (isCurrentDevice) {
            await signOutAndCleanup({ scope: 'local' });
        }
    } catch (error) {
        console.error('Error terminating session:', error);
        throw error;
    }
}

// Upsert this device session
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

        const userAgent = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
        let deviceType = 'Desktop';

        if (isMobile) deviceType = 'Mobile';
        if (isTablet) deviceType = 'Tablet';

        const deviceFingerprint = generateDeviceFingerprint();
        console.log('Generated device fingerprint:', deviceFingerprint);

        const { data: existingSession, error: findError } = await supabase
            .from('user_sessions')
            .select('id')
            .eq('device_fingerprint', deviceFingerprint)
            .single();

        if (findError && findError.code !== 'PGRST116') { // no rows
            console.error('Error finding existing session:', findError);
        }

        if (existingSession) {
            console.log('Found existing session:', existingSession.id);
            const { error: updateError } = await supabase
                .from('user_sessions')
                .update({
                    last_seen_at: new Date().toISOString(),
                    user_agent: userAgent,
                    device_type: deviceType,
                    ip: await getUserIP(),
                    location: (await getUserRegion()).location,
                    user_id: userId
                })
                .eq('id', existingSession.id);

            if (updateError) {
                console.error('Error updating existing session:', updateError);
                throw updateError;
            }

            localStorage.setItem('current_session_id', existingSession.id);
            return;
        }
        const sessionId = crypto.randomUUID();
        console.log('Creating new session with ID:', sessionId);

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

        localStorage.setItem('current_session_id', sessionId);
    } catch (error) {
        console.error('Error recording session:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
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

// Touch last_seen for this session
export async function updateSessionActivity(): Promise<void> {
    try {
        let sessionId: string | null = null;
        try {
            sessionId = localStorage.getItem('current_session_id');
        } catch (error) {
            console.warn('Unable to access localStorage for session ID:', error);
            return;
        }

        if (!sessionId) {
            console.warn('Cannot update session: No session ID in localStorage');

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
            await recordSession();
            return;
        }
        try {
            const { data: verifyData, error: verifyError } = await supabase
                .from('user_sessions')
                .select('id')
                .eq('id', sessionId)
                .maybeSingle();

            if (verifyError || !verifyData) {
                await recordSession();
                return;
            }
        } catch (e) {
            console.warn('Session verify check failed:', e);
            await recordSession();
            return;
        }
    } catch (error) {
        console.error('Error updating session activity:', error);
    }
}

// Ensure we have a current session for this device
export async function checkExistingSession(): Promise<void> {
    try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) return;

        const userId = sessionData.session.user.id;
        if (!userId) return;

        const deviceFingerprint = generateDeviceFingerprint();

        const storedSessionId = localStorage.getItem('current_session_id');

        if (storedSessionId) {
            try {
                const { error } = await supabase
                    .from('user_sessions')
                    .update({
                        device_fingerprint: deviceFingerprint,
                        last_seen_at: new Date().toISOString()
                    })
                    .eq('id', storedSessionId)
                    .eq('user_id', userId);

                if (!error) {
                    const { data: verifyData } = await supabase
                        .from('user_sessions')
                        .select('id')
                        .eq('id', storedSessionId)
                        .single();
                    if (verifyData) {
                        return;
                    }
                }

            } catch (error) {
                console.warn('Error updating stored session:', error);
            }
        }

        // Try fingerprint match
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

                // Update ts (fire-and-forget)
                void supabase
                    .from('user_sessions')
                    .update({ last_seen_at: new Date().toISOString() })
                    .eq('id', sessionId);

                return;
            }
        } catch (error) {
            console.warn('Error finding session by fingerprint:', error);
        }

        // Else create new
        await recordSession();
    } catch (error) {
        console.error('Error checking existing session:', error);
        // avoid loops
    }
}

// Clean dup sessions for this device
export async function cleanupDuplicateSessions(userId: string): Promise<void> {
    // Timeout guard
    const timeoutPromise = new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('Session cleanup timed out')), 3000)
    );

    try {
        await Promise.race([
            (async () => {
                // Get fingerprint
                const deviceFingerprint = generateDeviceFingerprint();

                // Get sessions for this device (limit 10)
                const { data } = await supabase
                    .from('user_sessions')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('device_fingerprint', deviceFingerprint)
                    .order('last_seen_at', { ascending: false })
                    .limit(10);

                if (!data || data.length <= 1) {
                    // No dups
                    return;
                }

                // Keep newest, delete rest
                const mostRecentSessionId = data[0].id;
                const sessionsToDelete = data.slice(1).map(session => session.id);

                if (sessionsToDelete.length > 0) {
                    console.log(`Cleaning ${sessionsToDelete.length} dup sessions`);

                    // Fire-and-forget
                    void supabase
                        .from('user_sessions')
                        .delete()
                        .in('id', sessionsToDelete);

                    // Ensure correct local ID
                    localStorage.setItem('current_session_id', mostRecentSessionId);
                }
            })(),
            timeoutPromise
        ]);
    } catch (error) {
        // Just log, don't block
        console.warn('Session cleanup operation:', error);
    }
}

// Test helper: insert a session
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

        // Make ID
        const sessionId = crypto.randomUUID();
        const deviceFingerprint = generateDeviceFingerprint();

        // Try to get location/IP (with timeouts)
        let locationData = '';
        let ipAddress = '';
        try {
            // Timeout helper
            const timeout = (ms: number) => new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout getting user data')), ms)
            );

            // IP (with timeout)
            const ipPromise = Promise.race([
                getUserIP(),
                timeout(3000)
            ]).catch(err => {
                console.warn('Could not get IP:', err);
                return '';
            });

            // Location (with timeout)
            const regionPromise = Promise.race([
                getUserRegion(),
                timeout(3000)
            ]).catch(err => {
                console.warn('Could not get region:', err);
                return { location: '', region: '' };
            });

            // Wait for both (best-effort)
            const [ip, region] = await Promise.all([ipPromise, regionPromise]);
            ipAddress = typeof ip === 'string' ? ip : '';
            locationData = region && typeof region === 'object' && 'location' in region ?
                String(region.location || '') : '';
        } catch (error) {
            console.warn('Error getting user location/IP:', error);
            // Continue with blanks
        }

        // Insert
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

// Admin: cleanup dups for all users
export async function cleanupAllDuplicateSessions(): Promise<void> {
    try {
        // Get users
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('user_id');

        if (usersError || !users) {
            console.error('Failed to get users for session cleanup:', usersError);
            return;
        }

        console.log(`Starting cleanup for ${users.length} users`);

        // For each user
        for (const user of users) {
            const userId = user.user_id;

            // Get sessions for user
            const { data: sessions, error: sessionsError } = await supabase
                .from('user_sessions')
                .select('*')
                .eq('user_id', userId);

            if (sessionsError || !sessions) {
                console.error(`Failed to get sessions for user ${userId}:`, sessionsError);
                continue;
            }

            // Group by fingerprint
            const sessionsByDevice: Record<string, UserSession[]> = {};

            for (const session of sessions) {
                const fingerprint = session.device_fingerprint || 'unknown';
                if (!sessionsByDevice[fingerprint]) {
                    sessionsByDevice[fingerprint] = [];
                }
                sessionsByDevice[fingerprint].push(session);
            }

            // For devices with many, keep newest
            let deletedCount = 0;

            for (const [, deviceSessions] of Object.entries(sessionsByDevice)) {
                if (deviceSessions.length <= 1) continue;

                // Sort newest first
                deviceSessions.sort((a, b) =>
                    new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime()
                );

                // Keep newest, delete rest
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
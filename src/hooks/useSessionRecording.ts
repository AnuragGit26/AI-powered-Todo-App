import { useEffect, useRef } from 'react';
import { recordSession, updateSessionActivity } from '../lib/sessionUtils';

/**
 * Hook to automatically record and update user sessions
 * 
 * This hook:
 * 1. Records a new session when the component mounts (user logs in)
 * 2. Updates session activity frequently to reflect real-time presence
 * 3. Cleans up the interval timer when the component unmounts
 */
export function useSessionRecording() {
    // Use a ref to track if the component is mounted
    const isMounted = useRef(true);
    const lastPingAtRef = useRef<number>(0);
    const pingInFlightRef = useRef<boolean>(false);
    const PING_INTERVAL_MS = 20 * 1000; // 20s heartbeat for accurate presence
    const MIN_EVENT_PING_GAP_MS = 15 * 1000; // throttle activity-event pings

    useEffect(() => {
        // Do not record/update sessions on the reset password flow
        try {
            const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
            if (pathname.startsWith('/reset-password')) {
                return;
            }
        } catch {
            // ignore
        }

        // Set mounted flag
        isMounted.current = true;

        // Create a session recording task with abort capability
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        // Define an async function to handle session recording
        const handleSessionRecording = async () => {
            try {
                // We don't wait for this to complete
                recordSession().catch(err => {
                    if (!controller.signal.aborted) {
                        console.warn('Error in background session recording:', err);
                    }
                });

                // Clear the abort timeout if we reach here quickly
                clearTimeout(timeoutId);
            } catch (err) {
                // This shouldn't happen with the approach above, but just in case
                console.warn('Unexpected error in session recording handler:', err);
            }
        };

        // Call the function but don't wait for it
        handleSessionRecording();

        // Helper: ping presence with in-flight guard and timestamp tracking
        const ping = () => {
            if (!isMounted.current || pingInFlightRef.current) return;
            const now = Date.now();
            // Avoid excessive pings
            if (now - lastPingAtRef.current < MIN_EVENT_PING_GAP_MS) return;
            pingInFlightRef.current = true;
            const updateController = new AbortController();
            const updateTimeoutId = setTimeout(() => updateController.abort(), 5000);
            updateSessionActivity()
                .catch((err) => {
                    if (!updateController.signal.aborted) {
                        console.warn('Error updating session activity:', err);
                    }
                })
                .finally(() => {
                    clearTimeout(updateTimeoutId);
                    lastPingAtRef.current = Date.now();
                    pingInFlightRef.current = false;
                });
        };

        // Heartbeat every 20s
        const intervalId = setInterval(() => {
            ping();
        }, PING_INTERVAL_MS);

        // Also ping on resume/visibility and user activity with throttling
        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                // On return-to-tab, ensure quick presence update
                lastPingAtRef.current = 0; // reset throttle to allow immediate ping
                ping();
            }
        };
        const onFocus = () => {
            lastPingAtRef.current = 0;
            ping();
        };
        const onActivity = () => {
            ping();
        };
        const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        const options: AddEventListenerOptions = { passive: true };
        activityEvents.forEach(evt => window.addEventListener(evt, onActivity, options));
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('focus', onFocus);

        // Clean up when the component unmounts
        return () => {
            isMounted.current = false;
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            controller.abort(); // Abort any ongoing session operations
            activityEvents.forEach(evt => window.removeEventListener(evt, onActivity));
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('focus', onFocus);
        };
    }, [PING_INTERVAL_MS, MIN_EVENT_PING_GAP_MS]);
}
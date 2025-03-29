import { useEffect, useRef } from 'react';
import { recordSession, updateSessionActivity } from '../lib/sessionUtils';

/**
 * Hook to automatically record and update user sessions
 * 
 * This hook:
 * 1. Records a new session when the component mounts (user logs in)
 * 2. Updates session activity periodically to keep the session active
 * 3. Cleans up the interval timer when the component unmounts
 */
export function useSessionRecording() {
    // Use a ref to track if the component is mounted
    const isMounted = useRef(true);

    useEffect(() => {
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

        // Update session activity every 5 minutes
        const intervalId = setInterval(() => {
            // Only run if component is still mounted
            if (isMounted.current) {
                // Create a new controller for each update
                const updateController = new AbortController();
                const updateTimeoutId = setTimeout(() => updateController.abort(), 5000);

                // Call activity update but don't await it
                updateSessionActivity().catch(err => {
                    if (!updateController.signal.aborted) {
                        console.warn('Error updating session activity:', err);
                    }
                }).finally(() => {
                    clearTimeout(updateTimeoutId);
                });
            }
        }, 5 * 60 * 1000); // 5 minutes in milliseconds

        // Clean up when the component unmounts
        return () => {
            isMounted.current = false;
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            controller.abort(); // Abort any ongoing session operations
        };
    }, []);
} 
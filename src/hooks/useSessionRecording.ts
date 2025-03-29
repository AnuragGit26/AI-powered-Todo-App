import { useEffect } from 'react';
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
    useEffect(() => {
        // Record the session when the user logs in
        recordSession().catch(err => {
            console.error('Error recording session:', err);
        });

        // Update session activity every 5 minutes
        const intervalId = setInterval(() => {
            updateSessionActivity().catch(err => {
                console.error('Error updating session activity:', err);
            });
        }, 5 * 60 * 1000); // 5 minutes in milliseconds

        // Clean up when the component unmounts
        return () => {
            clearInterval(intervalId);
        };
    }, []);
} 
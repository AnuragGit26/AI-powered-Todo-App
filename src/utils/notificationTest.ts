/**
 * Notification Test Utility
 * Used to test notification functionality in development
 */

import { notificationService } from '../services/notificationService';

export const testNotification = async (): Promise<void> => {
    try {
        console.log('Testing notification system...');

        // Initialize notification service
        await notificationService.initialize();

        // Check permission
        const permission = notificationService.getPermission();
        console.log('Current permission:', permission);

        if (permission !== 'granted') {
            console.log('Requesting permission...');
            const newPermission = await notificationService.requestPermission();
            console.log('New permission:', newPermission);

            if (newPermission !== 'granted') {
                console.warn('Permission not granted, cannot test notifications');
                return;
            }
        }

        // Test basic notification
        console.log('Testing basic notification...');
        await notificationService.showSystemNotification(
            'Test Notification',
            'This is a test notification to verify the system is working.',
            'info'
        );

        // Test Pomodoro notification
        console.log('Testing Pomodoro notification...');
        await notificationService.showPomodoroNotification('work-complete');

        console.log('Notification test completed successfully!');

    } catch (error) {
        console.error('Notification test failed:', error);
    }
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
    (window as any).testNotification = testNotification;
}

/**
 * Comprehensive Notification Service for Chrome Notification API
 * Supports mobile, PWA, and web platforms with fallback mechanisms
 * Includes task reminder scheduling and management
 */

import type { TaskReminder, Todo } from '../types';
import { useNotificationStore } from '../store/notificationStore';

export interface NotificationOptions {
    title: string;
    body?: string;
    icon?: string;
    badge?: string;
    image?: string;
    tag?: string;
    data?: unknown;
    requireInteraction?: boolean;
    silent?: boolean;
    timestamp?: number;
    actions?: NotificationAction[];
    vibrate?: number[];
    sound?: string;
    dir?: 'auto' | 'ltr' | 'rtl';
    lang?: string;
    renotify?: boolean;
    sticky?: boolean;
}

export interface NotificationAction {
    action: string;
    title: string;
    icon?: string;
}

export type NotificationPermission = 'default' | 'granted' | 'denied';

export interface NotificationServiceConfig {
    defaultIcon: string;
    defaultBadge: string;
    enableSound: boolean;
    enableVibration: boolean;
    enableActions: boolean;
    maxNotifications: number;
    autoCloseDelay: number;
}

class NotificationService {
    private config: NotificationServiceConfig;
    private activeNotifications: Map<string, Notification> = new Map();
    private audioContext: AudioContext | null = null;
    private audioBuffer: AudioBuffer | null = null;
    private isInitialized = false;
    private reminderTimeouts: Map<string, NodeJS.Timeout> = new Map();

    constructor(config?: Partial<NotificationServiceConfig>) {
        this.config = {
            defaultIcon: '/icon-192.png',
            defaultBadge: '/icon-192.png',
            enableSound: true,
            enableVibration: true,
            enableActions: true,
            maxNotifications: 5,
            autoCloseDelay: 5000,
            ...config
        };
    }

    /**
     * Initialize the notification service
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Initialize audio context for sound notifications
            if (this.config.enableSound && 'AudioContext' in window) {
                this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
                await this.loadNotificationSound();
            }

            // Set up service worker for PWA notifications
            if ('serviceWorker' in navigator) {
                await this.registerServiceWorker();
            }

            this.isInitialized = true;
            console.log('NotificationService initialized successfully');
        } catch (error) {
            console.error('Failed to initialize NotificationService:', error);
            // Don't throw error, allow service to work without full initialization
        }
    }

    /**
     * Check if notifications are supported
     */
    isSupported(): boolean {
        return 'Notification' in window;
    }

    /**
     * Get current notification permission status
     */
    getPermission(): NotificationPermission {
        if (!this.isSupported()) return 'denied';
        return Notification.permission as NotificationPermission;
    }

    /**
     * Request notification permission from user
     */
    async requestPermission(): Promise<NotificationPermission> {
        if (!this.isSupported()) {
            console.warn('Notifications are not supported in this browser');
            return 'denied';
        }

        try {
            const permission = await Notification.requestPermission();
            console.log('Notification permission:', permission);
            return permission as NotificationPermission;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return 'denied';
        }
    }

    /**
     * Show a notification with enhanced options
     */
    async showNotification(options: NotificationOptions): Promise<Notification | null> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const permission = this.getPermission();
        if (permission !== 'granted') {
            console.warn('Notification permission not granted');
            return null;
        }

        try {
            // Clean up old notifications if we've reached the limit
            this.cleanupOldNotifications();

            // Prepare notification options
            const notificationOptions: NotificationOptions = {
                icon: this.config.defaultIcon,
                badge: this.config.defaultBadge,
                requireInteraction: false,
                silent: !this.config.enableSound,
                timestamp: Date.now(),
                ...options
            };

            // Add vibration pattern for mobile devices
            if (this.config.enableVibration && 'vibrate' in navigator) {
                notificationOptions.vibrate = [200, 100, 200];
            }

            // Try to show notification via service worker first (for better reliability)
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                try {
                    await this.showNotificationViaServiceWorker(notificationOptions);
                    // Mirror into in-app center even when SW handles display
                    try {
                        const store = useNotificationStore.getState();
                        store.addNotification({
                            id: notificationOptions.tag || `notification-${Date.now()}`,
                            title: notificationOptions.title,
                            body: notificationOptions.body,
                            tag: notificationOptions.tag,
                        });
                    } catch (e) {
                        console.warn('NotificationCenter store unavailable', e);
                    }
                    return null; // Service worker handled it
                } catch (swError) {
                    console.warn('Service worker notification failed, falling back to main thread:', swError);
                }
            }

            // For Chrome, if page is hidden, prefer service worker
            if (this.isChrome() && document.hidden) {
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    try {
                        await this.showNotificationViaServiceWorker(notificationOptions);
                        return null; // Service worker handled it
                    } catch (swError) {
                        console.warn('Service worker notification failed for hidden page:', swError);
                    }
                }
            }

            // Fallback to main thread notification
            const notification = new Notification(notificationOptions.title, notificationOptions);

            // Store the notification for cleanup
            const notificationId = notificationOptions.tag || `notification-${Date.now()}`;
            this.activeNotifications.set(notificationId, notification);

            // Set up auto-close
            if (this.config.autoCloseDelay > 0) {
                setTimeout(() => {
                    notification.close();
                    this.activeNotifications.delete(notificationId);
                }, this.config.autoCloseDelay);
            }

            // Play sound if enabled
            if (this.config.enableSound && !notificationOptions.silent) {
                this.playNotificationSound();
            }

            // Set up event handlers
            this.setupNotificationEventHandlers(notification, notificationId);

            // Mirror into in-app notification center
            try {
                const store = useNotificationStore.getState();
                store.addNotification({
                    id: notificationId,
                    title: notificationOptions.title,
                    body: notificationOptions.body,
                    tag: notificationOptions.tag,
                });
            } catch (e) {
                // ignore store errors
                console.warn('NotificationCenter store unavailable', e);
            }

            return notification;
        } catch (error) {
            console.error('Error showing notification:', error);
            return null;
        }
    }

    /**
     * Show Pomodoro timer notification
     */
    async showPomodoroNotification(type: 'work-complete' | 'break-complete' | 'work-start' | 'break-start'): Promise<void> {
        const notifications = {
            'work-complete': {
                title: '🎯 Work Session Complete!',
                body: 'Time for a well-deserved break!',
                tag: 'pomodoro-work-complete',
                requireInteraction: true,
                actions: [
                    { action: 'start-break', title: 'Start Break' },
                    { action: 'continue-work', title: 'Continue Working' }
                ]
            },
            'break-complete': {
                title: '⏰ Break Complete!',
                body: 'Time to get back to work!',
                tag: 'pomodoro-break-complete',
                requireInteraction: true,
                actions: [
                    { action: 'start-work', title: 'Start Work' },
                    { action: 'extend-break', title: 'Extend Break' }
                ]
            },
            'work-start': {
                title: '🚀 Work Session Started',
                body: 'Focus time begins now!',
                tag: 'pomodoro-work-start',
                requireInteraction: false
            },
            'break-start': {
                title: '☕ Break Time Started',
                body: 'Take a moment to relax!',
                tag: 'pomodoro-break-start',
                requireInteraction: false
            }
        };

        const notificationConfig = notifications[type];

        // For Chrome, ensure we have user interaction context
        if (this.isChrome() && document.hidden) {
            // If page is hidden, try to show notification anyway
            console.log('Page is hidden, attempting notification anyway');
        }

        await this.showNotification(notificationConfig);
    }

    /**
     * Ensure notification permission and service worker are ready
     */
    async ensureNotificationReady(): Promise<boolean> {
        try {
            // Initialize if not already done
            if (!this.isInitialized) {
                await this.initialize();
            }

            // Check permission
            const permission = this.getPermission();
            if (permission !== 'granted') {
                console.warn('Notification permission not granted');
                return false;
            }

            // Ensure service worker is ready
            if ('serviceWorker' in navigator) {
                await navigator.serviceWorker.ready;
            }

            return true;
        } catch (error) {
            console.error('Failed to ensure notification readiness:', error);
            return false;
        }
    }

    /**
     * Check if running on Chrome
     */
    private isChrome(): boolean {
        return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    }

    /**
     * Show task reminder notification
     */
    async showTaskReminder(taskTitle: string, dueDate?: Date, customMessage?: string): Promise<void> {
        const timeLeft = dueDate ? this.getTimeUntilDue(dueDate) : '';
        const body = customMessage || (dueDate ? `Due ${timeLeft}` : 'This task needs your attention');

        await this.showNotification({
            title: `📋 ${taskTitle}`,
            body,
            tag: `task-reminder-${taskTitle}`,
            requireInteraction: true,
            actions: [
                { action: 'view-task', title: 'View Task' },
                { action: 'mark-complete', title: 'Mark Complete' }
            ]
        });
    }

    /**
     * Schedule a task reminder
     */
    scheduleTaskReminder(reminder: TaskReminder, task: Todo): void {
        const now = new Date();
        const reminderTime = new Date(reminder.reminderTime);

        if (reminderTime <= now) {
            console.warn('Reminder time is in the past, skipping:', reminder);
            return;
        }

        const delay = reminderTime.getTime() - now.getTime();

        // Clear existing timeout if it exists
        this.clearReminderTimeout(reminder.id);

        const timeout = setTimeout(async () => {
            try {
                if (reminder.isActive) {
                    console.log(`🔔 Triggering reminder for task "${task.title}"`);

                    // Ensure notification service is ready
                    await this.ensureNotificationReady();

                    await this.showTaskReminder(
                        task.title,
                        task.dueDate ? new Date(task.dueDate) : undefined,
                        reminder.message
                    );

                    console.log(`✅ Reminder notification sent for task "${task.title}"`);

                    const updatedReminder: TaskReminder = { ...reminder, lastTriggered: new Date() };

                    if (updatedReminder.reminderType === 'recurring') {
                        this.scheduleRecurringReminder(updatedReminder, task);
                    }
                }
            } catch (error) {
                console.error(`❌ Failed to show reminder for task "${task.title}":`, error);
            } finally {
                this.reminderTimeouts.delete(reminder.id);
            }
        }, delay);

        this.reminderTimeouts.set(reminder.id, timeout);
        console.log(`⏰ Scheduled reminder for task "${task.title}" at ${reminderTime.toISOString()} (in ${Math.round(delay / 1000)} seconds)`);
    }

    /**
     * Schedule a recurring reminder
     */
    private scheduleRecurringReminder(reminder: TaskReminder, task: Todo): void {
        // For now, we'll implement daily recurring reminders
        // This can be extended to support different recurrence patterns
        const nextReminderTime = new Date(reminder.reminderTime);
        nextReminderTime.setDate(nextReminderTime.getDate() + 1);

        const updatedReminder: TaskReminder = {
            ...reminder,
            reminderTime: nextReminderTime
        };

        this.scheduleTaskReminder(updatedReminder, task);
    }

    /**
     * Clear a specific reminder timeout
     */
    clearReminderTimeout(reminderId: string): void {
        const timeout = this.reminderTimeouts.get(reminderId);
        if (timeout) {
            clearTimeout(timeout);
            this.reminderTimeouts.delete(reminderId);
        }
    }

    /**
     * Clear all reminder timeouts
     */
    clearAllReminderTimeouts(): void {
        this.reminderTimeouts.forEach(timeout => clearTimeout(timeout));
        this.reminderTimeouts.clear();
    }

    /**
     * Schedule reminders for a task
     */
    scheduleTaskReminders(task: Todo): void {
        if (!task.reminders || task.reminders.length === 0) {
            return;
        }

        task.reminders.forEach(reminder => {
            if (reminder.isActive) {
                this.scheduleTaskReminder(reminder, task);
            }
        });
    }

    /**
     * Cancel reminders for a task
     */
    cancelTaskReminders(taskId: string): void {
        // This would need to be implemented with a way to track task reminders
        // For now, we'll clear all timeouts (this is not ideal for production)
        console.log(`Cancelling reminders for task ${taskId}`);
    }

    /**
     * Create a due date reminder
     */
    createDueDateReminder(task: Todo, hoursBeforeDue: number = 1): TaskReminder | null {
        if (!task.dueDate) {
            return null;
        }

        const dueDate = new Date(task.dueDate);
        const reminderTime = new Date(dueDate.getTime() - (hoursBeforeDue * 60 * 60 * 1000));

        // Don't create reminders in the past
        if (reminderTime <= new Date()) {
            return null;
        }

        return {
            id: crypto.randomUUID(),
            taskId: task.id,
            reminderTime,
            isActive: true,
            reminderType: 'due_date',
            message: `Task "${task.title}" is due in ${hoursBeforeDue} hour${hoursBeforeDue > 1 ? 's' : ''}`,
            createdAt: new Date()
        };
    }

    /**
     * Create a custom reminder
     */
    createCustomReminder(taskId: string, reminderTime: Date, message?: string): TaskReminder {
        return {
            id: crypto.randomUUID(),
            taskId,
            reminderTime,
            isActive: true,
            reminderType: 'custom',
            message: message || 'Task reminder',
            createdAt: new Date()
        };
    }

    /**
     * Create default reminders for a task based on its due date
     */
    createDefaultReminders(task: Todo): TaskReminder[] {
        const reminders: TaskReminder[] = [];

        if (!task.dueDate || task.completed) {
            return reminders;
        }

        const dueDate = new Date(task.dueDate);
        const now = new Date();

        // Don't create reminders for past due dates
        if (dueDate <= now) {
            return reminders;
        }

        // Create reminders at different intervals before due date
        const reminderIntervals = [
            { hours: 24, message: `Task "${task.title}" is due tomorrow` },
            { hours: 2, message: `Task "${task.title}" is due in 2 hours` },
            { hours: 0.5, message: `Task "${task.title}" is due in 30 minutes` }
        ];

        reminderIntervals.forEach(({ hours, message }) => {
            const reminderTime = new Date(dueDate.getTime() - (hours * 60 * 60 * 1000));

            // Only create reminder if it's in the future
            if (reminderTime > now) {
                reminders.push({
                    id: crypto.randomUUID(),
                    taskId: task.id,
                    reminderTime,
                    isActive: true,
                    reminderType: 'due_date',
                    message,
                    createdAt: new Date()
                });
            }
        });

        return reminders;
    }

    /**
     * Add default reminders to a task if it doesn't have any
     */
    addDefaultRemindersIfNeeded(task: Todo): Todo {
        if (task.completed || !task.dueDate || (task.reminders && task.reminders.length > 0)) {
            return task;
        }

        const defaultReminders = this.createDefaultReminders(task);
        if (defaultReminders.length > 0) {
            return {
                ...task,
                reminders: defaultReminders
            };
        }

        return task;
    }

    /**
     * Process all tasks and add default reminders where needed
     */
    processTasksForDefaultReminders(tasks: Todo[]): Todo[] {
        return tasks.map(task => this.addDefaultRemindersIfNeeded(task));
    }

    /**
     * Show achievement notification
     */
    async showAchievement(title: string, description: string): Promise<void> {
        await this.showNotification({
            title: `🏆 ${title}`,
            body: description,
            tag: `achievement-${title}`,
            requireInteraction: true,
            icon: '/icon-512.png'
        });
    }

    /**
     * Show system notification (login, logout, etc.)
     */
    async showSystemNotification(title: string, body: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): Promise<void> {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };

        await this.showNotification({
            title: `${icons[type]} ${title}`,
            body,
            tag: `system-${type}-${Date.now()}`,
            requireInteraction: false
        });
    }

    /**
     * Close a specific notification
     */
    closeNotification(tag: string): void {
        const notification = this.activeNotifications.get(tag);
        if (notification) {
            notification.close();
            this.activeNotifications.delete(tag);
        }
    }

    /**
     * Close all active notifications
     */
    closeAllNotifications(): void {
        this.activeNotifications.forEach(notification => {
            notification.close();
        });
        this.activeNotifications.clear();
    }

    /**
     * Check if the app is running as PWA
     */
    isPWA(): boolean {
        return window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
            document.referrer.includes('android-app://');
    }

    /**
     * Check if running on mobile device
     */
    isMobile(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Private helper methods
     */
    private async loadNotificationSound(): Promise<void> {
        try {
            if (!this.audioContext) return;

            const response = await fetch('/notification.mp3');
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.warn('Could not load notification sound:', error);
        }
    }

    private playNotificationSound(): void {
        if (!this.audioContext || !this.audioBuffer) return;

        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();

            source.buffer = this.audioBuffer;
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            gainNode.gain.value = 0.5; // Set volume
            source.start();
        } catch (error) {
            console.warn('Could not play notification sound:', error);
        }
    }

    private async registerServiceWorker(): Promise<void> {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);

            // Wait for the service worker to be ready
            await navigator.serviceWorker.ready;
            console.log('Service Worker is ready');
        } catch (error) {
            console.warn('Service Worker registration failed:', error);
        }
    }

    private async showNotificationViaServiceWorker(options: NotificationOptions): Promise<void> {
        if (!navigator.serviceWorker.controller) {
            throw new Error('No service worker controller available');
        }

        return new Promise((resolve, reject) => {
            const messageChannel = new MessageChannel();

            messageChannel.port1.onmessage = (event) => {
                if (event.data.error) {
                    reject(new Error(event.data.error));
                } else {
                    resolve();
                }
            };

            const controller = navigator.serviceWorker.controller;
            if (!controller) {
                reject(new Error('Service worker controller is null'));
                return;
            }

            controller.postMessage({
                type: 'SHOW_NOTIFICATION',
                title: options.title,
                options: options
            }, [messageChannel.port2]);

            // Timeout after 5 seconds
            setTimeout(() => {
                reject(new Error('Service worker notification timeout'));
            }, 5000);
        });
    }

    private cleanupOldNotifications(): void {
        if (this.activeNotifications.size >= this.config.maxNotifications) {
            const oldestNotification = this.activeNotifications.values().next().value;
            if (oldestNotification) {
                oldestNotification.close();
                this.activeNotifications.delete(oldestNotification.tag || '');
            }
        }
    }

    private setupNotificationEventHandlers(notification: Notification, notificationId: string): void {
        notification.onclick = (event) => {
            event.preventDefault();
            window.focus();

            // Emit custom event for handling notification clicks
            window.dispatchEvent(new CustomEvent('notification-click', {
                detail: { notificationId, notification }
            }));
        };

        notification.onclose = () => {
            this.activeNotifications.delete(notificationId);
        };

        notification.onerror = (error) => {
            console.error('Notification error:', error);
            this.activeNotifications.delete(notificationId);
        };
    }

    private getTimeUntilDue(dueDate: Date): string {
        const now = new Date();
        const diff = dueDate.getTime() - now.getTime();

        if (diff <= 0) return 'now';

        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
        if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
        return 'soon';
    }
}

// Create and export a singleton instance
export const notificationService = new NotificationService();

// Export the class for custom instances
export { NotificationService };

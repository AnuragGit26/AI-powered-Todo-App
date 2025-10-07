/**
 * Comprehensive Notification Service for Chrome Notification API
 * Supports mobile, PWA, and web platforms with fallback mechanisms
 */

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

            // Create the notification
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
        await this.showNotification(notificationConfig);
    }

    /**
     * Show task reminder notification
     */
    async showTaskReminder(taskTitle: string, dueDate?: Date): Promise<void> {
        const timeLeft = dueDate ? this.getTimeUntilDue(dueDate) : '';
        const body = dueDate ? `Due ${timeLeft}` : 'This task needs your attention';

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
        } catch (error) {
            console.warn('Service Worker registration failed:', error);
        }
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

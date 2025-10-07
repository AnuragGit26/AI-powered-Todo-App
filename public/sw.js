/**
 * Service Worker for TaskMind AI PWA
 * Handles background notifications and offline functionality
 */

const CACHE_NAME = 'taskmind-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
    '/notification.mp3'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching files');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('Service Worker: Cache failed', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
            .catch(() => {
                // If both cache and network fail, show offline page
                if (event.request.destination === 'document') {
                    return caches.match('/index.html');
                }
            })
    );
});

// Push event - handle background notifications
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push received');

    let notificationData = {
        title: 'TaskMind AI',
        body: 'You have a new notification',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'taskmind-notification',
        requireInteraction: false,
        actions: [
            {
                action: 'view',
                title: 'View',
                icon: '/icon-192.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ]
    };

    // Parse push data if available
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = { ...notificationData, ...data };
        } catch (error) {
            console.error('Service Worker: Error parsing push data', error);
        }
    }

    event.waitUntil(
        self.registration.showNotification(notificationData.title, notificationData)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked', event);

    event.notification.close();

    const action = event.action;

    if (action === 'dismiss') {
        // Just close the notification
        return;
    }

    // Default action or 'view' action
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // If app is already open, focus it
                for (const client of clientList) {
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }

                // If app is not open, open it
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});

// Background sync for offline task management
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync', event.tag);

    if (event.tag === 'background-sync-tasks') {
        event.waitUntil(
            // Handle background sync for tasks
            syncTasks()
        );
    }
});

// Periodic background sync for notifications
self.addEventListener('periodicsync', (event) => {
    console.log('Service Worker: Periodic sync', event.tag);

    if (event.tag === 'task-reminders') {
        event.waitUntil(
            checkTaskReminders()
        );
    }
});

// Helper functions
async function syncTasks() {
    try {
        // Get pending tasks from IndexedDB
        const pendingTasks = await getPendingTasks();

        // Sync with server
        for (const task of pendingTasks) {
            await syncTaskWithServer(task);
        }

        console.log('Service Worker: Tasks synced successfully');
    } catch (error) {
        console.error('Service Worker: Task sync failed', error);
    }
}

async function checkTaskReminders() {
    try {
        // Check for due tasks and send notifications
        const dueTasks = await getDueTasks();

        for (const task of dueTasks) {
            await self.registration.showNotification(
                `📋 ${task.title}`,
                {
                    body: `Due ${getTimeUntilDue(task.dueDate)}`,
                    icon: '/icon-192.png',
                    badge: '/icon-192.png',
                    tag: `task-reminder-${task.id}`,
                    requireInteraction: true,
                    actions: [
                        { action: 'view-task', title: 'View Task' },
                        { action: 'mark-complete', title: 'Mark Complete' }
                    ]
                }
            );
        }
    } catch (error) {
        console.error('Service Worker: Task reminder check failed', error);
    }
}

async function getPendingTasks() {
    // This would typically read from IndexedDB
    // For now, return empty array
    return [];
}

async function getDueTasks() {
    // This would typically read from IndexedDB
    // For now, return empty array
    return [];
}

async function syncTaskWithServer(task) {
    // This would sync the task with the server
    console.log('Service Worker: Syncing task', task);
}

function getTimeUntilDue(dueDate) {
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

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, options } = event.data;
        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    }
});

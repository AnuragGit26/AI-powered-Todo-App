/**
 * Service Worker for TaskMind AI PWA
 * Handles background notifications and offline functionality
 */

const CACHE_NAME = 'taskmind-v2';
const OFFLINE_URL = '/offline.html';
const urlsToCache = [
    '/',
    '/index.html',
    OFFLINE_URL,
    '/offline.js',
    '/manifest.json',
    '/favicon.svg',
    '/icon-192.png',
    '/icon-512.png',
    '/notification.mp3'
];

// Inline HTML fallback (used only if cache is empty and network is unavailable)
const INLINE_OFFLINE_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes"/>
<title>Offline • TaskMind AI</title>
<style>
  :root{--bg1:#0f172a;--bg2:#020617;--t:#e5e7eb;--m:#9ca3af;--a1:#3b82f6;--a2:#a855f7}
  *{box-sizing:border-box}html,body{height:100%}body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,"Apple Color Emoji","Segoe UI Emoji";color:var(--t);background:radial-gradient(1200px 700px at 20% 10%,#1e293b 0%,transparent 55%),radial-gradient(900px 600px at 80% 20%,#0b7cff20 0%,transparent 50%),linear-gradient(160deg,var(--bg1),var(--bg2));display:grid;place-items:center;overflow:hidden}
  .wrap{width:min(720px,92vw);padding:28px}
  .card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:26px;box-shadow:0 20px 70px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.04);backdrop-filter:saturate(140%) blur(10px)}
  h1{margin:4px 0 8px;font-size:clamp(22px,3vw,30px)}p{margin:0;color:var(--m)}
  .mascot{display:flex;align-items:center;gap:12px;margin:6px 0 12px}
  .badge{width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,var(--a1),var(--a2));border:1px solid rgba(255,255,255,.18);box-shadow:0 8px 28px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.15);display:inline-flex;align-items:center;justify-content:center}
  .wiggle{animation:wig 2.2s ease-in-out infinite;transform-origin:50% 90%}
  @keyframes wig{0%,100%{transform:rotate(0)}15%{transform:rotate(-8deg)}30%{transform:rotate(8deg)}45%{transform:rotate(-4deg)}60%{transform:rotate(4deg)}}
  .tips{margin-top:14px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
  .tip{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px;font-size:13px;color:var(--m)}
  .status{margin-top:14px;font-size:13px;color:var(--m)}
</style></head>
<body><div class="wrap"><div class="card">
  <div class="mascot"><div class="badge wiggle">
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4.5" y="8" width="15" height="10" rx="3" fill="#ffffff" opacity="0.92"/>
      <circle cx="9" cy="13" r="1.2" fill="#0b1220"/>
      <circle cx="15" cy="13" r="1.2" fill="#0b1220"/>
      <path d="M8.8 16c2.1 1.3 4.3 1.3 6.4 0" stroke="#0b1220" stroke-width="1.6" stroke-linecap="round"/>
      <rect x="8" y="6" width="2" height="3" rx="0.8" fill="#ffffff" opacity="0.85"/>
      <rect x="14" y="6" width="2" height="3" rx="0.8" fill="#ffffff" opacity="0.85"/>
      <path d="M19 14c2.2 0 2.6 3 4.8 3" stroke="#ffffff" stroke-opacity="0.7" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="2.4 2.4"/>
    </svg>
  </div><div>Our Wi‑Fi goblin unplugged the cable.</div></div>
  <h1>You're offline</h1>
  <p>Open the app again when you're back online, or reload.</p>
  <div class="tips">
    <div class="tip">Check Wi‑Fi or mobile data</div>
    <div class="tip">Disable airplane mode</div>
    <div class="tip">Move to an area with better signal</div>
  </div>
  <div class="status">Offline fallback (no cache yet)</div>
</div></div></body></html>`;

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil((async () => {
        try {
            const cache = await caches.open(CACHE_NAME);
            await cache.addAll(urlsToCache);
        } catch (error) {
            console.error('Service Worker: Cache failed', error);
        } finally {
            // Activate updated SW immediately
            self.skipWaiting();
        }
    })());
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil((async () => {
        // Enable navigation preload for faster page loads
        if ('navigationPreload' in self.registration) {
            try {
                await self.registration.navigationPreload.enable();
            } catch (e) {
                // ignore
            }
        }
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map((cacheName) => {
                if (cacheName !== CACHE_NAME) {
                    console.log('Service Worker: Deleting old cache', cacheName);
                    return caches.delete(cacheName);
                }
            })
        );
        // Ensure offline page is cached (best-effort; don't fail activation if offline)
        try {
            const cache = await caches.open(CACHE_NAME);
            const hasOffline = await cache.match(OFFLINE_URL);
            if (!hasOffline) {
                await cache.add(OFFLINE_URL);
            }
        } catch (e) {
            console.warn('Service Worker: Could not ensure offline page during activate (likely offline).', e);
        }
        // Take control of open clients immediately
        await self.clients.claim();
    })());
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    // Handle navigations (or HTML requests) with an offline fallback
    const acceptHeader = request.headers.get('accept') || '';
    const isNavigation = request.mode === 'navigate' || (request.method === 'GET' && acceptHeader.includes('text/html'));
    if (isNavigation) {
        event.respondWith((async () => {
            try {
                // Try a preload response first (if enabled), then network
                const preload = await event.preloadResponse;
                if (preload) return preload;
                return await fetch(request);
            } catch (error) {
                // Offline or network error: return offline shell
                const cache = await caches.open(CACHE_NAME);
                const offlineResponse = await cache.match(OFFLINE_URL);
                if (offlineResponse) return offlineResponse;
                // Inline HTML fallback if nothing cached
                return new Response(INLINE_OFFLINE_HTML, {
                    status: 503,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' }
                });
            }
        })());
        return;
    }
    // For other requests: cache-first, then network
    event.respondWith((async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
            const response = await fetch(request);
            // Optionally cache same-origin GET responses
            if (request.method === 'GET' && new URL(request.url).origin === location.origin) {
                const cache = await caches.open(CACHE_NAME);
                cache.put(request, response.clone());
            }
            return response;
        } catch (error) {
            // If request was for an image, return a transparent placeholder
            if (request.destination === 'image') {
                return new Response('', { headers: { 'Content-Type': 'image/svg+xml' } });
            }
            throw error;
        }
    })());
});

// Push event - handle background notifications
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push received');

    event.waitUntil((async () => {
        let notificationData = {
            title: 'TaskMind AI',
            body: 'You have a new notification',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'taskmind-notification',
            requireInteraction: false,
            actions: [
                { action: 'view', title: 'View', icon: '/icon-192.png' },
                { action: 'dismiss', title: 'Dismiss' }
            ]
        };

        // Parse push data; prefer message/body as title
        try {
            if (event.data) {
                try {
                    const data = await event.data.json();
                    const messageText = String(data.message || data.body || data.title || '').trim();
                    if (messageText) {
                        notificationData.title = messageText; // message shown as header
                    }
                    const subtitle = String(data.title || '').trim();
                    if (subtitle && subtitle !== notificationData.title) {
                        notificationData.body = subtitle;
                    } else {
                        notificationData.body = '';
                    }
                    // Merge remaining fields (icon, tag, etc.)
                    notificationData = { ...notificationData, ...data, title: notificationData.title, body: notificationData.body };
                } catch (jsonError) {
                    // Fallback: treat payload as plain text
                    const textPayload = event.data?.text ? await event.data.text() : '';
                    const text = String(textPayload || '').trim();
                    if (text) {
                        const parts = text.split('|');
                        if (parts.length > 1) {
                            const maybeTitle = parts[0].trim();
                            const maybeBody = parts.slice(1).join('|').trim();
                            // Show the message/body as header
                            notificationData.title = maybeBody || maybeTitle || notificationData.title;
                            notificationData.body = maybeTitle;
                        } else {
                            notificationData.title = text;
                            notificationData.body = '';
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('Service Worker: push payload parse failed', e);
        }

        await self.registration.showNotification(notificationData.title, notificationData);

        // Broadcast to open clients so in-app panel can mirror
        try {
            const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
            for (const client of clientList) {
                client.postMessage({
                    type: 'NOTIFICATION_SHOWN',
                    title: notificationData.title,
                    body: notificationData.body,
                    tag: notificationData.tag,
                });
            }
        } catch (e) {
            // ignore broadcast failures
        }
    })());
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
        const port = event.ports[0];

        event.waitUntil((async () => {
            try {
                await self.registration.showNotification(title, options);
                console.log('Service Worker: Notification shown successfully');
                // Broadcast to clients for in-app notification center
                try {
                    const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
                    for (const client of clientList) {
                        client.postMessage({
                            type: 'NOTIFICATION_SHOWN',
                            title,
                            body: options?.body,
                            tag: options?.tag,
                        });
                    }
                } catch (e) {
                    // ignore
                }
                if (port) {
                    port.postMessage({ success: true });
                }
            } catch (error) {
                console.error('Service Worker: Failed to show notification', error);
                if (port) {
                    port.postMessage({ error: error.message });
                }
            }
        })());
    }
});

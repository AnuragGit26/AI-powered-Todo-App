import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

createRoot(document.getElementById('root')!).render(
    <QueryClientProvider client={queryClient}>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </QueryClientProvider>,
);

// Register Service Worker for offline support and PWA capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
                // If there's an updated service worker waiting, activate it immediately
                if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
            })
            .catch((err) => {
                console.warn('Service worker registration failed:', err);
            });
    });
    // Bridge service worker messages into the in-app Notification Center
    navigator.serviceWorker.addEventListener('message', async (event) => {
        const data = event.data as { type?: string; title?: string; body?: string; tag?: string } | undefined;
        if (!data || data.type !== 'NOTIFICATION_SHOWN') return;
        try {
            const { useNotificationStore } = await import('./store/notificationStore');
            const store = useNotificationStore.getState();
            store.addNotification({
                id: data.tag || `notification-${Date.now()}`,
                title: data.title || 'Notification',
                body: data.body,
                tag: data.tag,
            });
        } catch (e) {
            // ignore errors importing store
            console.warn('Failed to mirror SW notification into store', e);
        }
    });
}

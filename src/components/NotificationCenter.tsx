import React, { useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import { Button } from './ui/button';

export const NotificationBell: React.FC = () => {
    const unread = useNotificationStore((s) => s.unreadCount);
    const toggle = useNotificationStore((s) => s.toggleOpen);
    return (
        <button
            aria-label="Notifications"
            onClick={toggle}
            className="relative p-2 rounded-full hover:bg-gray-200/60 dark:hover:bg-gray-800/60 transition"
        >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] px-1 h-[16px] rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">
                    {unread > 9 ? '9+' : unread}
                </span>
            )}
        </button>
    );
};

const timeSince = (ts: number): string => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
};

export const NotificationCenter: React.FC = () => {
    const { isOpen, close, notifications, markAllRead, clearAll } = useNotificationStore();

    useEffect(() => {
        if (!isOpen) return;
        // Mark as read shortly after opening
        const t = setTimeout(() => markAllRead(), 500);
        return () => clearTimeout(t);
    }, [isOpen, markAllRead]);

    return (
        <div
            aria-live="polite"
            className={`fixed top-16 right-4 z-50 w-[360px] max-w-[92vw] transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-[150%]'
                }`}
        >
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl backdrop-blur-md bg-white/80 dark:bg-black/70">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                    <div className="font-semibold">Notifications</div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" className="h-8 px-2 text-xs" onClick={markAllRead}>
                            Mark all read
                        </Button>
                        <Button variant="ghost" className="h-8 px-2 text-xs" onClick={clearAll}>
                            Clear
                        </Button>
                        <button
                            aria-label="Close notifications"
                            onClick={close}
                            className="p-1 rounded-md hover:bg-gray-200/60 dark:hover:bg-gray-800/60"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="px-4 py-10 text-sm text-gray-500 dark:text-gray-400 text-center">
                            No notifications yet.
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-200/70 dark:divide-gray-800/70">
                            {notifications.map((n) => (
                                <li key={n.id} className="px-4 py-3">
                                    <div className="text-sm font-medium">{n.title}</div>
                                    {n.body && <div className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{n.body}</div>}
                                    <div className="text-xs text-gray-400 mt-1">{timeSince(n.timestamp)}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationCenter;



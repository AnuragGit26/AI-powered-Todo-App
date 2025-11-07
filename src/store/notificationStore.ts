import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppNotification {
    id: string;
    title: string;
    body?: string;
    timestamp: number;
    read: boolean;
    tag?: string;
}

interface NotificationState {
    notifications: AppNotification[];
    isOpen: boolean;
    unreadCount: number;
    toggleOpen: () => void;
    open: () => void;
    close: () => void;
    addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & Partial<Pick<AppNotification, 'id'>>) => void;
    markAllRead: () => void;
    clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set) => ({
            notifications: [],
            isOpen: false,
            unreadCount: 0,
            toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
            open: () => set({ isOpen: true }),
            close: () => set({ isOpen: false }),
            addNotification: (n) =>
                set((state) => {
                    const id = n.id || crypto.randomUUID();
                    const item: AppNotification = {
                        id,
                        title: n.title,
                        body: n.body,
                        tag: n.tag,
                        timestamp: Date.now(),
                        read: false,
                    };
                    const list = [item, ...state.notifications].slice(0, 50);
                    const unreadCount = list.filter((x) => !x.read).length;
                    return { notifications: list, unreadCount };
                }),
            markAllRead: () =>
                set((state) => ({
                    notifications: state.notifications.map((n) => ({ ...n, read: true })),
                    unreadCount: 0,
                })),
            clearAll: () => set({ notifications: [], unreadCount: 0 }),
        }),
        {
            name: 'notification-center',
            partialize: (s) => ({ notifications: s.notifications }),
        }
    )
);



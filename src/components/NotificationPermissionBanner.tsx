import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { notificationService, NotificationPermission } from '../services/notificationService';

interface NotificationPermissionBannerProps {
    onDismiss?: () => void;
    showOnlyIfDenied?: boolean;
}

export const NotificationPermissionBanner: React.FC<NotificationPermissionBannerProps> = ({
    onDismiss,
    showOnlyIfDenied = false
}) => {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isRequesting, setIsRequesting] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const checkPermission = () => {
            const currentPermission = notificationService.getPermission();
            setPermission(currentPermission);

            // Show banner based on conditions
            if (showOnlyIfDenied) {
                setIsVisible(currentPermission === 'denied');
            } else {
                setIsVisible(currentPermission === 'default');
            }
        };

        checkPermission();

        // Check permission periodically
        const interval = setInterval(checkPermission, 1000);
        return () => clearInterval(interval);
    }, [showOnlyIfDenied]);

    const handleRequestPermission = async () => {
        setIsRequesting(true);
        try {
            const newPermission = await notificationService.requestPermission();
            setPermission(newPermission);

            if (newPermission === 'granted') {
                // Show success notification
                await notificationService.showSystemNotification(
                    'Notifications Enabled!',
                    'You\'ll now receive task reminders and Pomodoro notifications.',
                    'success'
                );
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        } finally {
            setIsRequesting(false);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        onDismiss?.();
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.3 }}
                className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md mx-4"
            >
                <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-lg">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {permission === 'denied' ? (
                                    <BellOff className="h-5 w-5 text-red-500" />
                                ) : (
                                    <Bell className="h-5 w-5 text-blue-500" />
                                )}
                                <CardTitle className="text-sm font-medium">
                                    {permission === 'denied' ? 'Notifications Blocked' : 'Enable Notifications'}
                                </CardTitle>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDismiss}
                                className="h-6 w-6 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <CardDescription className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            {permission === 'denied' ? (
                                <>
                                    Notifications are currently blocked. To receive task reminders and Pomodoro alerts,
                                    please enable notifications in your browser settings.
                                </>
                            ) : (
                                <>
                                    Get notified about task deadlines and Pomodoro timer completions.
                                    Stay productive with timely reminders!
                                </>
                            )}
                        </CardDescription>

                        {permission === 'denied' ? (
                            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                <AlertCircle className="h-4 w-4" />
                                <span>Please enable notifications in your browser settings</span>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleRequestPermission}
                                    disabled={isRequesting}
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                                >
                                    {isRequesting ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Enabling...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Bell className="h-4 w-4" />
                                            <span>Enable Notifications</span>
                                        </div>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleDismiss}
                                    className="px-3"
                                >
                                    Maybe Later
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
};

interface NotificationSettingsProps {
    className?: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ className }) => {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        const checkPermission = () => {
            setPermission(notificationService.getPermission());
        };

        checkPermission();
        const interval = setInterval(checkPermission, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleRequestPermission = async () => {
        setIsRequesting(true);
        try {
            const newPermission = await notificationService.requestPermission();
            setPermission(newPermission);
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        } finally {
            setIsRequesting(false);
        }
    };

    const getPermissionStatus = () => {
        switch (permission) {
            case 'granted':
                return {
                    icon: <CheckCircle className="h-4 w-4 text-green-500" />,
                    text: 'Enabled',
                    color: 'text-green-600 dark:text-green-400'
                };
            case 'denied':
                return {
                    icon: <BellOff className="h-4 w-4 text-red-500" />,
                    text: 'Blocked',
                    color: 'text-red-600 dark:text-red-400'
                };
            default:
                return {
                    icon: <Bell className="h-4 w-4 text-yellow-500" />,
                    text: 'Not Set',
                    color: 'text-yellow-600 dark:text-yellow-400'
                };
        }
    };

    const status = getPermissionStatus();

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {status.icon}
                    <span className="font-medium">Browser Notifications</span>
                </div>
                <span className={`text-sm ${status.color}`}>
                    {status.text}
                </span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300">
                Receive notifications for task reminders, Pomodoro timer completions, and important updates.
            </p>

            {permission !== 'granted' && (
                <Button
                    onClick={handleRequestPermission}
                    disabled={isRequesting || permission === 'denied'}
                    className="w-full"
                >
                    {isRequesting ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            <span>Requesting...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            <span>
                                {permission === 'denied' ? 'Enable in Browser Settings' : 'Enable Notifications'}
                            </span>
                        </div>
                    )}
                </Button>
            )}

            {permission === 'denied' && (
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    <strong>How to enable notifications:</strong>
                    <ol className="mt-1 list-decimal list-inside space-y-1">
                        <li>Click the lock icon in your browser's address bar</li>
                        <li>Select "Allow" for notifications</li>
                        <li>Refresh this page</li>
                    </ol>
                </div>
            )}
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { notificationService, NotificationPermission } from '../services/notificationService';
import useIsMobile from '../hooks/useIsMobile';

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
    const isMobile = useIsMobile();

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
            {isMobile ? (
                // Mobile Modal
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
                    onClick={handleDismiss}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-sm sm:max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl">
                            <CardHeader className="pb-4 px-6 pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {permission === 'denied' ? (
                                            <div className="p-2 rounded-full bg-red-50 dark:bg-red-900/20">
                                                <BellOff className="h-5 w-5 text-red-500" />
                                            </div>
                                        ) : (
                                            <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/20">
                                                <Bell className="h-5 w-5 text-blue-500" />
                                            </div>
                                        )}
                                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                            {permission === 'denied' ? 'Notifications Blocked' : 'Enable Notifications'}
                                        </CardTitle>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleDismiss}
                                        className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors duration-200"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0 px-6 pb-6">
                                <CardDescription className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
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
                                    <div className="flex items-center gap-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-4">
                                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                        <span>Please enable notifications in your browser settings</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <Button
                                            onClick={handleRequestPermission}
                                            disabled={isRequesting}
                                            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            {isRequesting ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    <span>Enabling...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Bell className="h-5 w-5" />
                                                    <span>Enable Notifications</span>
                                                </div>
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleDismiss}
                                            className="w-full h-10 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            Maybe Later
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
            ) : (
                // Desktop Top-Right Corner
                <motion.div
                    initial={{ opacity: 0, x: 50, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 50, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="fixed top-20 right-4 sm:right-6 z-50 w-80 sm:w-96 max-w-lg"
                >
                    <Card className="bg-white/98 dark:bg-gray-900/98 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 shadow-2xl ring-1 ring-black/10 dark:ring-white/20 hover:shadow-3xl transition-all duration-300">
                        <CardHeader className="pb-4 px-5 pt-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {permission === 'denied' ? (
                                        <div className="p-2 rounded-full bg-red-50 dark:bg-red-900/20">
                                            <BellOff className="h-5 w-5 text-red-500" />
                                        </div>
                                    ) : (
                                        <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/20">
                                            <Bell className="h-5 w-5 text-blue-500" />
                                        </div>
                                    )}
                                    <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                        {permission === 'denied' ? 'Notifications Blocked' : 'Enable Notifications'}
                                    </CardTitle>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDismiss}
                                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors duration-200"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 px-5 pb-5">
                            <CardDescription className="text-sm text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
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
                                <div className="flex items-center gap-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    <span>Please enable notifications in your browser settings</span>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleRequestPermission}
                                        disabled={isRequesting}
                                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-3 text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {isRequesting ? (
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Enabling...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5">
                                                <Bell className="h-3.5 w-3.5" />
                                                <span>Enable</span>
                                            </div>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleDismiss}
                                        className="px-3 py-2.5 font-medium text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                                    >
                                        Later
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            )}
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

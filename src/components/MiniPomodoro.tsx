import React, { useEffect, useRef } from 'react';
import { useTodoStore } from '../store/todoStore';
import { Timer, Bell, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import useSound from 'use-sound';
import notifySound from '../assets/notify.wav';
import { useToast } from '../hooks/use-toast';

export const MiniPomodoro: React.FC = () => {
    const { pomodoro, updatePomodoroState, togglePomodoroTimer, resetPomodoroTimer, syncPomodoroState, loadPomodoroState, subscribeToPomodoroSync } = useTodoStore();
    const theme = useTodoStore((state) => state.theme);
    const { toast } = useToast();
    const notificationRef = useRef<HTMLAudioElement | null>(null);
    const syncSubscriptionRef = useRef<any>(null);

    // Initialize sound with useSound hook
    const [playSound] = useSound(notifySound, {
        volume: pomodoro.notificationVolume,
        soundEnabled: pomodoro.notificationEnabled,
    });

    // Timer ticker effect - updates the timer countdown
    useEffect(() => {
        // Calculate time difference since last update
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && pomodoro.isActive && !pomodoro.isPaused) {
                const now = Date.now();
                const elapsedSeconds = Math.floor((now - pomodoro.lastUpdatedAt) / 1000);

                if (elapsedSeconds > 0) {
                    let newTimeLeft = pomodoro.timeLeft - elapsedSeconds;

                    // Handle timer completion if it went below zero while invisible
                    if (newTimeLeft <= 0) {
                        handleTimerComplete();
                    } else {
                        updatePomodoroState({
                            timeLeft: newTimeLeft,
                            lastUpdatedAt: now
                        });
                    }
                }
            }
        };

        // Add visibility change listener
        document.addEventListener('visibilitychange', handleVisibilityChange);

        let interval: NodeJS.Timeout | null = null;

        // Only run the interval if timer is active AND not paused
        if (pomodoro.isActive && !pomodoro.isPaused && pomodoro.timeLeft > 0) {
            interval = setInterval(() => {
                updatePomodoroState({
                    timeLeft: pomodoro.timeLeft - 1,
                    lastUpdatedAt: Date.now()
                });
            }, 1000);
        } else if (pomodoro.timeLeft === 0 && pomodoro.isActive) {
            handleTimerComplete();
        }

        return () => {
            if (interval) clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [pomodoro.isActive, pomodoro.isPaused, pomodoro.timeLeft, pomodoro.lastUpdatedAt]);

    // Load and sync pomodoro state when user changes + set up real-time sync
    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (userId) {
            // Load initial state
            loadPomodoroState(userId);

            // Set up real-time subscription
            syncSubscriptionRef.current = subscribeToPomodoroSync(userId);
        }

        // Cleanup subscription on unmount or user change
        return () => {
            if (syncSubscriptionRef.current) {
                syncSubscriptionRef.current.unsubscribe();
                syncSubscriptionRef.current = null;
            }
        };
    }, [loadPomodoroState, subscribeToPomodoroSync]);

    // Auto-sync every 30 seconds when timer is active
    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        let syncInterval: NodeJS.Timeout;

        if (pomodoro.isActive || pomodoro.isPaused) {
            syncInterval = setInterval(() => {
                syncPomodoroState(userId);
            }, 30000); // Sync every 30 seconds
        }

        return () => {
            if (syncInterval) clearInterval(syncInterval);
        };
    }, [pomodoro.isActive, pomodoro.isPaused, syncPomodoroState]);

    // Sync immediately when timer state changes (start/pause/reset)
    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (userId && (pomodoro.lastUpdatedAt > (pomodoro.syncedAt || 0))) {
            // Debounce the sync to avoid too frequent calls
            const syncTimeout = setTimeout(() => {
                syncPomodoroState(userId);
            }, 1000);

            return () => clearTimeout(syncTimeout);
        }
    }, [pomodoro.isActive, pomodoro.isPaused, pomodoro.lastUpdatedAt, syncPomodoroState]);

    // Initialize audio element for notifications
    useEffect(() => {
        notificationRef.current = new Audio(notifySound);
        notificationRef.current.volume = pomodoro.notificationVolume;

        return () => {
            if (notificationRef.current) {
                notificationRef.current.pause();
                notificationRef.current = null;
            }
        };
    }, []);

    const handleTimerComplete = () => {
        // Play notification sound
        if (pomodoro.notificationEnabled) {
            try {
                if (notificationRef.current) {
                    notificationRef.current.play().catch(err => {
                        console.error("Error playing notification:", err);
                    });
                } else {
                    playSound();
                }

                // Show browser notification if allowed
                if ('Notification' in window && Notification.permission === 'granted') {
                    const title = pomodoro.isWorkTime ? 'Work Session Complete!' : 'Break Complete!';
                    const message = pomodoro.isWorkTime ?
                        `Time for a ${pomodoro.completedSessions % pomodoro.settings.longBreakInterval === 0 ? 'long' : 'short'} break.` :
                        'Time to get back to work.';

                    new Notification(title, { body: message });
                }

                // Show toast notification
                toast({
                    title: pomodoro.isWorkTime ? 'Work Session Complete!' : 'Break Complete!',
                    description: pomodoro.isWorkTime ?
                        `Time for a ${pomodoro.completedSessions % pomodoro.settings.longBreakInterval === 0 ? 'long' : 'short'} break.` :
                        'Time to get back to work.',
                    duration: 5000,
                });
            } catch (error) {
                console.error("Error with notification:", error);
            }
        }

        // Record session to history
        const newSession = {
            type: pomodoro.isWorkTime ? 'work' : (pomodoro.completedSessions % pomodoro.settings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak'),
            duration: pomodoro.isWorkTime ?
                pomodoro.settings.workTime :
                (pomodoro.completedSessions % pomodoro.settings.longBreakInterval === 0 ?
                    pomodoro.settings.longBreak : pomodoro.settings.shortBreak),
            completedAt: new Date(),
            label: pomodoro.currentLabel
        };

        // Determine next timer state
        let nextState: Partial<typeof pomodoro> = {};

        if (pomodoro.isWorkTime) {
            const isLongBreak = pomodoro.completedSessions % pomodoro.settings.longBreakInterval === 0 && pomodoro.completedSessions > 0;
            nextState = {
                completedSessions: pomodoro.completedSessions + 1,
                isWorkTime: false,
                timeLeft: isLongBreak ? pomodoro.settings.longBreak * 60 : pomodoro.settings.shortBreak * 60,
                sessionHistory: [newSession, ...pomodoro.sessionHistory].slice(0, 10),
                isActive: pomodoro.autoStartNext,
                isPaused: false,
            };
        } else {
            nextState = {
                isWorkTime: true,
                timeLeft: pomodoro.settings.workTime * 60,
                sessionHistory: [newSession, ...pomodoro.sessionHistory].slice(0, 10),
                isActive: pomodoro.autoStartNext,
                isPaused: false,
            };
        }

        updatePomodoroState(nextState);

        // Sync the completion to server
        const userId = localStorage.getItem('userId');
        if (userId) {
            setTimeout(() => syncPomodoroState(userId), 1000);
        }
    };

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Request notification permission if not set
    const requestNotificationPermission = () => {
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    };

    // Call on component mount to request notification permissions
    useEffect(() => {
        requestNotificationPermission();
    }, []);

    const getTimerStatus = () => {
        if (pomodoro.isActive && !pomodoro.isPaused) return 'running';
        if (pomodoro.isPaused) return 'paused';
        return 'stopped';
    };

    const getPlayPauseIcon = () => {
        const status = getTimerStatus();
        if (status === 'running') return <Pause className="h-3 w-3" />;
        return <Play className="h-3 w-3" />;
    };

    const getPlayPauseTitle = () => {
        const status = getTimerStatus();
        if (status === 'running') return "Pause Timer";
        if (status === 'paused') return "Resume Timer";
        return "Start Timer";
    };

    return (
        <div className="flex items-center gap-2 bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-md px-3 py-1.5 shadow-sm">
            <div className="flex items-center gap-1">
                <Timer className="w-4 h-4" style={{ color: theme.primaryColor }} />
                <span className="font-mono font-bold text-sm">{formatTime(pomodoro.timeLeft)}</span>
                {pomodoro.isPaused && (
                    <span className="text-xs text-orange-500 ml-1">⏸</span>
                )}
            </div>

            <div className="flex items-center">
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={togglePomodoroTimer}
                    title={getPlayPauseTitle()}
                >
                    {getPlayPauseIcon()}
                </Button>

                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={resetPomodoroTimer}
                    title="Reset Timer"
                >
                    <RotateCcw className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
}; 
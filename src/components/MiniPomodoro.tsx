import React, { useEffect, useRef } from 'react';
import { useTodoStore } from '../store/todoStore';
import { Timer, Bell, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import useSound from 'use-sound';
import notifySound from '../assets/notify.wav';
import { useToast } from '../hooks/use-toast';

export const MiniPomodoro: React.FC = () => {
    const { pomodoro, updatePomodoroState, togglePomodoroTimer, resetPomodoroTimer } = useTodoStore();
    const theme = useTodoStore((state) => state.theme);
    const { toast } = useToast();
    const notificationRef = useRef<HTMLAudioElement | null>(null);

    // Initialize sound with useSound hook
    const [playSound] = useSound(notifySound, {
        volume: pomodoro.notificationVolume,
        soundEnabled: pomodoro.notificationEnabled,
    });

    // Timer ticker effect - updates the timer countdown
    useEffect(() => {
        // Calculate time difference since last update
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && pomodoro.isActive) {
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

        if (pomodoro.isActive && pomodoro.timeLeft > 0) {
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
    }, [pomodoro.isActive, pomodoro.timeLeft, pomodoro.lastUpdatedAt, pomodoro.settings, pomodoro.completedSessions, pomodoro.isWorkTime, pomodoro.autoStartNext, pomodoro.sessionHistory, pomodoro.currentLabel, updatePomodoroState]);

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
            };
        } else {
            nextState = {
                isWorkTime: true,
                timeLeft: pomodoro.settings.workTime * 60,
                sessionHistory: [newSession, ...pomodoro.sessionHistory].slice(0, 10),
                isActive: pomodoro.autoStartNext,
            };
        }

        updatePomodoroState(nextState);
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

    return (
        <div className="flex items-center gap-2 bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-md px-3 py-1.5 shadow-sm">
            <div className="flex items-center gap-1">
                <Timer className="w-4 h-4" style={{ color: theme.primaryColor }} />
                <span className="font-mono font-bold text-sm">{formatTime(pomodoro.timeLeft)}</span>
            </div>

            <div className="flex items-center">
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={togglePomodoroTimer}
                    title={pomodoro.isActive ? "Pause Timer" : "Start Timer"}
                >
                    {pomodoro.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
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
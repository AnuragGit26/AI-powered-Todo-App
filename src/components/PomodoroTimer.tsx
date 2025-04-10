import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import Waves from './ui/Waves';
import { TimerAlert } from './ui/TimerAlert';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { History, Tag } from 'lucide-react';
import useSound from 'use-sound';
import notifySound from '../assets/notify.wav';
import { useTodoStore } from '../store/todoStore';

interface PomodoroSettings {
    workTime: number;
    shortBreak: number;
    longBreak: number;
    longBreakInterval: number;
}

interface SessionHistory {
    type: 'work' | 'shortBreak' | 'longBreak';
    duration: number;
    completedAt: Date;
    label?: string;
}

const defaultSettings: PomodoroSettings = {
    workTime: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
};

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

export const PomodoroTimer: React.FC = () => {
    const theme = useTodoStore((state) => state.theme);
    const { pomodoro, updatePomodoroState, togglePomodoroTimer, resetPomodoroTimer } = useTodoStore();

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        title: '',
        message: '',
        type: 'work' as 'work' | 'shortBreak' | 'longBreak',
    });

    const [showHistory, setShowHistory] = useState(false);

    // Initialize sound with useSound hook
    const [playSound] = useSound(notifySound, {
        volume: pomodoro.notificationVolume,
        soundEnabled: pomodoro.notificationEnabled,
    });

    // Calculate progress percentage
    const calculateProgress = () => {
        const totalSeconds = pomodoro.isWorkTime
            ? pomodoro.settings.workTime * 60
            : (pomodoro.completedSessions % pomodoro.settings.longBreakInterval === 0 ? pomodoro.settings.longBreak : pomodoro.settings.shortBreak) * 60;
        return ((totalSeconds - pomodoro.timeLeft) / totalSeconds) * 100;
    };

    // Update timer when settings change (only when timer is not active)
    useEffect(() => {
        if (!pomodoro.isActive) {
            const newTimeLeft = pomodoro.isWorkTime
                ? pomodoro.settings.workTime * 60
                : (pomodoro.completedSessions % pomodoro.settings.longBreakInterval === 0
                    ? pomodoro.settings.longBreak * 60
                    : pomodoro.settings.shortBreak * 60);

            updatePomodoroState({ timeLeft: newTimeLeft });
        }
    }, [pomodoro.settings, pomodoro.isActive, pomodoro.isWorkTime, pomodoro.completedSessions]);

    // Timer management is now handled by MiniPomodoro component and store

    // Show alert when timer completes
    useEffect(() => {
        if (pomodoro.timeLeft === 0) {
            const isLongBreak = pomodoro.completedSessions % pomodoro.settings.longBreakInterval === 0;

            if (pomodoro.isWorkTime) {
                setAlertConfig({
                    title: 'Work Session Complete!',
                    message: `Time for a ${isLongBreak ? 'long' : 'short'} break.`,
                    type: isLongBreak ? 'longBreak' : 'shortBreak',
                });
            } else {
                setAlertConfig({
                    title: 'Break Complete!',
                    message: 'Time to get back to work.',
                    type: 'work',
                });
            }

            setAlertVisible(true);
        }
    }, [pomodoro.timeLeft]);

    const closeAlert = () => {
        setAlertVisible(false);
    };

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const updateSetting = (key: keyof typeof pomodoro.settings, value: number) => {
        if (!pomodoro.isActive) {
            updatePomodoroState({
                settings: {
                    ...pomodoro.settings,
                    [key]: value
                }
            });
        }
    };

    // Update theme CSS variables
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--timer-primary-color', theme.primaryColor);
        root.style.setProperty('--timer-secondary-color', theme.secondaryColor);
    }, [theme]);

    return (
        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-white/60 to-white/30 dark:from-gray-900/60 dark:to-gray-900/30 backdrop-blur-sm shadow-2xl">
            <Waves className="absolute inset-0 w-full h-full" />

            {alertVisible && (
                <TimerAlert
                    title={alertConfig.title}
                    message={alertConfig.message}
                    type={alertConfig.type}
                    onClose={closeAlert}
                />
            )}

            <div className="relative z-10 p-6 sm:p-8">
                <div className="relative z-10">
                    {(pomodoro.isActive || pomodoro.completedSessions > 0 || pomodoro.timeLeft < pomodoro.settings.workTime * 60) && (
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-6 overflow-hidden">
                            <div
                                className="h-full transition-all duration-300 ease-linear rounded-full"
                                style={{
                                    width: `${calculateProgress()}%`,
                                    backgroundColor: theme.primaryColor
                                }}
                            />
                        </div>
                    )}

                    <div className="text-center">
                        <h2 className="text-3xl font-bold mb-2 text-gray-950 dark:text-gray-100">
                            {pomodoro.isWorkTime ? 'Work Time' : 'Break Time'}
                        </h2>
                        <div className="text-6xl font-mono font-bold mb-4 text-gray-950 dark:text-gray-100">
                            {formatTime(pomodoro.timeLeft)}
                        </div>

                        {/* Session Label Input */}
                        <div className="mb-4 flex items-center justify-center gap-2">
                            <Tag className="w-5 h-5" style={{ color: theme.primaryColor }} />
                            <Input
                                type="text"
                                placeholder="What are you working on?"
                                value={pomodoro.currentLabel}
                                onChange={(e) => updatePomodoroState({ currentLabel: e.target.value })}
                                className="max-w-xs text-center placeholder:text-gray-500"
                                disabled={pomodoro.isActive}
                            />
                        </div>

                        <div className="flex justify-center gap-4">
                            <Button
                                onClick={togglePomodoroTimer}
                                variant={pomodoro.isActive ? "destructive" : "default"}
                                size="lg"
                                className={pomodoro.isActive ? "bg-red-600 hover:bg-red-700" : ""}
                                style={!pomodoro.isActive ? {
                                    backgroundColor: theme.primaryColor,
                                    color: theme.mode === 'dark' ? '#fff' : '#000'
                                } : undefined}
                            >
                                {pomodoro.isActive ? 'Pause' : 'Start'}
                            </Button>
                            <Button
                                onClick={resetPomodoroTimer}
                                variant="outline"
                                size="lg"
                                className="border-2"
                                style={{ borderColor: theme.secondaryColor }}
                            >
                                Reset
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4 mt-6">
                        {/* Timer Settings */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Work Duration</span>
                            <div className="flex items-center gap-2">
                                <Slider
                                    value={[pomodoro.settings.workTime]}
                                    onValueChange={(value) => updateSetting('workTime', value[0])}
                                    min={1}
                                    max={60}
                                    step={1}
                                    className={`w-32 ${pomodoro.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={pomodoro.isActive}
                                    style={{
                                        '--slider-thumb-color': theme.primaryColor,
                                        '--slider-track-color': theme.primaryColor
                                    } as React.CSSProperties}
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{pomodoro.settings.workTime} min</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Short Break</span>
                            <div className="flex items-center gap-2">
                                <Slider
                                    value={[pomodoro.settings.shortBreak]}
                                    onValueChange={(value) => updateSetting('shortBreak', value[0])}
                                    min={1}
                                    max={30}
                                    step={1}
                                    className={`w-32 ${pomodoro.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={pomodoro.isActive}
                                    style={{
                                        '--slider-thumb-color': theme.secondaryColor,
                                        '--slider-track-color': theme.secondaryColor
                                    } as React.CSSProperties}
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{pomodoro.settings.shortBreak} min</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Long Break</span>
                            <div className="flex items-center gap-2">
                                <Slider
                                    value={[pomodoro.settings.longBreak]}
                                    onValueChange={(value) => updateSetting('longBreak', value[0])}
                                    min={5}
                                    max={60}
                                    step={1}
                                    className={`w-32 ${pomodoro.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={pomodoro.isActive}
                                    style={{
                                        '--slider-thumb-color': '#9333ea',
                                        '--slider-track-color': '#9333ea'
                                    } as React.CSSProperties}
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{pomodoro.settings.longBreak} min</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Long Break After</span>
                            <div className="flex items-center gap-2">
                                <Slider
                                    value={[pomodoro.settings.longBreakInterval]}
                                    onValueChange={(value) => updateSetting('longBreakInterval', value[0])}
                                    min={1}
                                    max={10}
                                    step={1}
                                    className={`w-32 ${pomodoro.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={pomodoro.isActive}
                                    style={{
                                        '--slider-thumb-color': theme.primaryColor,
                                        '--slider-track-color': theme.primaryColor
                                    } as React.CSSProperties}
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{pomodoro.settings.longBreakInterval} sessions</span>
                            </div>
                        </div>

                        {/* Additional Timer Settings */}
                        <div className="mt-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <label htmlFor="auto-start" className="text-sm font-medium text-gray-900 dark:text-gray-300">
                                    Auto-start Next Session
                                </label>
                                <Switch
                                    id="auto-start"
                                    checked={pomodoro.autoStartNext}
                                    onCheckedChange={(checked) => updatePomodoroState({ autoStartNext: checked })}
                                    style={{
                                        '--switch-thumb-color': theme.primaryColor,
                                        '--switch-track-color': theme.primaryColor
                                    } as React.CSSProperties}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <label htmlFor="notification" className="text-sm font-medium text-gray-900 dark:text-gray-300">
                                    Sound Notification
                                </label>
                                <Switch
                                    id="notification"
                                    checked={pomodoro.notificationEnabled}
                                    onCheckedChange={(checked) => updatePomodoroState({ notificationEnabled: checked })}
                                    style={{
                                        '--switch-thumb-color': theme.primaryColor,
                                        '--switch-track-color': theme.primaryColor
                                    } as React.CSSProperties}
                                />
                            </div>

                            {pomodoro.notificationEnabled && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Volume</span>
                                    <div className="flex items-center gap-2">
                                        <Slider
                                            value={[pomodoro.notificationVolume * 100]}
                                            onValueChange={(value) => updatePomodoroState({ notificationVolume: value[0] / 100 })}
                                            min={0}
                                            max={100}
                                            step={1}
                                            className="w-32"
                                            style={{
                                                '--slider-thumb-color': theme.secondaryColor,
                                                '--slider-track-color': theme.secondaryColor
                                            } as React.CSSProperties}
                                        />
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{Math.round(pomodoro.notificationVolume * 100)}%</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6">
                        <Button
                            variant="ghost"
                            className="w-full flex items-center justify-center gap-2"
                            onClick={() => setShowHistory(!showHistory)}
                            style={{ color: theme.primaryColor }}
                        >
                            <History className="w-4 h-4" />
                            {showHistory ? 'Hide History' : 'Show History'}
                        </Button>

                        {showHistory && (
                            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                                {pomodoro.sessionHistory.map((session, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2 rounded-lg"
                                        style={{
                                            backgroundColor: theme.mode === 'dark' ? 'rgba(31, 41, 55, 0.5)' : 'rgba(243, 244, 246, 0.5)',
                                            borderLeft: `3px solid ${session.type === 'work'
                                                ? theme.primaryColor
                                                : session.type === 'shortBreak'
                                                    ? theme.secondaryColor
                                                    : '#9333ea'
                                                }`
                                        }}
                                    >
                                        <div>
                                            <span className="text-sm font-medium block">
                                                {session.type === 'work' ? 'Work Session' : session.type === 'shortBreak' ? 'Short Break' : 'Long Break'}
                                            </span>
                                            {session.label && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400 block">{session.label}</span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm block">{session.duration} min</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                                {new Date(session.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}; 
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
    const [timeLeft, setTimeLeft] = useState(defaultSettings.workTime * 60);
    const [isActive, setIsActive] = useState(false);
    const [isWorkTime, setIsWorkTime] = useState(true);
    const [completedSessions, setCompletedSessions] = useState(0);
    const [settings, setSettings] = useState<PomodoroSettings>(defaultSettings);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        title: '',
        message: '',
        type: 'work' as 'work' | 'shortBreak' | 'longBreak',
    });

    // New state variables for added features
    const [sessionHistory, setSessionHistory] = useState<SessionHistory[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [currentLabel, setCurrentLabel] = useState('');
    const [autoStartNext, setAutoStartNext] = useState(false);
    const [notificationEnabled, setNotificationEnabled] = useState(true);
    const [notificationVolume, setNotificationVolume] = useState(0.5);

    // Initialize sound with useSound hook
    const [playSound] = useSound(notifySound, {
        volume: notificationVolume,
        soundEnabled: notificationEnabled,
    });

    // Calculate progress percentage
    const calculateProgress = () => {
        const totalSeconds = isWorkTime
            ? settings.workTime * 60
            : (completedSessions % settings.longBreakInterval === 0 ? settings.longBreak : settings.shortBreak) * 60;
        return ((totalSeconds - timeLeft) / totalSeconds) * 100;
    };

    // Update timer when settings change (only when timer is not active)
    useEffect(() => {
        if (!isActive) {
            if (isWorkTime) {
                setTimeLeft(settings.workTime * 60);
            } else {
                const isLongBreak = completedSessions % settings.longBreakInterval === 0;
                setTimeLeft(isLongBreak ? settings.longBreak * 60 : settings.shortBreak * 60);
            }
        }
    }, [settings, isActive, isWorkTime, completedSessions]);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            handleTimerComplete();
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const handleTimerComplete = () => {
        // Play notification sound using useSound hook
        if (notificationEnabled) {
            try {
                playSound();
            } catch (error) {
                console.error("Error playing notification sound:", error);
                setNotificationEnabled(false);
            }
        }

        // Add to session history
        const newSession: SessionHistory = {
            type: isWorkTime ? 'work' : (completedSessions % settings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak'),
            duration: isWorkTime ? settings.workTime : (completedSessions % settings.longBreakInterval === 0 ? settings.longBreak : settings.shortBreak),
            completedAt: new Date(),
            label: currentLabel
        };
        setSessionHistory(prev => [newSession, ...prev].slice(0, 10)); // Keep last 10 sessions

        if (isWorkTime) {
            const isLongBreak = completedSessions % settings.longBreakInterval === 0;
            setCompletedSessions((prev) => prev + 1);

            setAlertConfig({
                title: 'Work Session Complete!',
                message: `Time for a ${isLongBreak ? 'long' : 'short'} break.`,
                type: isLongBreak ? 'longBreak' : 'shortBreak',
            });
            setAlertVisible(true);

            setTimeLeft(isLongBreak ? settings.longBreak * 60 : settings.shortBreak * 60);
            setIsWorkTime(false);
        } else {
            setAlertConfig({
                title: 'Break Complete!',
                message: 'Time to get back to work.',
                type: 'work',
            });
            setAlertVisible(true);

            setTimeLeft(settings.workTime * 60);
            setIsWorkTime(true);
        }

        if (autoStartNext) {
            setIsActive(true);
        } else {
            setIsActive(false);
        }
    };

    const closeAlert = () => {
        setAlertVisible(false);
    };

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(settings.workTime * 60);
        setIsWorkTime(true);
        setCompletedSessions(0);
    };

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const updateSetting = (key: keyof PomodoroSettings, value: number) => {
        if (!isActive) {
            setSettings({ ...settings, [key]: value });
        }
    };

    // Update theme CSS variables
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--timer-primary-color', theme.primaryColor);
        root.style.setProperty('--timer-secondary-color', theme.secondaryColor);
    }, [theme]);

    return (
        <>
            <Card
                className="relative overflow-hidden p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-900 dark:to-black border-2 border-opacity-20 shadow-lg"
                style={{
                    borderColor: 'var(--timer-primary-color)',
                    background: `linear-gradient(135deg, 
                        ${theme.mode === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)'}, 
                        ${theme.mode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)'})`
                }}
            >
                <Waves
                    className="absolute inset-0"
                    style={{
                        opacity: theme.mode === 'dark' ? 0.15 : 0.1,
                        mixBlendMode: theme.mode === 'dark' ? 'lighten' : 'multiply'
                    }}
                    lineColor={theme.mode === 'dark' ?
                        `rgba(${hexToRgb(theme.primaryColor)?.r || 0}, ${hexToRgb(theme.primaryColor)?.g || 0}, ${hexToRgb(theme.primaryColor)?.b || 0}, 0.5)` :
                        theme.primaryColor}
                    waveAmpX={50}
                    waveAmpY={30}
                    waveSpeedX={0.025}
                    waveSpeedY={0.015}
                    friction={0.95}
                    tension={0.02}
                />

                {/* Progress Ring */}
                <div className="relative z-10">
                    {(isActive || completedSessions > 0 || timeLeft < settings.workTime * 60) && (
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
                            {isWorkTime ? 'Work Time' : 'Break Time'}
                        </h2>
                        <div className="text-6xl font-mono font-bold mb-4 text-gray-950 dark:text-gray-100">
                            {formatTime(timeLeft)}
                        </div>

                        {/* Session Label Input */}
                        <div className="mb-4 flex items-center justify-center gap-2">
                            <Tag className="w-5 h-5" style={{ color: theme.primaryColor }} />
                            <Input
                                type="text"
                                placeholder="What are you working on?"
                                value={currentLabel}
                                onChange={(e) => setCurrentLabel(e.target.value)}
                                className="max-w-xs text-center placeholder:text-gray-500"
                                disabled={isActive}
                            />
                        </div>

                        <div className="flex justify-center gap-4">
                            <Button
                                onClick={toggleTimer}
                                variant={isActive ? "destructive" : "default"}
                                size="lg"
                                className={isActive ? "bg-red-600 hover:bg-red-700" : ""}
                                style={!isActive ? {
                                    backgroundColor: theme.primaryColor,
                                    color: theme.mode === 'dark' ? '#fff' : '#000'
                                } : undefined}
                            >
                                {isActive ? 'Pause' : 'Start'}
                            </Button>
                            <Button
                                onClick={resetTimer}
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
                                    value={[settings.workTime]}
                                    onValueChange={(value) => updateSetting('workTime', value[0])}
                                    min={1}
                                    max={60}
                                    step={1}
                                    className={`w-32 ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={isActive}
                                    style={{
                                        '--slider-thumb-color': theme.primaryColor,
                                        '--slider-track-color': theme.primaryColor
                                    } as React.CSSProperties}
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{settings.workTime} min</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Short Break</span>
                            <div className="flex items-center gap-2">
                                <Slider
                                    value={[settings.shortBreak]}
                                    onValueChange={(value) => updateSetting('shortBreak', value[0])}
                                    min={1}
                                    max={15}
                                    step={1}
                                    className={`w-32 ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={isActive}
                                    style={{
                                        '--slider-thumb-color': theme.primaryColor,
                                        '--slider-track-color': theme.primaryColor
                                    } as React.CSSProperties}
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{settings.shortBreak} min</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Long Break</span>
                            <div className="flex items-center gap-2">
                                <Slider
                                    value={[settings.longBreak]}
                                    onValueChange={(value) => updateSetting('longBreak', value[0])}
                                    min={1}
                                    max={30}
                                    step={1}
                                    className={`w-32 ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={isActive}
                                    style={{
                                        '--slider-thumb-color': theme.primaryColor,
                                        '--slider-track-color': theme.primaryColor
                                    } as React.CSSProperties}
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{settings.longBreak} min</span>
                            </div>
                        </div>

                        {/* Additional Settings */}
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Auto-start next session</span>
                            <Switch
                                checked={autoStartNext}
                                onCheckedChange={setAutoStartNext}
                                style={{
                                    '--switch-color': theme.primaryColor
                                } as React.CSSProperties}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Enable Notifications</span>
                            <Switch
                                checked={notificationEnabled}
                                onCheckedChange={setNotificationEnabled}
                                style={{
                                    '--switch-color': theme.primaryColor
                                } as React.CSSProperties}
                            />
                        </div>

                        {notificationEnabled && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Notification Volume</span>
                                <Slider
                                    value={[notificationVolume * 100]}
                                    onValueChange={(value) => setNotificationVolume(value[0] / 100)}
                                    min={0}
                                    max={100}
                                    step={1}
                                    className="w-32"
                                    style={{
                                        '--slider-thumb-color': theme.primaryColor,
                                        '--slider-track-color': theme.primaryColor
                                    } as React.CSSProperties}
                                />
                            </div>
                        )}
                    </div>

                    {/* Session History */}
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
                                {sessionHistory.map((session, index) => (
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
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {session.type === 'work' ? '🎯 Work' : session.type === 'shortBreak' ? '☕️ Short Break' : '🌙 Long Break'}
                                            </span>
                                            {session.label && (
                                                <p className="text-xs text-gray-700 dark:text-gray-400">{session.label}</p>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-700 dark:text-gray-500">
                                            {session.duration}min - {new Date(session.completedAt).toLocaleTimeString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="text-center text-sm font-medium text-gray-700 dark:text-gray-400 mt-4">
                        Completed Sessions: {completedSessions}
                    </div>
                </div>
            </Card>

            <TimerAlert
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={closeAlert}
                visible={alertVisible}
            />
        </>
    );
}; 
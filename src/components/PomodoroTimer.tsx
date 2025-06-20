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
import { useBillingUsage } from '../hooks/useBillingUsage';

interface PomodoroSettings {
    workTime: number;
    shortBreak: number;
    longBreak: number;
    longBreakInterval: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    soundEnabled: boolean;
    soundVolume: number;
    label?: string;
}

interface SessionHistory {
    type: 'work' | 'shortBreak' | 'longBreak';
    duration: number;
    completedAt: Date;
    label?: string;
}

interface TimerAlertProps {
    title: string;
    message: string;
    type: 'work' | 'shortBreak' | 'longBreak';
    onClose: () => void;
    visible: boolean;
}

const defaultSettings: PomodoroSettings = {
    workTime: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
    autoStartBreaks: true,
    autoStartPomodoros: true,
    soundEnabled: true,
    soundVolume: 0.5,
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
    const { trackUsage, canUseFeature } = useBillingUsage();

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

    const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', priority);
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.position = 'absolute';
        liveRegion.style.left = '-10000px';
        liveRegion.textContent = message;
        document.body.appendChild(liveRegion);
        setTimeout(() => document.body.removeChild(liveRegion), 1000);
    };

    // Calculate progress percentage
    const getProgress = () => {
        const totalSeconds = pomodoro.isWorkTime
            ? pomodoro.settings.workTime * 60
            : (pomodoro.completedSessions % pomodoro.settings.longBreakInterval === 0 ? pomodoro.settings.longBreak : pomodoro.settings.shortBreak) * 60;
        return ((totalSeconds - pomodoro.timeLeft) / totalSeconds) * 100;
    };

    // Update timer when settings change (only when timer is not active)
    useEffect(() => {
        if (!pomodoro.isActive && !pomodoro.isPaused) {
            const newTimeLeft = pomodoro.isWorkTime
                ? pomodoro.settings.workTime * 60
                : (pomodoro.completedSessions % pomodoro.settings.longBreakInterval === 0
                    ? pomodoro.settings.longBreak * 60
                    : pomodoro.settings.shortBreak * 60);

            updatePomodoroState({ timeLeft: newTimeLeft });
        }
    }, [pomodoro.settings, pomodoro.isActive, pomodoro.isPaused, pomodoro.isWorkTime, pomodoro.completedSessions]);

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
                announceToScreenReader(`Work session complete! Time for a ${isLongBreak ? 'long' : 'short'} break.`, 'assertive');
            } else {
                setAlertConfig({
                    title: 'Break Complete!',
                    message: 'Time to get back to work.',
                    type: 'work',
                });
                announceToScreenReader('Break complete! Time to get back to work.', 'assertive');
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
        if (!pomodoro.isActive && !pomodoro.isPaused) {
            updatePomodoroState({
                settings: {
                    ...pomodoro.settings,
                    [key]: value
                }
            });
            announceToScreenReader(`${key} updated to ${value} minutes`);
        }
    };

    const getTimerStatus = () => {
        if (pomodoro.isActive && !pomodoro.isPaused) return 'running';
        if (pomodoro.isPaused) return 'paused';
        return 'stopped';
    };

    const getButtonText = () => {
        const status = getTimerStatus();
        if (status === 'running') return 'Pause';
        if (status === 'paused') return 'Resume';
        return 'Start';
    };

    const getButtonVariant = () => {
        const status = getTimerStatus();
        if (status === 'running') return 'destructive';
        if (status === 'paused') return 'default';
        return 'default';
    };

    const handleToggleTimer = () => {
        const currentStatus = getTimerStatus();
        togglePomodoroTimer();

        if (currentStatus === 'stopped') {
            announceToScreenReader('Timer started', 'polite');
        } else if (currentStatus === 'running') {
            announceToScreenReader('Timer paused', 'polite');
        } else if (currentStatus === 'paused') {
            announceToScreenReader('Timer resumed', 'polite');
        }
    };

    const handleResetTimer = () => {
        resetPomodoroTimer();
        announceToScreenReader('Timer reset', 'polite');
    };

    const getTimerPhaseDescription = () => {
        const phase = pomodoro.isWorkTime ? 'work session' : 'break time';
        const status = getTimerStatus();
        return `${phase}, ${status}`;
    };

    // Update theme CSS variables
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--timer-primary-color', theme.primaryColor);
        root.style.setProperty('--timer-secondary-color', theme.secondaryColor);
    }, [theme]);

    return (
        <Card
            className="relative overflow-hidden border-none bg-gradient-to-br from-white/30 to-white/10 dark:from-gray-900/30 dark:to-gray-900/10 backdrop-blur-md shadow-2xl"
            role="timer"
            aria-label="Pomodoro Timer"
        >
            <Waves className="absolute inset-0 w-full h-full opacity-10" aria-hidden="true" />

            {alertVisible && (
                <TimerAlert
                    title={alertConfig.title}
                    message={alertConfig.message}
                    type={alertConfig.type}
                    onClose={closeAlert}
                    visible={alertVisible}
                />
            )}

            <div className="relative z-10 p-6 sm:p-8">
                <div className="relative z-10 bg-white/5 dark:bg-black/5 rounded-xl backdrop-blur-sm p-6">
                    {(pomodoro.isActive || pomodoro.isPaused || pomodoro.completedSessions > 0 || pomodoro.timeLeft < pomodoro.settings.workTime * 60) && (
                        <div
                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-6 overflow-hidden"
                            role="progressbar"
                            aria-label="Timer progress"
                            aria-valuenow={Math.round(getProgress())}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-describedby="progress-description"
                        >
                            <div
                                className="h-full transition-all duration-300 ease-linear rounded-full"
                                style={{
                                    width: `${getProgress()}%`,
                                    backgroundColor: theme.primaryColor
                                }}
                                aria-hidden="true"
                            />
                        </div>
                    )}
                    <div id="progress-description" className="sr-only">
                        Timer progress: {Math.round(getProgress())}% complete
                    </div>

                    <div className="text-center">
                        <h2
                            className="text-3xl font-bold mb-2 text-gray-700 dark:text-gray-100"
                            id="timer-phase"
                            aria-live="polite"
                        >
                            {pomodoro.isWorkTime ? 'Work Time' : 'Break Time'}
                            {pomodoro.isPaused && (
                                <span className="text-orange-500 ml-2 text-lg" role="status" aria-label="Timer is paused">⏸ Paused</span>
                            )}
                        </h2>

                        <div
                            className="text-6xl font-mono font-bold mb-4 text-gray-800 dark:text-gray-100"
                            role="timer"
                            aria-live="polite"
                            aria-atomic="true"
                            aria-label={`Time remaining: ${formatTime(pomodoro.timeLeft)}`}
                            id="timer-display"
                        >
                            {formatTime(pomodoro.timeLeft)}
                        </div>

                        {/* Session Label Input */}
                        <div className="mb-4 flex items-center justify-center gap-2">
                            <Tag className="w-5 h-5" style={{ color: theme.primaryColor }} aria-hidden="true" />
                            <label htmlFor="session-label" className="sr-only">
                                What are you working on?
                            </label>
                            <Input
                                id="session-label"
                                type="text"
                                placeholder="What are you working on?"
                                value={pomodoro.currentLabel}
                                onChange={(e) => updatePomodoroState({ currentLabel: e.target.value })}
                                className="max-w-xs text-center placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={pomodoro.isActive && !pomodoro.isPaused}
                                aria-describedby="session-label-help"
                            />
                            <div id="session-label-help" className="sr-only">
                                Enter a label for this work session (optional)
                            </div>
                        </div>

                        <div className="flex justify-center gap-4" role="group" aria-label="Timer controls">
                            <Button
                                onClick={handleToggleTimer}
                                variant={getButtonVariant()}
                                size="lg"
                                className={
                                    getTimerStatus() === 'running'
                                        ? "bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                        : getTimerStatus() === 'paused'
                                            ? "bg-orange-600 hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                                            : "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                }
                                style={getTimerStatus() === 'stopped' ? {
                                    backgroundColor: theme.primaryColor,
                                    color: theme.mode === 'dark' ? '#fff' : '#000'
                                } : undefined}
                                aria-describedby="timer-button-help"
                            >
                                {getButtonText()}
                            </Button>
                            <div id="timer-button-help" className="sr-only">
                                {getTimerStatus() === 'stopped' && 'Start the pomodoro timer'}
                                {getTimerStatus() === 'running' && 'Pause the timer'}
                                {getTimerStatus() === 'paused' && 'Resume the timer'}
                            </div>

                            <Button
                                onClick={handleResetTimer}
                                variant="outline"
                                size="lg"
                                className="border-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                style={{ borderColor: theme.secondaryColor }}
                                aria-label="Reset timer to initial state"
                            >
                                Reset
                            </Button>
                        </div>
                    </div>

                    <fieldset className="space-y-4 mt-6 bg-white/5 dark:bg-black/5 rounded-xl backdrop-blur-sm p-6">
                        <legend className="text-lg font-semibold text-gray-700 dark:text-gray-100 mb-4">
                            Timer Settings
                        </legend>

                        {/* Timer Settings */}
                        <div className="flex items-center justify-between">
                            <label htmlFor="work-duration" className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Work Duration
                            </label>
                            <div className="flex items-center gap-2">
                                <Slider
                                    id="work-duration"
                                    value={[pomodoro.settings.workTime]}
                                    onValueChange={(value) => updateSetting('workTime', value[0])}
                                    min={1}
                                    max={60}
                                    step={1}
                                    className={`w-32 ${(pomodoro.isActive || pomodoro.isPaused) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={pomodoro.isActive || pomodoro.isPaused}
                                    style={{
                                        '--slider-thumb-color': theme.primaryColor,
                                        '--slider-track-color': theme.primaryColor
                                    } as React.CSSProperties}
                                    aria-describedby="work-duration-help"
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-200 min-w-[60px]" aria-live="polite">
                                    {pomodoro.settings.workTime} min
                                </span>
                            </div>
                            <div id="work-duration-help" className="sr-only">
                                Set the duration for work sessions in minutes
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label htmlFor="short-break" className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Short Break
                            </label>
                            <div className="flex items-center gap-2">
                                <Slider
                                    id="short-break"
                                    value={[pomodoro.settings.shortBreak]}
                                    onValueChange={(value) => updateSetting('shortBreak', value[0])}
                                    min={1}
                                    max={30}
                                    step={1}
                                    className={`w-32 ${(pomodoro.isActive || pomodoro.isPaused) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={pomodoro.isActive || pomodoro.isPaused}
                                    style={{
                                        '--slider-thumb-color': theme.secondaryColor,
                                        '--slider-track-color': theme.secondaryColor
                                    } as React.CSSProperties}
                                    aria-describedby="short-break-help"
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-200 min-w-[60px]" aria-live="polite">
                                    {pomodoro.settings.shortBreak} min
                                </span>
                            </div>
                            <div id="short-break-help" className="sr-only">
                                Set the duration for short breaks in minutes
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label htmlFor="long-break" className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Long Break
                            </label>
                            <div className="flex items-center gap-2">
                                <Slider
                                    id="long-break"
                                    value={[pomodoro.settings.longBreak]}
                                    onValueChange={(value) => updateSetting('longBreak', value[0])}
                                    min={5}
                                    max={60}
                                    step={1}
                                    className={`w-32 ${(pomodoro.isActive || pomodoro.isPaused) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={pomodoro.isActive || pomodoro.isPaused}
                                    style={{
                                        '--slider-thumb-color': '#9333ea',
                                        '--slider-track-color': '#9333ea'
                                    } as React.CSSProperties}
                                    aria-describedby="long-break-help"
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-200 min-w-[60px]" aria-live="polite">
                                    {pomodoro.settings.longBreak} min
                                </span>
                            </div>
                            <div id="long-break-help" className="sr-only">
                                Set the duration for long breaks in minutes
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label htmlFor="long-break-interval" className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Long Break After
                            </label>
                            <div className="flex items-center gap-2">
                                <Slider
                                    id="long-break-interval"
                                    value={[pomodoro.settings.longBreakInterval]}
                                    onValueChange={(value) => updateSetting('longBreakInterval', value[0])}
                                    min={1}
                                    max={10}
                                    step={1}
                                    className={`w-32 ${(pomodoro.isActive || pomodoro.isPaused) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={pomodoro.isActive || pomodoro.isPaused}
                                    style={{
                                        '--slider-thumb-color': theme.primaryColor,
                                        '--slider-track-color': theme.primaryColor
                                    } as React.CSSProperties}
                                    aria-describedby="long-break-interval-help"
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-200 min-w-[80px]" aria-live="polite">
                                    {pomodoro.settings.longBreakInterval} sessions
                                </span>
                            </div>
                            <div id="long-break-interval-help" className="sr-only">
                                Set how many work sessions before a long break
                            </div>
                        </div>
                    </fieldset>

                    {/* Additional Timer Settings */}
                    <fieldset className="mt-6 space-y-4 bg-white/5 dark:bg-black/5 rounded-xl backdrop-blur-sm p-6">
                        <legend className="text-lg font-semibold text-gray-700 dark:text-gray-100 mb-4">
                            Additional Settings
                        </legend>

                        <div className="flex items-center justify-between">
                            <label htmlFor="auto-start" className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Auto-start Next Session
                            </label>
                            <Switch
                                id="auto-start"
                                checked={pomodoro.autoStartNext}
                                onCheckedChange={(checked) => {
                                    updatePomodoroState({ autoStartNext: checked });
                                    announceToScreenReader(`Auto-start ${checked ? 'enabled' : 'disabled'}`);
                                }}
                                style={{
                                    '--switch-thumb-color': theme.primaryColor,
                                    '--switch-track-color': theme.primaryColor
                                } as React.CSSProperties}
                                aria-describedby="auto-start-help"
                            />
                            <div id="auto-start-help" className="sr-only">
                                Automatically start the next session when current one ends
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label htmlFor="notification" className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Sound Notification
                            </label>
                            <Switch
                                id="notification"
                                checked={pomodoro.notificationEnabled}
                                onCheckedChange={(checked) => {
                                    updatePomodoroState({ notificationEnabled: checked });
                                    announceToScreenReader(`Sound notifications ${checked ? 'enabled' : 'disabled'}`);
                                }}
                                style={{
                                    '--switch-thumb-color': theme.primaryColor,
                                    '--switch-track-color': theme.primaryColor
                                } as React.CSSProperties}
                                aria-describedby="notification-help"
                            />
                            <div id="notification-help" className="sr-only">
                                Play sound when timer completes
                            </div>
                        </div>

                        {pomodoro.notificationEnabled && (
                            <div className="flex items-center justify-between">
                                <label htmlFor="volume" className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    Volume
                                </label>
                                <div className="flex items-center gap-2">
                                    <Slider
                                        id="volume"
                                        value={[pomodoro.notificationVolume * 100]}
                                        onValueChange={(value) => {
                                            const newVolume = value[0] / 100;
                                            updatePomodoroState({ notificationVolume: newVolume });
                                            announceToScreenReader(`Volume set to ${value[0]}%`);
                                        }}
                                        min={0}
                                        max={100}
                                        step={1}
                                        className="w-32"
                                        style={{
                                            '--slider-thumb-color': theme.secondaryColor,
                                            '--slider-track-color': theme.secondaryColor
                                        } as React.CSSProperties}
                                        aria-describedby="volume-help"
                                    />
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-200 min-w-[50px]" aria-live="polite">
                                        {Math.round(pomodoro.notificationVolume * 100)}%
                                    </span>
                                </div>
                                <div id="volume-help" className="sr-only">
                                    Adjust notification sound volume
                                </div>
                            </div>
                        )}
                    </fieldset>

                    <div className="mt-6 bg-white/5 dark:bg-black/5 rounded-xl backdrop-blur-sm p-6">
                        <Button
                            variant="ghost"
                            className="w-full flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            onClick={() => {
                                setShowHistory(!showHistory);
                                announceToScreenReader(`Session history ${!showHistory ? 'shown' : 'hidden'}`);
                            }}
                            style={{ color: theme.primaryColor }}
                            aria-expanded={showHistory}
                            aria-controls="session-history"
                        >
                            <History className="w-4 h-4" aria-hidden="true" />
                            {showHistory ? 'Hide History' : 'Show History'}
                        </Button>

                        {showHistory && (
                            <div
                                id="session-history"
                                className="mt-4 space-y-2 max-h-48 overflow-y-auto"
                                role="region"
                                aria-label="Session History"
                            >
                                {pomodoro.sessionHistory.length > 0 ? (
                                    pomodoro.sessionHistory.map((session, index) => (
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
                                            role="listitem"
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
                                                <span className="text-sm block" aria-label={`Duration: ${session.duration} minutes`}>
                                                    {session.duration} min
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                                    {new Date(session.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                        No sessions completed yet. Start your first pomodoro!
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}; 
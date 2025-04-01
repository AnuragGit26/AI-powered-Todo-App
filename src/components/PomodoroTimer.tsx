import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import Waves from './ui/Waves';
import { TimerAlert } from './ui/TimerAlert';

interface PomodoroSettings {
    workTime: number;
    shortBreak: number;
    longBreak: number;
    longBreakInterval: number;
}

const defaultSettings: PomodoroSettings = {
    workTime: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
};

export const PomodoroTimer: React.FC = () => {
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
        const audio = new Audio('/notification.mp3');
        audio.play();

        if (isWorkTime) {
            const isLongBreak = completedSessions % settings.longBreakInterval === 0;
            setCompletedSessions((prev) => prev + 1);

            // Show soft UI alert for work completion
            setAlertConfig({
                title: 'Work Session Complete!',
                message: `Time for a ${isLongBreak ? 'long' : 'short'} break.`,
                type: isLongBreak ? 'longBreak' : 'shortBreak',
            });
            setAlertVisible(true);

            // Update the timer state
            setTimeLeft(isLongBreak ? settings.longBreak * 60 : settings.shortBreak * 60);
            setIsWorkTime(false);
        } else {
            // Show soft UI alert for break completion
            setAlertConfig({
                title: 'Break Complete!',
                message: 'Time to get back to work.',
                type: 'work',
            });
            setAlertVisible(true);

            // Update the timer state
            setTimeLeft(settings.workTime * 60);
            setIsWorkTime(true);
        }
        setIsActive(false);
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

    return (
        <>
            <Card className="relative overflow-hidden p-6 bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-900 dark:to-black border-2 border-opacity-20 border-primary shadow-lg"
                style={{ borderColor: 'var(--primary-color)' }}>
                <Waves
                    className="absolute inset-0 opacity-30"
                    lineColor="var(--primary-color)"
                    waveAmpX={50}
                    waveAmpY={30}
                    waveSpeedX={0.025}
                    waveSpeedY={0.015}
                    friction={0.95}
                    tension={0.02}
                />
                <div className="relative z-10 space-y-6">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold mb-2">{isWorkTime ? 'Work Time' : 'Break Time'}</h2>
                        <div className="text-6xl font-mono font-bold mb-4">{formatTime(timeLeft)}</div>
                        <div className="flex justify-center gap-4">
                            <Button
                                onClick={toggleTimer}
                                variant={isActive ? "destructive" : "default"}
                                size="lg"
                            >
                                {isActive ? 'Pause' : 'Start'}
                            </Button>
                            <Button onClick={resetTimer} variant="outline" size="lg">
                                Reset
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Work Duration</span>
                            <div className="flex items-center gap-2">
                                <Slider
                                    value={[settings.workTime]}
                                    onValueChange={(value) => updateSetting('workTime', value[0])}
                                    min={1}
                                    max={60}
                                    step={1}
                                    className={`w-32 ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={isActive}
                                />
                                <span className="text-sm font-medium">{settings.workTime} min</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Short Break</span>
                            <div className="flex items-center gap-2">
                                <Slider
                                    value={[settings.shortBreak]}
                                    onValueChange={(value) => updateSetting('shortBreak', value[0])}
                                    min={1}
                                    max={15}
                                    step={1}
                                    className={`w-32 ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={isActive}
                                />
                                <span className="text-sm font-medium">{settings.shortBreak} min</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Long Break</span>
                            <div className="flex items-center gap-2">
                                <Slider
                                    value={[settings.longBreak]}
                                    onValueChange={(value) => updateSetting('longBreak', value[0])}
                                    min={1}
                                    max={30}
                                    step={1}
                                    className={`w-32 ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={isActive}
                                />
                                <span className="text-sm font-medium">{settings.longBreak} min</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
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
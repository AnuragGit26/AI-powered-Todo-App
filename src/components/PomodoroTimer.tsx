import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { useToast } from '../hooks/use-toast';
import Waves from './ui/Waves';

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
    const { toast } = useToast();
    const [timeLeft, setTimeLeft] = useState(defaultSettings.workTime * 60);
    const [isActive, setIsActive] = useState(false);
    const [isWorkTime, setIsWorkTime] = useState(true);
    const [completedSessions, setCompletedSessions] = useState(0);
    const [settings, setSettings] = useState<PomodoroSettings>(defaultSettings);

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
            setCompletedSessions((prev) => prev + 1);
            const isLongBreak = completedSessions % settings.longBreakInterval === 0;
            setTimeLeft(isLongBreak ? settings.longBreak * 60 : settings.shortBreak * 60);
            setIsWorkTime(false);
            toast({
                title: 'Work Session Complete!',
                description: `Time for a ${isLongBreak ? 'long' : 'short'} break.`,
            });
        } else {
            setTimeLeft(settings.workTime * 60);
            setIsWorkTime(true);
            toast({
                title: 'Break Complete!',
                description: 'Time to get back to work.',
            });
        }
        setIsActive(false);
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

    return (
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
                                onValueChange={(value) => setSettings({ ...settings, workTime: value[0] })}
                                min={1}
                                max={60}
                                step={1}
                                className="w-32"
                            />
                            <span className="text-sm font-medium">{settings.workTime} min</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Short Break</span>
                        <div className="flex items-center gap-2">
                            <Slider
                                value={[settings.shortBreak]}
                                onValueChange={(value) => setSettings({ ...settings, shortBreak: value[0] })}
                                min={1}
                                max={15}
                                step={1}
                                className="w-32"
                            />
                            <span className="text-sm font-medium">{settings.shortBreak} min</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Long Break</span>
                        <div className="flex items-center gap-2">
                            <Slider
                                value={[settings.longBreak]}
                                onValueChange={(value) => setSettings({ ...settings, longBreak: value[0] })}
                                min={1}
                                max={30}
                                step={1}
                                className="w-32"
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
    );
}; 
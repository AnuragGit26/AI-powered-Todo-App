import React, { useState, useEffect } from 'react';
import { Button } from './button';
import {
    CheckCircle2,
    Coffee,
    Moon,
    Clock,
    X
} from 'lucide-react';

interface TimerAlertProps {
    title: string;
    message: string;
    type: 'work' | 'shortBreak' | 'longBreak';
    onClose: () => void;
    visible: boolean;
}

export const TimerAlert: React.FC<TimerAlertProps> = ({
    title,
    message,
    type,
    onClose,
    visible
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (visible) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible && !isVisible) return null;

    const getAlertConfig = () => {
        switch (type) {
            case 'work':
                return {
                    icon: <CheckCircle2 className="w-6 h-6 text-indigo-600" strokeWidth={2} />,
                    color: 'text-indigo-600',
                    background: 'bg-indigo-50 dark:bg-indigo-950/30',
                    border: 'border-indigo-100 dark:border-indigo-900/50',
                    accent: 'bg-indigo-600',
                    buttonClass: 'bg-indigo-600 hover:bg-indigo-700',
                    iconBackground: 'bg-indigo-100 dark:bg-indigo-900/30',
                    progressColor: 'bg-indigo-600'
                };
            case 'shortBreak':
                return {
                    icon: <Coffee className="w-6 h-6 text-emerald-600" strokeWidth={2} />,
                    color: 'text-emerald-600',
                    background: 'bg-emerald-50 dark:bg-emerald-950/30',
                    border: 'border-emerald-100 dark:border-emerald-900/50',
                    accent: 'bg-emerald-600',
                    buttonClass: 'bg-emerald-600 hover:bg-emerald-700',
                    iconBackground: 'bg-emerald-100 dark:bg-emerald-900/30',
                    progressColor: 'bg-emerald-600'
                };
            case 'longBreak':
                return {
                    icon: <Moon className="w-6 h-6 text-violet-600" strokeWidth={2} />,
                    color: 'text-violet-600',
                    background: 'bg-violet-50 dark:bg-violet-950/30',
                    border: 'border-violet-100 dark:border-violet-900/50',
                    accent: 'bg-violet-600',
                    buttonClass: 'bg-violet-600 hover:bg-violet-700',
                    iconBackground: 'bg-violet-100 dark:bg-violet-900/30',
                    progressColor: 'bg-violet-600'
                };
            default:
                return {
                    icon: <Clock className="w-6 h-6 text-gray-600" strokeWidth={2} />,
                    color: 'text-gray-600',
                    background: 'bg-gray-50 dark:bg-gray-950/30',
                    border: 'border-gray-100 dark:border-gray-900/50',
                    accent: 'bg-gray-600',
                    buttonClass: 'bg-gray-600 hover:bg-gray-700',
                    iconBackground: 'bg-gray-100 dark:bg-gray-900/30',
                    progressColor: 'bg-gray-600'
                };
        }
    };

    const config = getAlertConfig();

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/50 backdrop-blur-[5px] transition-opacity duration-300"
            style={{ opacity: visible ? 1 : 0 }}
            onClick={(e) => {
                // Close when clicking outside the modal
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className={`w-full max-w-sm ${config.background} border ${config.border} rounded-xl overflow-hidden shadow-xl`}
                style={{
                    transform: visible ? 'translateY(0)' : 'translateY(20px)',
                    opacity: visible ? 1 : 0,
                    transition: 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease',
                    boxShadow: '0 10px 35px -5px rgba(0, 0, 0, 0.1), 0 8px 15px -6px rgba(0, 0, 0, 0.05)'
                }}
            >
                {/* Top accent bar */}
                <div className={`h-1.5 w-full ${config.accent}`}></div>

                {/* Content */}
                <div className="p-6">
                    <div className="flex items-start">
                        {/* Icon */}
                        <div className={`rounded-full p-3 ${config.iconBackground} flex-shrink-0 mr-4`}>
                            {config.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h3 className={`text-lg font-semibold ${config.color} tracking-tight`}>
                                    {title}
                                </h3>
                                <button
                                    onClick={onClose}
                                    className="p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    aria-label="Close alert"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <p className="mt-1 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>

                    {/* Button Actions */}
                    <div className="mt-6">
                        <Button
                            onClick={onClose}
                            className={`w-full ${config.buttonClass} text-white shadow-sm hover:shadow transition-all`}
                        >
                            Continue
                        </Button>
                    </div>
                </div>

                {/* Progress bar animation for visual interest */}
                <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                    <div
                        className={`absolute inset-y-0 left-0 ${config.progressColor} animate-progress`}
                        style={{
                            animation: 'progress 2s ease-in-out forwards',
                            width: '0%'
                        }}
                    ></div>
                </div>

                <style jsx>{`
                    @keyframes progress {
                        0% { width: 0%; }
                        100% { width: 100%; }
                    }
                `}</style>
            </div>
        </div>
    );
}; 
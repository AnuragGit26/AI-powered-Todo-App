import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Plus, X, Clock, Calendar, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from '../lib/utils';
import { format, addHours, addDays, addWeeks } from 'date-fns';
import type { TaskReminder } from '../types';

interface TaskReminderManagerProps {
    reminders: TaskReminder[];
    onRemindersChange: (reminders: TaskReminder[]) => void;
    taskTitle?: string;
    dueDate?: Date | null;
    className?: string;
}

export const TaskReminderManager: React.FC<TaskReminderManagerProps> = ({
    reminders,
    onRemindersChange,
    taskTitle = 'Task',
    dueDate,
    className
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isAddingReminder, setIsAddingReminder] = useState(false);
    const [newReminderTime, setNewReminderTime] = useState<Date | null>(null);
    const [newReminderMessage, setNewReminderMessage] = useState('');
    const [quickReminderType, setQuickReminderType] = useState<string>('1-hour');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const quickReminderOptions = [
        { value: '1-hour', label: '1 hour before', hours: 1 },
        { value: '2-hours', label: '2 hours before', hours: 2 },
        { value: '1-day', label: '1 day before', days: 1 },
        { value: '1-week', label: '1 week before', days: 7 },
    ];

    const addQuickReminder = () => {
        if (!dueDate) return;

        const option = quickReminderOptions.find(opt => opt.value === quickReminderType);
        if (!option) return;

        let reminderTime: Date;
        if (option.hours) {
            reminderTime = addHours(dueDate, -option.hours);
        } else if (option.days) {
            reminderTime = addDays(dueDate, -option.days);
        } else {
            return;
        }

        // Don't create reminders in the past
        if (reminderTime <= new Date()) {
            return;
        }

        const newReminder: TaskReminder = {
            id: crypto.randomUUID(),
            taskId: '', // Will be set when task is created
            reminderTime,
            isActive: true,
            reminderType: 'due_date',
            message: `${option.label} due date`,
            createdAt: new Date()
        };

        onRemindersChange([...reminders, newReminder]);
    };

    const addCustomReminder = () => {
        if (!newReminderTime) return;

        // Don't create reminders in the past
        if (newReminderTime <= new Date()) {
            return;
        }

        const newReminder: TaskReminder = {
            id: crypto.randomUUID(),
            taskId: '', // Will be set when task is created
            reminderTime: newReminderTime,
            isActive: true,
            reminderType: 'custom',
            message: newReminderMessage || `Reminder for "${taskTitle}"`,
            createdAt: new Date()
        };

        onRemindersChange([...reminders, newReminder]);
        setIsAddingReminder(false);
        setNewReminderTime(null);
        setNewReminderMessage('');
    };

    const toggleReminder = (reminderId: string) => {
        const updatedReminders = reminders.map(reminder =>
            reminder.id === reminderId
                ? { ...reminder, isActive: !reminder.isActive }
                : reminder
        );
        onRemindersChange(updatedReminders);
    };

    const removeReminder = (reminderId: string) => {
        const updatedReminders = reminders.filter(reminder => reminder.id !== reminderId);
        onRemindersChange(updatedReminders);
    };

    const getReminderStatus = (reminder: TaskReminder) => {
        const now = new Date();
        const reminderTime = new Date(reminder.reminderTime);

        if (reminderTime <= now) {
            return { status: 'past', text: 'Past due', color: 'text-red-500' };
        }

        const diffHours = Math.floor((reminderTime.getTime() - now.getTime()) / (1000 * 60 * 60));
        if (diffHours < 24) {
            return { status: 'soon', text: `${diffHours}h`, color: 'text-orange-500' };
        }

        const diffDays = Math.floor(diffHours / 24);
        return { status: 'future', text: `${diffDays}d`, color: 'text-green-500' };
    };

    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Reminders ({reminders.length})
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(!isOpen)}
                    className="h-8 px-2"
                >
                    {isOpen ? (
                        <X className="h-4 w-4" />
                    ) : (
                        <Plus className="h-4 w-4" />
                    )}
                </Button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3"
                    >
                        {/* Quick Reminders */}
                        {dueDate && (
                            <Card className="border border-gray-200 dark:border-gray-700">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium">Quick Reminders</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="flex gap-2">
                                        <Select value={quickReminderType} onValueChange={setQuickReminderType}>
                                            <SelectTrigger className="flex-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {quickReminderOptions.map(option => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            size="sm"
                                            onClick={addQuickReminder}
                                            className="px-3"
                                        >
                                            Add
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Custom Reminder */}
                        <Card className="border border-gray-200 dark:border-gray-700">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Custom Reminder</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {!isAddingReminder ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsAddingReminder(true)}
                                        className="w-full"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Custom Reminder
                                    </Button>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <Label htmlFor="reminder-time">Reminder Time</Label>
                                            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        id="reminder-time"
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal",
                                                            !newReminderTime && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <Calendar className="mr-2 h-4 w-4" />
                                                        {newReminderTime ? format(newReminderTime, "PPP p") : "Select date & time"}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <CalendarComponent
                                                        mode="single"
                                                        selected={newReminderTime || undefined}
                                                        onSelect={(date) => {
                                                            if (date) {
                                                                // Set to current time if no time is selected
                                                                const now = new Date();
                                                                const selectedDate = new Date(date);
                                                                selectedDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
                                                                setNewReminderTime(selectedDate);
                                                            }
                                                            setIsCalendarOpen(false);
                                                        }}
                                                        disabled={(date) => date < new Date()}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div>
                                            <Label htmlFor="reminder-message">Message (optional)</Label>
                                            <Input
                                                id="reminder-message"
                                                value={newReminderMessage}
                                                onChange={(e) => setNewReminderMessage(e.target.value)}
                                                placeholder={`Reminder for "${taskTitle}"`}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={addCustomReminder}
                                                disabled={!newReminderTime}
                                                className="flex-1"
                                            >
                                                Add Reminder
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setIsAddingReminder(false);
                                                    setNewReminderTime(null);
                                                    setNewReminderMessage('');
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Existing Reminders */}
                        {reminders.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Scheduled Reminders</Label>
                                {reminders.map((reminder) => {
                                    const status = getReminderStatus(reminder);
                                    return (
                                        <motion.div
                                            key={reminder.id}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                <Switch
                                                    checked={reminder.isActive}
                                                    onCheckedChange={() => toggleReminder(reminder.id)}
                                                    size="sm"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-gray-500" />
                                                        <span className="text-sm font-medium">
                                                            {format(new Date(reminder.reminderTime), "MMM d, h:mm a")}
                                                        </span>
                                                        <span className={cn("text-xs px-2 py-1 rounded-full", status.color, "bg-gray-100 dark:bg-gray-700")}>
                                                            {status.text}
                                                        </span>
                                                    </div>
                                                    {reminder.message && (
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                                                            {reminder.message}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeReminder(reminder.id)}
                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TaskReminderManager;

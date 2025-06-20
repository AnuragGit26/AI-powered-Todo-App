import React, { useState } from 'react';
import "react-datepicker/dist/react-datepicker.css";
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, Repeat, ChevronDown, CalendarIcon } from 'lucide-react';
import { useTodoStore } from '../store/todoStore';
import { analyzeTodo } from '../services/gemini';
import type { Priority, Status, SubTodo, Todo, RecurrenceFrequency, RecurrenceConfig } from '../types';
import { createSubtask, createTask, getTaskById } from '../services/taskService';
import { useBillingUsage } from '../hooks/useBillingUsage';
import { Input } from "./ui/input.tsx";
import { format, startOfDay } from "date-fns";
import { Button } from "./ui/button.tsx";
import { Calendar } from "./ui/calendar.tsx";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./ui/popover.tsx";
import { cn } from "../lib/utils.ts";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "./ui/select.tsx";
import { Switch } from "./ui/switch.tsx";
import { Label } from "./ui/label.tsx";
import { Checkbox } from "./ui/checkbox.tsx";

const DAYS_OF_WEEK = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
];

const TodoForm: React.FC<{ parentId?: string, onSubmitSuccess?: () => void }> = ({ parentId, onSubmitSuccess }) => {
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [priority, setPriority] = useState<Priority>('medium');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [status, setStatus] = useState<Status>('Not Started');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>(null);
    const [recurrenceInterval, setRecurrenceInterval] = useState(1);
    const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | null>(null);
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [dayOfMonth, setDayOfMonth] = useState<number>(1);
    const [monthOfYear, setMonthOfYear] = useState<number>(1);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isEndDateCalendarOpen, setIsEndDateCalendarOpen] = useState(false);
    const [formError, setFormError] = useState<string>('');
    const { addTodo } = useTodoStore();
    const { trackUsage, canUseFeature } = useBillingUsage();

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

    const validateForm = (): boolean => {
        if (!title.trim()) {
            setFormError('Task title is required');
            announceToScreenReader('Error: Task title is required', 'assertive');
            return false;
        }

        if (isRecurring && !recurrenceFrequency) {
            setFormError('Please select a recurrence frequency');
            announceToScreenReader('Error: Please select a recurrence frequency', 'assertive');
            return false;
        }

        if (isRecurring && recurrenceFrequency === 'weekly' && selectedDays.length === 0) {
            setFormError('Please select at least one day for weekly recurrence');
            announceToScreenReader('Error: Please select at least one day for weekly recurrence', 'assertive');
            return false;
        }

        setFormError('');
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Check if user can create more tasks
        if (!trackUsage('maxTasks')) {
            return;
        }

        setIsAnalyzing(true);
        announceToScreenReader('Analyzing task with AI...');
        let analysis;

        // Check if user can use AI analysis
        if (canUseFeature('maxAiAnalysis')) {
            if (parentId) {
                const parentTask = getTaskById(parentId);
                analysis = await analyzeTodo(title, {
                    type: "subtask",
                    parentTitle: parentTask?.title || "Unknown",
                });
            } else {
                analysis = await analyzeTodo(title, { type: "task" });
            }
            // Track AI analysis usage
            trackUsage('maxAiAnalysis', false);
        } else {
            // Provide basic analysis without AI
            analysis = {
                category: "General",
                howTo: "Complete this task step by step",
                estimatedTime: "30 minutes",
                difficulty: "Medium",
                resources: "No specific resources required",
                potentialBlockers: "None identified",
                nextSteps: "Start working on the task"
            };
        }
        setIsAnalyzing(false);

        const recurrence: RecurrenceConfig | undefined = isRecurring ? {
            frequency: recurrenceFrequency,
            interval: recurrenceInterval,
            endDate: recurrenceEndDate,
            daysOfWeek: recurrenceFrequency === 'weekly' ? selectedDays : undefined,
            dayOfMonth: recurrenceFrequency === 'monthly' ? dayOfMonth : undefined,
            monthOfYear: recurrenceFrequency === 'yearly' ? monthOfYear : undefined,
        } : undefined;

        const newTodo: Todo = {
            id: crypto.randomUUID(),
            title: title.trim(),
            completed: false,
            dueDate,
            status,
            priority,
            analysis,
            estimatedTime: analysis.estimatedTime,
            createdAt: new Date(),
            userId: localStorage.getItem('userId') || '1',
            recurrence,
            lastRecurrenceDate: null,
        };

        if (parentId) {
            const parentTask = getTaskById(parentId);
            if (parentTask && parentTask.id === parentId) {
                const newSubtask: SubTodo = {
                    ...newTodo,
                    parentId,
                };
                useTodoStore.getState().createSubtaskStore(parentId, newSubtask);
                await createSubtask(newSubtask);
                announceToScreenReader(`Subtask "${title.trim()}" has been created`);
            } else {
                console.error("Parent task not found or ID mismatch");
            }
        } else {
            addTodo(newTodo);
            await createTask(newTodo);
            announceToScreenReader(`Task "${title.trim()}" has been created`);
        }

        // Reset form
        setTitle('');
        setDueDate(null);
        setPriority('medium');
        setStatus('Not Started');
        setIsRecurring(false);
        setRecurrenceFrequency(null);
        setRecurrenceInterval(1);
        setRecurrenceEndDate(null);
        setSelectedDays([]);
        setDayOfMonth(1);
        setMonthOfYear(1);
        setFormError('');

        // Call the onSubmitSuccess callback if provided
        if (onSubmitSuccess) {
            onSubmitSuccess();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && title.trim()) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    return (
        <motion.form
            onSubmit={handleSubmit}
            className={`mb-1 sm:mb-2 space-y-4 ${parentId ? 'ml-2 sm:ml-4 md:ml-8 mt-2' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            role="form"
            aria-label={parentId ? "Create new subtask" : "Create new task"}
            noValidate
        >
            {formError && (
                <div
                    role="alert"
                    aria-live="assertive"
                    className="text-red-600 text-sm font-medium p-2 bg-red-50 border border-red-200 rounded-md"
                >
                    {formError}
                </div>
            )}

            <fieldset className="flex flex-col gap-2 bg-white/80 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-600 backdrop-blur rounded-lg p-3 sm:p-4 transition-all duration-300 animate-fadeIn">
                <legend className="sr-only">
                    {parentId ? "Subtask details" : "Task details"}
                </legend>

                <div className="relative flex-auto">
                    <label htmlFor="task-title" className="sr-only">
                        {parentId ? "Subtask title" : "Task title"}
                    </label>
                    <textarea
                        id="task-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={parentId ? "Add a subtask..." : "Add a new task..."}
                        className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 backdrop-blur rounded-lg min-h-[60px] resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        onKeyDown={handleKeyDown}
                        aria-required="true"
                        aria-describedby="task-title-help"
                        aria-invalid={formError.includes('title') ? 'true' : 'false'}
                    />
                    <div id="task-title-help" className="sr-only">
                        Press Enter to submit, or Shift+Enter for a new line
                    </div>
                    <AnimatePresence>
                        {isAnalyzing && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute top-2.5 right-1"
                                role="status"
                                aria-label="Analyzing task with AI"
                            >
                                <Loader2 className="left-3 w-5 h-5 text-blue-500 animate-spin" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2" role="group" aria-label="Task settings">
                    <div>
                        <Label htmlFor="due-date" className="sr-only">Due date</Label>
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    id="due-date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 backdrop-blur rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                                        !dueDate && "text-muted-foreground"
                                    )}
                                    aria-haspopup="dialog"
                                    aria-expanded={isCalendarOpen}
                                    aria-describedby="due-date-description"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start" role="dialog" aria-label="Select due date">
                                <Calendar
                                    mode="single"
                                    selected={dueDate || undefined}
                                    onSelect={(date: Date | undefined) => {
                                        setDueDate(date || null);
                                        setIsCalendarOpen(false);
                                        if (date) {
                                            announceToScreenReader(`Due date set to ${format(date, "PPP")}`);
                                        }
                                    }}
                                    initialFocus
                                    disabled={(date) =>
                                        date < startOfDay(new Date()) || date < new Date("1900-01-01")
                                    }
                                />
                            </PopoverContent>
                        </Popover>
                        <div id="due-date-description" className="sr-only">
                            Optional: Set a due date for this task
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="priority-select" className="sr-only">Priority level</Label>
                        <Select
                            value={priority}
                            onValueChange={(e) => {
                                setPriority(e as Priority);
                                announceToScreenReader(`Priority set to ${e}`);
                            }}
                        >
                            <SelectTrigger
                                id="priority-select"
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 backdrop-blur rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                aria-describedby="priority-description"
                            >
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent role="listbox" aria-label="Priority options">
                                <SelectGroup>
                                    <SelectLabel>Priority</SelectLabel>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <div id="priority-description" className="sr-only">
                            Set the priority level for this task
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="status-select" className="sr-only">Task status</Label>
                        <Select
                            value={status}
                            onValueChange={(e) => {
                                setStatus(e as Status);
                                announceToScreenReader(`Status set to ${e}`);
                            }}
                        >
                            <SelectTrigger
                                id="status-select"
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 backdrop-blur rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                aria-describedby="status-description"
                            >
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent role="listbox" aria-label="Status options">
                                <SelectGroup>
                                    <SelectLabel>Status</SelectLabel>
                                    <SelectItem value="Not Started">Not Started</SelectItem>
                                    <SelectItem value="In progress">In Progress</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <div id="status-description" className="sr-only">
                            Set the current status of this task
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg flex items-center justify-center transition duration-200 ease-in-out shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        type="submit"
                        disabled={isAnalyzing}
                        aria-label={parentId ? "Create subtask" : "Create task"}
                        aria-describedby="submit-button-help"
                    >
                        {isAnalyzing ? (
                            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                        ) : (
                            <Plus className="w-5 h-5" aria-hidden="true" />
                        )}
                    </motion.button>
                    <div id="submit-button-help" className="sr-only">
                        Click to create the task with the current settings
                    </div>
                </div>

                {/* Recurrence Section */}
                <fieldset className="w-full border rounded-lg p-2 transition-all">
                    <legend className="sr-only">Recurrence settings</legend>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="recurrence-toggle"
                                checked={isRecurring}
                                onCheckedChange={(checked) => {
                                    setIsRecurring(checked);
                                    announceToScreenReader(checked ? 'Recurrence enabled' : 'Recurrence disabled');
                                }}
                                aria-describedby="recurrence-description"
                            />
                            <Label htmlFor="recurrence-toggle" className="cursor-pointer">
                                {isRecurring ? "Recurring Task" : "Make recurring?"}
                            </Label>
                        </div>
                        <div id="recurrence-description" className="sr-only">
                            Toggle to make this task repeat on a schedule
                        </div>
                        {isRecurring && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsRecurring(!isRecurring)}
                                className="px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                                aria-label="Toggle recurrence settings"
                            >
                                <ChevronDown className="h-4 w-4" aria-hidden="true" />
                            </Button>
                        )}
                    </div>

                    {isRecurring && (
                        <div className="mt-3 space-y-3" role="group" aria-label="Recurrence settings">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="recurrence-frequency">Repeat</Label>
                                    <Select
                                        value={recurrenceFrequency || undefined}
                                        onValueChange={(value) => {
                                            setRecurrenceFrequency(value as RecurrenceFrequency);
                                            announceToScreenReader(`Recurrence frequency set to ${value}`);
                                        }}
                                    >
                                        <SelectTrigger
                                            id="recurrence-frequency"
                                            className="w-full mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            aria-describedby="frequency-help"
                                        >
                                            <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
                                        <SelectContent role="listbox" aria-label="Recurrence frequency options">
                                            <SelectItem value="daily">Daily</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="yearly">Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div id="frequency-help" className="sr-only">
                                        Choose how often this task should repeat
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="recurrence-interval">Every</Label>
                                    <div className="flex items-center mt-1">
                                        <Input
                                            id="recurrence-interval"
                                            type="number"
                                            min="1"
                                            value={recurrenceInterval}
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value) || 1;
                                                setRecurrenceInterval(value);
                                                announceToScreenReader(`Interval set to ${value}`);
                                            }}
                                            className="w-20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            aria-describedby="interval-help"
                                        />
                                        <span className="ml-2" id="interval-label">
                                            {recurrenceFrequency === 'daily' && (recurrenceInterval > 1 ? 'days' : 'day')}
                                            {recurrenceFrequency === 'weekly' && (recurrenceInterval > 1 ? 'weeks' : 'week')}
                                            {recurrenceFrequency === 'monthly' && (recurrenceInterval > 1 ? 'months' : 'month')}
                                            {recurrenceFrequency === 'yearly' && (recurrenceInterval > 1 ? 'years' : 'year')}
                                        </span>
                                    </div>
                                    <div id="interval-help" className="sr-only">
                                        Set the interval between repetitions
                                    </div>
                                </div>
                            </div>

                            {recurrenceFrequency === 'weekly' && (
                                <fieldset>
                                    <legend className="block mb-2">On these days</legend>
                                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2" role="group" aria-label="Days of the week">
                                        {DAYS_OF_WEEK.map((day) => (
                                            <div key={day.value} className="flex items-center space-x-1">
                                                <Checkbox
                                                    id={`day-${day.value}`}
                                                    checked={selectedDays.includes(day.value)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedDays([...selectedDays, day.value]);
                                                            announceToScreenReader(`${day.label} selected`);
                                                        } else {
                                                            setSelectedDays(selectedDays.filter(d => d !== day.value));
                                                            announceToScreenReader(`${day.label} deselected`);
                                                        }
                                                    }}
                                                    aria-describedby={`day-${day.value}-label`}
                                                />
                                                <Label
                                                    id={`day-${day.value}-label`}
                                                    htmlFor={`day-${day.value}`}
                                                    className="cursor-pointer text-sm"
                                                >
                                                    {day.label.substring(0, 3)}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </fieldset>
                            )}

                            {recurrenceFrequency === 'monthly' && (
                                <div>
                                    <Label htmlFor="day-of-month">Day of month</Label>
                                    <Input
                                        id="day-of-month"
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={dayOfMonth}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value) || 1;
                                            setDayOfMonth(value);
                                            announceToScreenReader(`Day of month set to ${value}`);
                                        }}
                                        className="w-full mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        aria-describedby="day-of-month-help"
                                    />
                                    <div id="day-of-month-help" className="sr-only">
                                        Choose which day of the month this task should repeat
                                    </div>
                                </div>
                            )}

                            {recurrenceFrequency === 'yearly' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="month-of-year">Month</Label>
                                        <Select
                                            value={monthOfYear.toString()}
                                            onValueChange={(value) => {
                                                setMonthOfYear(parseInt(value));
                                                const monthName = new Date(2000, parseInt(value) - 1).toLocaleString('default', { month: 'long' });
                                                announceToScreenReader(`Month set to ${monthName}`);
                                            }}
                                        >
                                            <SelectTrigger
                                                id="month-of-year"
                                                className="w-full mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                aria-describedby="month-help"
                                            >
                                                <SelectValue placeholder="Select month" />
                                            </SelectTrigger>
                                            <SelectContent role="listbox" aria-label="Month options">
                                                {[...Array(12)].map((_, i) => (
                                                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                                                        {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div id="month-help" className="sr-only">
                                            Choose which month this task should repeat
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="yearly-day-of-month">Day</Label>
                                        <Input
                                            id="yearly-day-of-month"
                                            type="number"
                                            min="1"
                                            max="31"
                                            value={dayOfMonth}
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value) || 1;
                                                setDayOfMonth(value);
                                                announceToScreenReader(`Day set to ${value}`);
                                            }}
                                            className="w-full mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            aria-describedby="yearly-day-help"
                                        />
                                        <div id="yearly-day-help" className="sr-only">
                                            Choose which day of the month for yearly recurrence
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <Label className="flex items-center space-x-2 mb-2">
                                    <span>End date</span>
                                    <span className="text-xs text-gray-500">(optional)</span>
                                </Label>
                                <Popover open={isEndDateCalendarOpen} onOpenChange={setIsEndDateCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                                                !recurrenceEndDate && "text-muted-foreground"
                                            )}
                                            aria-haspopup="dialog"
                                            aria-expanded={isEndDateCalendarOpen}
                                            aria-describedby="end-date-help"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                                            {recurrenceEndDate ? format(recurrenceEndDate, "PPP") : <span>No end date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start" role="dialog" aria-label="Select recurrence end date">
                                        <div className="p-2 flex justify-between border-b">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setRecurrenceEndDate(null);
                                                    setIsEndDateCalendarOpen(false);
                                                    announceToScreenReader('Recurrence end date cleared');
                                                }}
                                                aria-label="Clear end date"
                                            >
                                                Clear
                                            </Button>
                                        </div>
                                        <Calendar
                                            mode="single"
                                            selected={recurrenceEndDate || undefined}
                                            onSelect={(date: Date | undefined) => {
                                                setRecurrenceEndDate(date || null);
                                                setIsEndDateCalendarOpen(false);
                                                if (date) {
                                                    announceToScreenReader(`Recurrence end date set to ${format(date, "PPP")}`);
                                                }
                                            }}
                                            initialFocus
                                            disabled={(date) =>
                                                date < new Date() || date < new Date("1900-01-01")
                                            }
                                        />
                                    </PopoverContent>
                                </Popover>
                                <div id="end-date-help" className="sr-only">
                                    Optional: Set when the recurrence should stop
                                </div>
                            </div>
                        </div>
                    )}
                </fieldset>
            </fieldset>
        </motion.form>
    );
};

export default TodoForm;
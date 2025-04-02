import React, { useState } from 'react';
import "react-datepicker/dist/react-datepicker.css";
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, Repeat } from 'lucide-react';
import { useTodoStore } from '../store/todoStore';
import { analyzeTodo } from '../services/gemini';
import type { Priority, Status, SubTodo, Todo, RecurrenceFrequency, RecurrenceConfig } from '../types';
import { createSubtask, createTask, getTaskById } from '../services/taskService';
import { Input } from "./ui/input.tsx";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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

const TodoForm: React.FC<{ parentId?: string }> = ({ parentId }) => {
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
    const { addTodo } = useTodoStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsAnalyzing(true);
        let analysis;
        if (parentId) {
            const parentTask = getTaskById(parentId);
            analysis = await analyzeTodo(title, {
                type: "subtask",
                parentTitle: parentTask?.title || "Unknown",
            });
        } else {
            analysis = await analyzeTodo(title, { type: "task" });
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
            } else {
                console.error("Parent task not found or ID mismatch");
            }
        } else {
            addTodo(newTodo);
            await createTask(newTodo);
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
    };

    return (
        <motion.form
            onSubmit={handleSubmit}
            className={`mb-1 sm:mb-2 space-y-4 ${parentId ? 'ml-2 sm:ml-4 md:ml-8 mt-2' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex flex-col gap-2 bg-white/80 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-600 backdrop-blur rounded-lg p-3 sm:p-4 transition-all duration-300 animate-fadeIn">
                <div className="relative flex-auto">
                    <Input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={parentId ? "Add a subtask..." : "Add a new task..."}
                        className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 backdrop-blur rounded-lg"
                    />
                    <AnimatePresence>
                        {isAnalyzing && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute top-2.5 right-1"
                            >
                                <Loader2 className="left-3 w-5 h-5 text-blue-500 animate-spin" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 backdrop-blur rounded-lg",
                                    !dueDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={dueDate || undefined}
                                onSelect={(date: Date | undefined) => setDueDate(date || null)}
                                initialFocus
                                disabled={(date) =>
                                    date < new Date() || date < new Date("1900-01-01")
                                }
                            />
                        </PopoverContent>
                    </Popover>
                    <Select
                        value={priority}
                        onValueChange={(e) => setPriority(e as Priority)}>
                        <SelectTrigger className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 backdrop-blur rounded-lg">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Priority</SelectLabel>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <Select
                        value={status}
                        onValueChange={(e) => setStatus(e as Status)}>
                        <SelectTrigger className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 backdrop-blur rounded-lg">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Status</SelectLabel>
                                <SelectItem value="Not Started">Not Started</SelectItem>
                                <SelectItem value="In progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg flex items-center justify-center transition duration-200 ease-in-out shadow-sm"
                        type="submit"
                    >
                        <Plus className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>
        </motion.form>
    );
};

export default TodoForm;
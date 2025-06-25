import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Book,
    Check,
    ChevronDown,
    Clock,
    Edit3,
    ExternalLink,
    FileText,
    HelpCircle,
    Loader2,
    MapPin,
    Minus,
    Plus,
    Repeat,
    Search,
    Tag,
    Trash2,
    Wrench,
    AlertCircle,
    Brain,
    Target,
    Zap,
    Users,
    TrendingUp,
    RefreshCw
} from "lucide-react";
import { useTodoStore } from "../store/todoStore";
import { Todo } from "../types";
import { ConfettiSideCannons } from "./ui/ConfettiSideCannons.ts";
import { analyzeTodo } from "../services/gemini.ts";
import { createNextRecurrence, deleteSubtask, deleteTask, updateSubtask, updateTask } from "../services/taskService";
import { Label } from "./ui/label.tsx";
import { Input } from "./ui/input.tsx";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select.tsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip.tsx";
import TodoForm from "./TodoForm";
import type { Priority, Status } from "../types";
import useDebounce from "../hooks/useDebounce.ts";
import { getUserRegion } from "../hooks/getUserRegion.ts";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { useAIPriority } from "../hooks/useAIPriority";


const TodoItem: React.FC<{ todo: Todo; level?: number }> = React.memo(({ todo, level = 0 }) => {
    const { removeTodo, updateTodo, deleteSubtaskStore, updateSubtaskStore, calculatePriorityScore } = useTodoStore();
    const [expandedInsights, setExpandedInsights] = useState<string[]>([]);
    const [showSubtaskForm, setShowSubtaskForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(todo.title);
    const [isHovered, setIsHovered] = useState(false);
    const [editedDueDate, setEditedDueDate] = useState(todo.dueDate ? new Date(todo.dueDate) : null);
    const [editedPriority, setEditedPriority] = useState(todo.priority);
    const [editedStatus, setEditedStatus] = useState(todo.status);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [priorityScoreLoading, setPriorityScoreLoading] = useState(false);


    const renderDueDate = (dueDate: Date | string | null) => {
        if (!dueDate) return null;
        const parsedDate = dueDate instanceof Date ? dueDate : new Date(dueDate);
        if (isNaN(parsedDate.getTime())) return null;
        const now = new Date();
        if (parsedDate < now) {
            const content = isHovered ? "Crossed Due Date" : parsedDate.toLocaleDateString();
            return <span className="text-red-500">{content}</span>;
        } else {
            const timeLeft = parsedDate.getTime() - now.getTime();
            const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
            return <span className="text-left">{`${daysLeft} days left`}</span>;
        }
    };

    const handleCalculatePriorityScore = async () => {
        setPriorityScoreLoading(true);
        try {
            await calculatePriorityScore(todo.id);
        } catch (error) {
            console.error('Error calculating priority score:', error);
        } finally {
            setPriorityScoreLoading(false);
        }
    };

    const renderPriorityScore = () => {
        if (!todo.priorityScore) {
            return (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCalculatePriorityScore}
                    disabled={priorityScoreLoading}
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700/50 rounded-lg hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 transition-all duration-200"
                >
                    {priorityScoreLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    ) : (
                        <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    )}
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                        {priorityScoreLoading ? 'Calculating...' : 'Get AI Priority Score'}
                    </span>
                </motion.button>
            );
        }

        const score = todo.priorityScore;
        const isStale = new Date().getTime() - new Date(score.lastUpdated).getTime() > 3600000; // 1 hour

        const getScoreColor = (overall: number) => {
            if (overall >= 80) return 'from-red-500 to-pink-600';
            if (overall >= 60) return 'from-orange-500 to-red-500';
            if (overall >= 40) return 'from-yellow-500 to-orange-500';
            if (overall >= 20) return 'from-green-500 to-yellow-500';
            return 'from-gray-400 to-green-500';
        };

        const getScoreLabel = (overall: number) => {
            if (overall >= 80) return 'Critical';
            if (overall >= 60) return 'High';
            if (overall >= 40) return 'Medium';
            if (overall >= 20) return 'Low';
            return 'Minimal';
        };

        return (
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`px-3 py-1.5 bg-gradient-to-r ${getScoreColor(score.overall)} text-white rounded-lg shadow-sm`}>
                            <div className="flex items-center gap-1.5">
                                <Brain className="w-4 h-4" />
                                <span className="text-sm font-bold">{score.overall}</span>
                                <span className="text-xs opacity-90">{getScoreLabel(score.overall)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>Confidence: {score.confidence}%</span>
                            {isStale && (
                                <button
                                    onClick={handleCalculatePriorityScore}
                                    disabled={priorityScoreLoading}
                                    className="ml-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    title="Score is older than 1 hour - click to refresh"
                                >
                                    <RefreshCw className={`w-3 h-3 ${priorityScoreLoading ? 'animate-spin' : ''}`} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <Target className="w-3 h-3 text-blue-600" />
                        <span className="text-blue-700 dark:text-blue-300">Impact: {score.impactScore}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded">
                        <Zap className="w-3 h-3 text-green-600" />
                        <span className="text-green-700 dark:text-green-300">Effort: {score.effortScore}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded">
                        <Clock className="w-3 h-3 text-red-600" />
                        <span className="text-red-700 dark:text-red-300">Urgency: {score.urgencyScore}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded">
                        <Users className="w-3 h-3 text-purple-600" />
                        <span className="text-purple-700 dark:text-purple-300">Deps: {score.dependencyScore}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 dark:bg-orange-900/20 rounded">
                        <TrendingUp className="w-3 h-3 text-orange-600" />
                        <span className="text-orange-700 dark:text-orange-300">Load: {score.workloadScore}</span>
                    </div>
                </div>
            </div>
        );
    };

    const toggleInsights = (id: string) => {
        setExpandedInsights((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const handleRemove = async (id: string) => {
        if (todo.parentId) {
            deleteSubtaskStore(todo.parentId, id);
            await deleteSubtask(id);
        } else {
            removeTodo(id);
            await deleteTask(id);
        }
        setShowDeleteConfirm(false);
    };

    const toggleStatus = () => {
        if (todo.completed) return;
        const newStatus = todo.status === "Not Started" ? "In progress" : "Not Started";
        if (todo.parentId) {
            useTodoStore.getState().updateSubtaskStore(todo.parentId, todo.id, { status: newStatus });
            updateSubtask(todo.id, { status: newStatus });
        } else {
            updateTodo(todo.id, { status: newStatus });
            updateTask(todo.id, { status: newStatus });
        }
    };

    const getStatusClasses = (status: string) => {
        if (status === "Not Started") {
            return `cursor-pointer text-sm font-semibold bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-100 text-center rounded-full px-2 sm:px-3 py-1 shadow-sm border border-gray-300 dark:border-gray-500`;
        } else if (status === "In progress") {
            return `cursor-pointer text-sm font-semibold theme-secondary-bg text-white text-center rounded-full px-2 sm:px-3 py-1 shadow-sm`;
        } else if (status === "Completed") {
            return `cursor-pointer text-sm font-semibold theme-accent-bg text-white text-center rounded-full px-2 sm:px-3 py-1 shadow-sm`;
        }
        return `cursor-pointer text-sm font-semibold text-center rounded-full px-2 sm:px-3 py-1 shadow-sm`;
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high":
                return "text-white bg-gradient-to-r from-red-500 to-pink-500 dark:from-red-600 dark:to-pink-600 cursor-pointer text-sm font-semibold text-center rounded-full px-2 sm:px-3 py-1 shadow-sm";
            case "medium":
                return "text-gray-800 dark:text-gray-100 bg-gradient-to-r from-amber-300 to-yellow-400 dark:from-amber-500 dark:to-yellow-600 cursor-pointer text-sm font-semibold text-center rounded-full px-2 sm:px-3 py-1 shadow-sm";
            case "low":
                return "text-gray-800 dark:text-white theme-accent-bg cursor-pointer text-sm font-semibold text-center rounded-full px-2 sm:px-3 py-1 shadow-sm";
            default:
                return "text-gray-500";
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const getParentTitle = (parentId: string): string => {
        const todos = useTodoStore.getState().todos;
        const parentTask = todos.find((t) => t.id === parentId);
        return parentTask ? parentTask.title : "Unknown";
    };

    const handleSave = async () => {
        setAnalysisLoading(true);
        let region = "IN";
        try {
            region = await getUserRegion().then(() => region);
        } catch (error) {
            console.error("Error getting geolocation:", error);
        }
        const analysis = todo.parentId
            ? await analyzeTodo(editedTitle, {
                type: "subtask",
                parentTitle: getParentTitle(todo.parentId),
                region: region,
            })
            : await analyzeTodo(editedTitle, { type: "task", region: region });

        if (todo.parentId) {
            updateSubtaskStore(todo.parentId, todo.id, {
                title: editedTitle,
                analysis,
                dueDate: editedDueDate,
                priority: editedPriority,
                status: editedStatus,
                estimatedTime: analysis.estimatedTime,
            });
            await updateSubtask(todo.id, {
                title: editedTitle,
                analysis,
                dueDate: editedDueDate,
                priority: editedPriority,
                status: editedStatus,
                estimatedTime: analysis.estimatedTime,
            });
        } else {
            updateTodo(todo.id, {
                title: editedTitle,
                analysis,
                dueDate: editedDueDate,
                priority: editedPriority,
                status: editedStatus,
                estimatedTime: analysis.estimatedTime,
            });
            await updateTask(todo.id, {
                title: editedTitle,
                analysis,
                dueDate: editedDueDate,
                priority: editedPriority,
                status: editedStatus,
                estimatedTime: analysis.estimatedTime,
            });
        }
        setAnalysisLoading(false);
        setIsEditing(false);
    };

    const handleTodoCompletion = async (todo: Todo) => {
        const updatedCompleted = !todo.completed;
        const newStatus: Status = updatedCompleted ? "Completed" : "In progress";

        // If completing a task with recurrence, create the next occurrence
        if (updatedCompleted && todo.recurrence && !todo.parentId) {
            await createNextRecurrence(todo);
        }

        const updates: Partial<Todo> = {
            completed: updatedCompleted,
            status: newStatus,
            completedAt: updatedCompleted ? new Date() : null,
        };

        if (todo.parentId) {
            // Update in store
            useTodoStore.getState().updateSubtaskStore(todo.parentId, todo.id, updates);
            // Update in database
            try {
                await updateSubtask(todo.id, updates);
            } catch (error) {
                console.error("Error updating subtask:", error);
            }
        } else {
            // Update in store
            updateTodo(todo.id, updates);
            // Update in database
            try {
                await updateTask(todo.id, updates);
            } catch (error) {
                console.error("Error updating task:", error);
            }
        }
    };

    const prevCompletedRef = useRef(todo.completed);
    useEffect(() => {
        if (!prevCompletedRef.current && todo.completed) {
            ConfettiSideCannons();
        }
        prevCompletedRef.current = todo.completed;
    }, [todo.completed]);

    const renderRecurrenceInfo = () => {
        if (!todo.recurrence) return null;

        const frequency = todo.recurrence.frequency;
        const interval = todo.recurrence.interval;
        let text = '';

        switch (frequency) {
            case 'daily':
                text = `Every ${interval} day${interval > 1 ? 's' : ''}`;
                break;
            case 'weekly':
                if (todo.recurrence.daysOfWeek && todo.recurrence.daysOfWeek.length > 0) {
                    const days = todo.recurrence.daysOfWeek
                        .map(day => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day])
                        .join(', ');
                    text = `Every ${interval} week${interval > 1 ? 's' : ''} on ${days}`;
                } else {
                    text = `Every ${interval} week${interval > 1 ? 's' : ''}`;
                }
                break;
            case 'monthly':
                if (todo.recurrence.dayOfMonth) {
                    text = `Every ${interval} month${interval > 1 ? 's' : ''} on day ${todo.recurrence.dayOfMonth}`;
                } else {
                    text = `Every ${interval} month${interval > 1 ? 's' : ''}`;
                }
                break;
            case 'yearly':
                if (todo.recurrence.monthOfYear) {
                    const month = new Date(2000, todo.recurrence.monthOfYear - 1).toLocaleString('default', { month: 'long' });
                    text = `Every ${interval} year${interval > 1 ? 's' : ''} in ${month}`;
                    if (todo.recurrence.dayOfMonth) {
                        text += ` on day ${todo.recurrence.dayOfMonth}`;
                    }
                } else {
                    text = `Every ${interval} year${interval > 1 ? 's' : ''}`;
                }
                break;
        }

        if (todo.recurrence.endDate) {
            text += ` until ${new Date(todo.recurrence.endDate).toLocaleDateString()}`;
        }

        return (
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Repeat className="h-4 w-4 mr-1" />
                <span>{text}</span>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className={`task-item p-2 sm:p-4 backdrop-blur-sm bg-white dark:glass-card rounded-xl shadow-sm hover:shadow-md transition-all ${level > 0 ? "ml-2 sm:ml-4 md:ml-8 mt-2" : "mb-4"
                } ${todo.completed ? "border-l-4 border-l-emerald-500" : "hover:border-l-4 hover:border-l-blue-500"}`}
        >
            {/* Row 1: Checkbox and Title */}
            <div className="flex items-center w-full mb-2 sm:mb-4">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleTodoCompletion(todo)}
                    className={`p-2 sm:p-3 rounded-full ${todo.completed
                        ? "bg-gradient-to-r from-emerald-400 to-teal-500 shadow-md"
                        : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                        } mr-2 sm:mr-4 shadow-sm flex-shrink-0 transition-all duration-200`}
                >
                    <Check
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${todo.completed ? "text-white" : "text-gray-500 dark:text-gray-400"
                            }`}
                    />
                </motion.button>
                {isEditing ? (
                    <textarea
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onBlur={handleSave}
                        className="w-full p-3 text-lg border rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[80px] resize-y"
                        placeholder="Enter task description..."
                    />
                ) : (
                    <div className="relative group flex-1 min-w-0">
                        <p className={`text-base sm:text-lg md:text-xl ${todo.completed ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-white"} break-words font-medium overflow-hidden text-ellipsis ${todo.title.length > 80 ? "line-clamp-2" : ""}`}>
                            {todo.title}
                        </p>
                        {todo.title.length > 80 && (
                            <div className="absolute z-10 left-0 top-full mt-1 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-full max-w-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                                <p className="text-gray-800 dark:text-white font-medium">{todo.title}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Edit and Delete buttons in right corner */}
                {!isEditing && (
                    <div className="flex ml-2 sm:ml-auto gap-1 sm:gap-2 task-actions flex-shrink-0">
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: "rgb(219 234 254)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleEdit}
                            className="flex items-center justify-center p-1.5 sm:p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-all duration-200 shadow-sm hover:shadow border border-blue-100 dark:border-blue-800/30"
                        >
                            <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: "rgb(254 226 226)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center justify-center p-1.5 sm:p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg transition-all duration-200 shadow-sm hover:shadow border border-red-100 dark:border-red-800/30"
                        >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </motion.button>
                    </div>
                )}

                {isEditing && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSave}
                        disabled={analysisLoading}
                        className="flex items-center gap-1 ml-2 px-4 py-2 text-white theme-accent-bg rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                        <Check className="w-4 h-4" />
                        <span className="font-medium">Save</span>
                    </motion.button>
                )}
            </div>

            {!isEditing && (
                <>
                    {/* Row 2: Priority, Time left, Status */}
                    <div className="flex flex-wrap items-center justify-between rounded-lg bg-gray-50/80 dark:bg-gray-700/70 backdrop-blur-sm border border-gray-100 dark:border-gray-600 transition-all duration-200 p-1.5 sm:p-2 gap-1 mb-2">
                        <div className="flex-1 min-w-[80px] flex items-center justify-center">
                            <span className={`${getPriorityColor(todo.priority)} min-w-16 text-center text-xs sm:text-sm`}>
                                {todo.priority ? todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1) : ""}
                            </span>
                        </div>

                        <div className="flex-1 min-w-[100px] flex items-center justify-center">
                            {todo.dueDate && (
                                <p
                                    onMouseEnter={() => setIsHovered(true)}
                                    onMouseLeave={() => setIsHovered(false)}
                                    className={`transition-colors duration-200 text-center border rounded-lg py-1 px-1.5 sm:px-2 text-xs sm:text-sm ${renderDueDate(todo.dueDate)?.toString().includes("days left")
                                        ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-700"
                                        : "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-100 dark:border-red-700"
                                        }`}
                                >
                                    {renderDueDate(todo.dueDate)}
                                </p>
                            )}
                        </div>

                        <div className="flex-1 min-w-[90px] flex items-center justify-center">
                            <span onClick={toggleStatus} className={`task-status ${getStatusClasses(todo.status)} text-xs sm:text-sm inline-block`}>
                                {todo.status}
                            </span>
                        </div>
                    </div>

                    {/* Row 3: Recurrence Info */}
                    {todo.recurrence && (
                        <div className="flex items-center justify-between rounded-lg bg-gray-50/80 dark:bg-gray-700/70 backdrop-blur-sm border border-gray-100 dark:border-gray-600 transition-all duration-200 p-1.5 sm:p-2">
                            <div className="flex-1 flex items-center justify-center text-xs sm:text-sm">
                                {renderRecurrenceInfo()}
                            </div>
                        </div>
                    )}

                    {/* Row 3.5: AI Priority Score */}
                    {!todo.completed && (
                        <div className="mt-2">
                            {renderPriorityScore()}
                        </div>
                    )}

                    {/* Row 4: Insights, Subtask, Time buttons */}
                    <div className="flex flex-wrap items-center justify-between rounded-lg bg-gray-50/80 dark:bg-gray-700/70 backdrop-blur-sm border border-gray-100 dark:border-gray-600 transition-all duration-200 p-1.5 sm:p-2 mt-2 gap-1.5">
                        <div className="flex-1 min-w-[100px] flex items-center justify-center">
                            <button
                                onClick={() => toggleInsights(todo.id)}
                                className="flex items-center gap-1 text-indigo-700 dark:text-indigo-200 hover:text-indigo-900 dark:hover:text-indigo-100 px-2 sm:px-3 py-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-900/70 transition-all duration-200 shadow-sm text-xs sm:text-sm"
                            >
                                {expandedInsights.includes(todo.id) ? (
                                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                                ) : (
                                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 transform -rotate-90" />
                                )}
                                <span>Insights</span>
                            </button>
                        </div>

                        <div className="flex-1 min-w-[100px] flex items-center justify-center">
                            <button
                                onClick={() => setShowSubtaskForm(!showSubtaskForm)}
                                className="flex items-center gap-1 text-violet-700 dark:text-violet-200 hover:text-violet-900 dark:hover:text-violet-100 px-2 sm:px-3 py-1.5 rounded-md bg-violet-100 dark:bg-violet-900/50 hover:bg-violet-200 dark:hover:bg-violet-900/70 transition-all duration-200 shadow-sm text-xs sm:text-sm"
                            >
                                {showSubtaskForm ? (
                                    <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                ) : (
                                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                )}
                                <Label className="cursor-pointer">Subtask</Label>
                            </button>
                        </div>

                        <div className="flex-1 min-w-[100px] flex items-center justify-center">
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger className="flex items-center gap-1 text-cyan-700 dark:text-cyan-200 hover:text-cyan-900 dark:hover:text-cyan-100 px-2 sm:px-3 py-1.5 rounded-md bg-cyan-100 dark:bg-cyan-900/50 hover:bg-cyan-200 dark:hover:bg-cyan-900/70 transition-all duration-200 shadow-sm text-xs sm:text-sm">
                                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span className="font-medium">Time</span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" sideOffset={5} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
                                        <p className="text-sm font-medium">{todo.estimatedTime}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </>
            )}

            {isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div className="flex flex-col gap-2">
                        <div className="text-sm text-gray-500 font-medium">Due Date</div>
                        <input
                            type="date"
                            value={
                                editedDueDate
                                    ? new Date(
                                        editedDueDate.getTime() -
                                        editedDueDate.getTimezoneOffset() *
                                        60000
                                    )
                                        .toISOString()
                                        .slice(0, 10)
                                    : ""
                            }
                            onChange={(e) =>
                                setEditedDueDate(
                                    e.target.value ? new Date(e.target.value) : null
                                )
                            }
                            className="p-2 border rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-2">
                            <div className="text-sm text-gray-500 font-medium">Priority</div>
                            <Select
                                value={editedPriority}
                                onValueChange={(val) =>
                                    setEditedPriority(val as Priority)
                                }
                            >
                                <SelectTrigger className="w-full bg-white dark:bg-gray-700 border focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="text-sm text-gray-500 font-medium">Status</div>
                            <Select
                                value={editedStatus}
                                onValueChange={(val) =>
                                    setEditedStatus(val as Status)
                                }
                            >
                                <SelectTrigger className="w-full bg-white dark:bg-gray-700 border focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Status</SelectLabel>
                                        <SelectItem value="Not Started">
                                            Not Started
                                        </SelectItem>
                                        <SelectItem value="In progress">
                                            In Progress
                                        </SelectItem>
                                        <SelectItem value="Completed">
                                            Completed
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {analysisLoading && <Loader2 className="w-8 h-8 text-blue-500 animate-spin mt-1" />}
                </div>
            )}

            <AnimatePresence>
                {expandedInsights.includes(todo.id) && todo.analysis && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-indigo-800/50 space-y-3 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 p-4 rounded-lg shadow-inner">
                            {/* Header with category and estimated time */}
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-indigo-100 dark:border-indigo-800/30">
                                <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md font-medium text-xs sm:text-sm">
                                        {todo.analysis?.category || 'General Task'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md font-medium text-xs sm:text-sm">
                                        {todo.analysis?.estimatedTime || 'Varies by complexity'}
                                    </span>
                                </div>
                            </div>

                            {/* How To section */}
                            <div className="flex flex-col gap-1.5">
                                <h4 className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">How To Approach</h4>
                                <div className="flex items-start gap-3">
                                    <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
                                    <div className="p-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-md border border-indigo-100 dark:border-indigo-900/30 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {todo.analysis?.howTo || 'Break this task down into smaller steps for easier completion.'}
                                    </div>
                                </div>
                            </div>

                            {/* Advanced insights grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                {/* Difficulty indicator */}
                                <div className="flex flex-col gap-1.5">
                                    <h4 className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">Difficulty</h4>
                                    <div className={`p-2 rounded-md ${todo.analysis?.difficulty?.toLowerCase?.()?.includes('easy')
                                        ? 'bg-green-100/70 dark:bg-green-900/20 border-green-200 dark:border-green-800/30'
                                        : todo.analysis?.difficulty?.toLowerCase?.()?.includes('medium')
                                            ? 'bg-amber-100/70 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30'
                                            : 'bg-red-100/70 dark:bg-red-900/20 border-red-200 dark:border-red-800/30'
                                        } border text-sm`}>
                                        <div className="flex items-center mb-1">
                                            <div className={`w-2 h-2 rounded-full mr-2 ${todo.analysis?.difficulty?.toLowerCase?.()?.includes('easy')
                                                ? 'bg-green-500'
                                                : todo.analysis?.difficulty?.toLowerCase?.()?.includes('medium')
                                                    ? 'bg-amber-500'
                                                    : 'bg-red-500'
                                                }`}></div>
                                            <span className={`font-medium ${todo.analysis?.difficulty?.toLowerCase?.()?.includes('easy')
                                                ? 'text-green-700 dark:text-green-300'
                                                : todo.analysis?.difficulty?.toLowerCase?.()?.includes('medium')
                                                    ? 'text-amber-700 dark:text-amber-300'
                                                    : 'text-red-700 dark:text-red-300'
                                                }`}>
                                                {todo.analysis?.difficulty ? extractDifficultyLevel(todo.analysis.difficulty) : 'Medium'}
                                            </span>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 text-xs pl-4">
                                            {todo.analysis?.difficulty ? extractDifficultyExplanation(todo.analysis.difficulty) : ''}
                                        </p>
                                    </div>
                                </div>

                                {/* Resources */}
                                <div className="flex flex-col gap-1.5">
                                    <h4 className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">Resources</h4>
                                    <div className="p-2 bg-blue-100/70 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-md text-sm">
                                        <ul className="list-disc pl-5 text-blue-700 dark:text-blue-300 space-y-1">
                                            {todo.analysis?.resources ?
                                                todo.analysis.resources.split(',').map((resource, i) => (
                                                    <li key={i} className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">{resource.trim()}</li>
                                                ))
                                                : <li className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">No specific resources needed</li>
                                            }
                                        </ul>
                                    </div>

                                    {/* Resource Links */}
                                    {todo.analysis?.resourceLinks && todo.analysis.resourceLinks.length > 0 && (
                                        <div className="mt-2">
                                            <h5 className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1.5">Helpful Links:</h5>
                                            <div className="grid grid-cols-1 gap-2">
                                                {todo.analysis.resourceLinks.map((link, i) => {
                                                    // Validate URL
                                                    let isValidUrl = true;
                                                    try {
                                                        new URL(link.url);
                                                    } catch {
                                                        isValidUrl = false;
                                                    }

                                                    if (!isValidUrl) return null;

                                                    // Determine which icon to use based on link type
                                                    let LinkIcon = ExternalLink;
                                                    const linkType = (link.type || '').toLowerCase();

                                                    if (linkType.includes('location') || linkType.includes('map')) {
                                                        LinkIcon = MapPin;
                                                    } else if (linkType.includes('learning') || linkType.includes('course') || linkType.includes('tutorial')) {
                                                        LinkIcon = Book;
                                                    } else if (linkType.includes('tool') || linkType.includes('software') || linkType.includes('app')) {
                                                        LinkIcon = Wrench;
                                                    } else if (linkType.includes('article') || linkType.includes('guide') || linkType.includes('reference')) {
                                                        LinkIcon = FileText;
                                                    }

                                                    // Get display domain
                                                    let displayDomain = "";
                                                    try {
                                                        const urlObj = new URL(link.url);
                                                        displayDomain = urlObj.hostname.replace('www.', '');
                                                    } catch {
                                                        // Invalid URL, already checked above
                                                    }

                                                    return (
                                                        <a
                                                            key={i}
                                                            href={link.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 p-1.5 rounded-md hover:bg-blue-200/50 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 transition-colors duration-200 group"
                                                        >
                                                            <div className="bg-blue-200 dark:bg-blue-800 p-1.5 rounded-md group-hover:bg-blue-300 dark:group-hover:bg-blue-700 transition-colors duration-200">
                                                                <LinkIcon className="w-3.5 h-3.5" />
                                                            </div>
                                                            <div className="flex flex-col flex-1 min-w-0">
                                                                <span className="text-xs font-medium line-clamp-1">{link.name || displayDomain}</span>
                                                                <span className="text-xs opacity-80 line-clamp-1">{displayDomain}</span>
                                                            </div>
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Potential Blockers */}
                                <div className="flex flex-col gap-1.5">
                                    <h4 className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">Potential Blockers</h4>
                                    <div className="p-2 bg-rose-100/70 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 rounded-md text-sm">
                                        <ul className="list-disc pl-5 text-rose-700 dark:text-rose-300 space-y-1">
                                            {todo.analysis?.potentialBlockers ?
                                                todo.analysis.potentialBlockers.split(',').map((blocker, i) => (
                                                    <li key={i} className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">{blocker.trim()}</li>
                                                ))
                                                : <li className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">No common blockers identified</li>
                                            }
                                        </ul>
                                    </div>
                                </div>

                                {/* Next Steps */}
                                <div className="flex flex-col gap-1.5">
                                    <h4 className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">Next Steps</h4>
                                    <div className="p-2 bg-emerald-100/70 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-md text-sm">
                                        <div className="flex items-start gap-2">
                                            <div className="min-w-4 mt-0.5">→</div>
                                            <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                                                {todo.analysis?.nextSteps || 'Continue with related tasks'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
                {showSubtaskForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700"
                    >
                        <TodoForm parentId={todo.id} />
                    </motion.div>
                )}
            </AnimatePresence>
            {todo.subtasks && todo.subtasks.length > 0 && (
                <div className="mt-4 space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    {todo.subtasks.map((subtask) => (
                        <TodoItem key={subtask.id} todo={subtask} level={level + 1} />
                    ))}
                </div>
            )}
            {showDeleteConfirm && (
                <div className="mt-4">
                    <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800/30">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Delete Confirmation</AlertTitle>
                        <AlertDescription className="mt-2">
                            <p className="mb-3">Are you sure you want to delete this task{todo.subtasks?.length ? ' and all its subtasks' : ''}?</p>
                            <div className="flex gap-2">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleRemove(todo.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Delete
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowDeleteConfirm(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                </div>
            )}
        </motion.div>
    );
});

const extractDifficultyLevel = (difficultyText: string): string => {
    // Check for dash separator
    if (difficultyText.includes('-')) {
        return difficultyText.split('-')[0].trim();
    }
    // Check for period separator (first sentence ending with a period)
    else if (difficultyText.includes('.')) {
        const firstSentence = difficultyText.split('.')[0].trim();
        // Only return the first part if it's a known difficulty level
        if (['easy', 'medium', 'hard'].includes(firstSentence.toLowerCase())) {
            return firstSentence;
        }
    }

    // If none of the above patterns match, try to extract just the difficulty keyword
    if (difficultyText.toLowerCase().includes('easy')) return 'Easy';
    if (difficultyText.toLowerCase().includes('medium')) return 'Medium';
    if (difficultyText.toLowerCase().includes('hard')) return 'Hard';

    // Fallback to returning the first word only
    return difficultyText.split(' ')[0];
};

const extractDifficultyExplanation = (difficultyText: string): string => {
    // Check for dash separator
    if (difficultyText.includes('-')) {
        return difficultyText.split('-').slice(1).join('-').trim();
    }
    // Check for period separator
    else if (difficultyText.includes('.')) {
        const parts = difficultyText.split('.');
        const firstPart = parts[0].trim().toLowerCase();

        // If first part is a recognized difficulty level, return the rest
        if (['easy', 'medium', 'hard'].includes(firstPart)) {
            return parts.slice(1).join('.').trim();
        }
    }

    // If we can't clearly separate level from explanation, return empty string
    return '';
};

const TodoList: React.FC<{ isLoading?: boolean }> = ({ isLoading = false }) => {
    const todos = useTodoStore((state) => state.todos);
    const { calculateAllPriorityScores, getSortedTodosByPriority, refreshPriorityScores } = useTodoStore();
    const [sortCriteria, setSortCriteria] = useState<"date" | "priority" | "ai_priority">("date");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'uncompleted'>('all');
    const [priorityBatchLoading, setPriorityBatchLoading] = useState(false);

    // Initialize AI Priority management
    const { getPriorityRecommendations } = useAIPriority();

    const sortedTodos = useMemo(() => {
        if (sortCriteria === "ai_priority") {
            return getSortedTodosByPriority();
        }

        return [...todos].sort((a, b) => {
            if (sortCriteria === "date") {
                return (
                    (a.dueDate ? new Date(a.dueDate).getTime() : Infinity) -
                    (b.dueDate ? new Date(b.dueDate).getTime() : Infinity)
                );
            } else if (sortCriteria === "priority") {
                const priorityOrder = { high: 1, medium: 2, low: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return 0;
        });
    }, [todos, sortCriteria, getSortedTodosByPriority]);

    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const filteredTodos = useMemo(() => {
        return sortedTodos.filter((todo) => {
            const matchesSearch = todo.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
            if (filterStatus === 'all') return matchesSearch;
            if (filterStatus === 'completed') return matchesSearch && todo.completed;
            if (filterStatus === 'uncompleted') return matchesSearch && !todo.completed;
            return matchesSearch;
        });
    }, [sortedTodos, debouncedSearchQuery, filterStatus]);

    const handleSearchTasks = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }, []);

    const handleBatchPriorityCalculation = async () => {
        setPriorityBatchLoading(true);
        try {
            await calculateAllPriorityScores();
        } catch (error) {
            console.error('Error calculating batch priority scores:', error);
        } finally {
            setPriorityBatchLoading(false);
        }
    };

    const handleRefreshPriorityScores = async () => {
        setPriorityBatchLoading(true);
        try {
            await refreshPriorityScores();
        } catch (error) {
            console.error('Error refreshing priority scores:', error);
        } finally {
            setPriorityBatchLoading(false);
        }
    };

    // Get AI priority recommendations
    const recommendations = useMemo(() => {
        return getPriorityRecommendations();
    }, [getPriorityRecommendations]);

    const hasAIScores = useMemo(() => {
        return todos.some(todo => todo.priorityScore);
    }, [todos]);

    return (
        <div className="w-full space-y-4">
            {/* AI Priority Recommendations */}
            {hasAIScores && sortCriteria === "ai_priority" && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-700/50"
                >
                    <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        AI Priority Insights
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        {recommendations.topPriority.length > 0 && (
                            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800/30">
                                <h4 className="font-medium text-red-800 dark:text-red-200 mb-1 flex items-center gap-1">
                                    <Target className="w-4 h-4" />
                                    Top Priority
                                </h4>
                                <p className="text-red-700 dark:text-red-300">{recommendations.topPriority[0]?.title}</p>
                            </div>
                        )}
                        {recommendations.quickWins.length > 0 && (
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800/30">
                                <h4 className="font-medium text-green-800 dark:text-green-200 mb-1 flex items-center gap-1">
                                    <Zap className="w-4 h-4" />
                                    Quick Win
                                </h4>
                                <p className="text-green-700 dark:text-green-300">{recommendations.quickWins[0]?.title}</p>
                            </div>
                        )}
                        {recommendations.urgent.length > 0 && (
                            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-800/30">
                                <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-1 flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    Most Urgent
                                </h4>
                                <p className="text-orange-700 dark:text-orange-300">{recommendations.urgent[0]?.title}</p>
                            </div>
                        )}
                        {recommendations.blockers.length > 0 && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800/30">
                                <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-1 flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    Unblocks Others
                                </h4>
                                <p className="text-purple-700 dark:text-purple-300">{recommendations.blockers[0]?.title}</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="p-2 bg-white/90 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-sm mb-4 sticky top-0 z-10 border border-gray-200 dark:border-gray-600"
            >
                {todos?.length !== 0 ? (
                    <div className="flex flex-col sm:flex-row justify-between mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 backdrop-blur-sm rounded-lg p-4 transition-all duration-300 animate-fadeIn">
                        <div className="relative w-full sm:w-3/5 mb-2 sm:mb-0">
                            <Input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchTasks}
                                placeholder="Search tasks..."
                                className="w-full p-2 pl-10 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
                            />
                            <Search className="absolute top-2.5 left-3 w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div className="flex justify-start sm:justify-end gap-2 flex-wrap">
                            <Select
                                value={filterStatus}
                                onValueChange={(e) => setFilterStatus(e as 'all' | 'completed' | 'uncompleted')}
                            >
                                <SelectTrigger className="w-full sm:w-[160px] bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm">
                                    <SelectValue placeholder="Filter Tasks" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Tasks</SelectItem>
                                    <SelectItem value="completed">Completed Tasks</SelectItem>
                                    <SelectItem value="uncompleted">Uncompleted Tasks</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={sortCriteria}
                                onValueChange={(e) => setSortCriteria(e as "date" | "priority" | "ai_priority")}
                            >
                                <SelectTrigger className="w-full sm:w-[200px] bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm">
                                    <SelectValue placeholder="Sort By" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date">Sort by Date</SelectItem>
                                    <SelectItem value="priority">Sort by Priority</SelectItem>
                                    <SelectItem value="ai_priority">Sort by AI Priority</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* AI Priority Actions */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-1">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleBatchPriorityCalculation}
                                    disabled={priorityBatchLoading}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium border border-gray-700 dark:border-gray-500"
                                    title="Calculate AI priority scores for all tasks"
                                >
                                    {priorityBatchLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Brain className="w-4 h-4" />
                                    )}
                                    <span className="whitespace-nowrap">AI Score All</span>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleRefreshPriorityScores}
                                    disabled={priorityBatchLoading}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium border border-gray-500 dark:border-gray-600"
                                    title="Refresh stale AI priority scores"
                                >
                                    {priorityBatchLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4" />
                                    )}
                                    <span className="whitespace-nowrap">Refresh Scores</span>
                                </motion.button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center mb-1 p-4">
                        <Label htmlFor="message" className="text-gray-500 dark:text-gray-400">Start adding tasks to see them here.</Label>
                    </div>
                )}
            </motion.div>
            <AnimatePresence>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-40 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
                        <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
                            <p className="text-gray-600 dark:text-gray-300">Loading your tasks...</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredTodos.length > 0 ? (
                            filteredTodos.map((todo) => (
                                <TodoItem key={todo.id} todo={todo} />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
                                <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">No tasks found</h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    {searchQuery ? "Try a different search term" : "Create a task to get started"}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TodoList;
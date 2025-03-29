import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Check,
    ChevronDown, Clock,
    Edit3,
    HelpCircle, Loader2,
    Minus,
    Plus,
    Search,
    Tag,
    Trash2
} from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectLabel,
    SelectGroup
} from "./ui/select.tsx";
import { useTodoStore } from "../store/todoStore";
import TodoForm from "./TodoForm";
import type { Priority, Status, Todo } from "../types";
import { ConfettiSideCannons } from "./ui/ConfettiSideCannons.ts";
import { analyzeTodo } from "../services/gemini.ts";
import { deleteSubtask, deleteTask, updateSubtask, updateTask } from "../services/taskService";
import { Label } from "./ui/label.tsx";
import { Input } from "./ui/input.tsx";
import useDebounce from "../hooks/useDebounce.ts";
import { getUserRegion } from "../hooks/getUserRegion.ts";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./ui/tooltip.tsx";


const TodoItem: React.FC<{ todo: Todo; level?: number }> = React.memo(({ todo, level = 0 }) => {
    const { removeTodo, updateTodo, deleteSubtaskStore, updateSubtaskStore } = useTodoStore();
    const [expandedInsights, setExpandedInsights] = useState<string[]>([]);
    const [showSubtaskForm, setShowSubtaskForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(todo.title);
    const [isHovered, setIsHovered] = useState(false);
    const [editedDueDate, setEditedDueDate] = useState(todo.dueDate ? new Date(todo.dueDate) : null);
    const [editedPriority, setEditedPriority] = useState(todo.priority);
    const [editedStatus, setEditedStatus] = useState(todo.status);
    const [analysisLoading, setAnalysisLoading] = useState(false);


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

    const toggleInsights = (id: string) => {
        setExpandedInsights((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const handleRemove = async (id: string) => {
        removeTodo(id);
        if (todo.parentId) {
            deleteSubtaskStore(todo.parentId, id);
            await deleteSubtask(id);
        } else {
            removeTodo(id);
            await deleteTask(id);
        }
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
            return `cursor-pointer text-sm font-semibold bg-gray-200 text-gray-700 text-center rounded-full px-3 py-1 truncate shadow-sm border border-gray-300`;
        } else if (status === "In progress") {
            return `cursor-pointer text-sm font-semibold bg-gradient-to-r from-blue-400 to-indigo-500 text-white text-center rounded-full px-3 py-1 truncate shadow-sm`;
        } else if (status === "Completed") {
            return `cursor-pointer text-sm font-semibold bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-center rounded-full px-3 py-1 truncate shadow-sm`;
        }
        return `cursor-pointer text-sm font-semibold text-center rounded-full px-3 py-1 truncate shadow-sm`;
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high":
                return "text-white bg-gradient-to-r from-red-500 to-pink-500 cursor-pointer text-sm font-semibold text-center rounded-full px-3 py-1 shadow-sm";
            case "medium":
                return "text-gray-800 bg-gradient-to-r from-amber-300 to-yellow-400 cursor-pointer text-sm font-semibold text-center rounded-full px-3 py-1 shadow-sm";
            case "low":
                return "text-gray-800 bg-gradient-to-r from-green-300 to-emerald-400 cursor-pointer text-sm font-semibold text-center rounded-full px-3 py-1 shadow-sm";
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

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            await handleSave();
        }
    };

    const handleTodoCompletion = (todo: Todo) => {
        const updatedCompleted = !todo.completed;
        const newStatus = updatedCompleted ? "Completed" : "In progress";
        if (todo.parentId) {
            useTodoStore.getState().updateSubtaskStore(todo.parentId, todo.id, {
                completed: updatedCompleted,
                status: newStatus,
                completedAt: updatedCompleted ? new Date() : null,
            });
            updateSubtask(todo.id, { completed: updatedCompleted, status: newStatus, completedAt: updatedCompleted ? new Date() : null }).catch((error) =>
                console.error("Error updating subtask:", error)
            );
        } else {
            updateTodo(todo.id, { completed: updatedCompleted, status: newStatus, completedAt: updatedCompleted ? new Date() : null, });
            updateTask(todo.id, { completed: updatedCompleted, status: newStatus, completedAt: updatedCompleted ? new Date() : null, }).catch((error) =>
                console.error("Error updating task:", error)
            );
        }
    };

    const prevCompletedRef = useRef(todo.completed);
    useEffect(() => {
        if (!prevCompletedRef.current && todo.completed) {
            ConfettiSideCannons();
        }
        prevCompletedRef.current = todo.completed;
    }, [todo.completed]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className={`p-3 sm:p-4 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all ${level > 0 ? "ml-2 sm:ml-4 md:ml-8 mt-2" : "mb-4"
                } ${todo.completed ? "border-l-4 border-l-emerald-500" : "hover:border-l-4 hover:border-l-blue-500"}`}
        >
            {/* Row 1: Checkbox and Title */}
            <div className="flex items-center w-full mb-4">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleTodoCompletion(todo)}
                    className={`p-3 rounded-full ${todo.completed
                        ? "bg-gradient-to-r from-emerald-400 to-teal-500 shadow-md"
                        : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                        } mr-4 shadow-sm flex-shrink-0 transition-all duration-200`}
                >
                    <Check
                        className={`w-5 h-5 ${todo.completed ? "text-white" : "text-gray-400"
                            }`}
                    />
                </motion.button>
                {isEditing ? (
                    <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="w-full p-3 text-lg border rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                ) : (
                    <p className={`text-lg sm:text-xl ${todo.completed ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-white"} break-words flex-1 font-medium`}>
                        {todo.title}
                    </p>
                )}

                {/* Edit and Delete buttons in right corner */}
                {!isEditing && (
                    <div className="flex ml-auto gap-2">
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: "rgb(219 234 254)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleEdit}
                            className="flex items-center justify-center p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
                        >
                            <Edit3 className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: "rgb(254 226 226)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRemove(todo.id)}
                            className="flex items-center justify-center p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
                        >
                            <Trash2 className="w-5 h-5" />
                        </motion.button>
                    </div>
                )}

                {isEditing && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSave}
                        disabled={analysisLoading}
                        className="flex items-center gap-1 ml-2 px-4 py-2 text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                        <Check className="w-4 h-4" />
                        <span className="font-medium">Save</span>
                    </motion.button>
                )}
            </div>

            {!isEditing && (
                <>
                    {/* Row 2: Priority, Time left, Status */}
                    <div className="flex items-center justify-between rounded-lg bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-100 dark:border-gray-700 transition-all duration-200 p-2 gap-0.5 mb-2">
                        <div className="flex-1 flex items-center justify-center">
                            <span className={`${getPriorityColor(todo.priority)} min-w-16 text-center`}>
                                {todo.priority ? todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1) : ""}
                            </span>
                        </div>

                        <div className="flex-1 flex items-center justify-center">
                            {todo.dueDate && (
                                <p
                                    onMouseEnter={() => setIsHovered(true)}
                                    onMouseLeave={() => setIsHovered(false)}
                                    className={`transition-colors duration-200 text-center border rounded-lg py-1 px-3 text-sm ${renderDueDate(todo.dueDate)?.toString().includes("days left")
                                        ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800"
                                        : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800"
                                        }`}
                                >
                                    {renderDueDate(todo.dueDate)}
                                </p>
                            )}
                        </div>

                        <div className="flex-1 flex items-center justify-center">
                            <span onClick={toggleStatus} className={`${getStatusClasses(todo.status)} w-26 inline-block overflow-hidden whitespace-nowrap`}>
                                {todo.status}
                            </span>
                        </div>
                    </div>

                    {/* Row 3: Insights, Subtask, Time buttons */}
                    <div className="flex items-center justify-between rounded-lg bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-100 dark:border-gray-700 transition-all duration-200 p-2">
                        <div className="flex-1 flex items-center justify-center">
                            {todo.analysis && (
                                <button
                                    onClick={() => toggleInsights(todo.id)}
                                    className="flex items-center gap-1 text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 px-3 py-1.5 rounded-md bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all duration-200 shadow-sm"
                                >
                                    {expandedInsights.includes(todo.id) ? (
                                        <ChevronDown className="w-4 h-4" />
                                    ) : (
                                        <img
                                            src="https://svgmix.com/uploads/e567ca-google-bard.svg"
                                            alt={`Gemini`}
                                            className="w-4 h-4"
                                        />
                                    )}
                                    <Label className="cursor-pointer">Insights</Label>
                                </button>
                            )}
                        </div>

                        <div className="flex-1 flex items-center justify-center">
                            <button
                                onClick={() => setShowSubtaskForm(!showSubtaskForm)}
                                className="flex items-center gap-1 text-violet-600 dark:text-violet-300 hover:text-violet-800 dark:hover:text-violet-200 px-3 py-1.5 rounded-md bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all duration-200 shadow-sm"
                            >
                                {showSubtaskForm ? (
                                    <Minus className="w-4 h-4" />
                                ) : (
                                    <Plus className="w-4 h-4" />
                                )}
                                <Label className="cursor-pointer">Subtask</Label>
                            </button>
                        </div>

                        <div className="flex-1 flex items-center justify-center">
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger className="flex items-center gap-1 text-cyan-600 dark:text-cyan-300 hover:text-cyan-800 dark:hover:text-cyan-200 px-3 py-1.5 rounded-md bg-cyan-50 dark:bg-cyan-900/20 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-all duration-200 shadow-sm">
                                        <Clock className="w-4 h-4" />
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
                            <div className="flex items-center gap-3 text-xs sm:text-sm">
                                <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <span className="text-indigo-800 dark:text-indigo-200 font-medium">
                                    {todo.analysis.category}
                                </span>
                            </div>
                            <div className="flex items-start gap-3 text-xs sm:text-sm">
                                <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
                                <span className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {todo.analysis.howTo}
                                </span>
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
        </motion.div>
    );
});

const TodoList: React.FC = () => {
    const todos = useTodoStore((state) => state.todos);
    const [sortCriteria, setSortCriteria] = useState<"date" | "priority">("date");
    const [searchQuery, setSearchQuery] = useState("");

    const sortedTodos = useMemo(() => {
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
    }, [todos, sortCriteria]);

    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const filteredTodos = useMemo(() => {
        return sortedTodos.filter((todo) =>
            todo.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );
    }, [sortedTodos, debouncedSearchQuery]);

    const handleSearchTasks = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }, []);

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-320px)]">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="p-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-sm mb-4 sticky top-0 z-10 border border-gray-100 dark:border-gray-700"
            >
                {todos?.length !== 0 ? (
                    <div className="flex flex-col sm:flex-row justify-between mb-1 bg-white/80 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 backdrop-blur-sm rounded-lg p-4 transition-all duration-300 animate-fadeIn">
                        <div className="relative w-full sm:w-3/5 mb-2 sm:mb-0">
                            <Input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchTasks}
                                placeholder="Search tasks..."
                                className="w-full p-2 pl-10 border rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
                            />
                            <Search className="absolute top-2.5 left-3 w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex justify-start sm:justify-end">
                            <Select
                                value={sortCriteria}
                                onValueChange={(e) => setSortCriteria(e as "date" | "priority")}
                            >
                                <SelectTrigger className="w-full sm:w-[180px] bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm">
                                    <SelectValue placeholder="Sort By" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date">Sort by Date</SelectItem>
                                    <SelectItem value="priority">Sort by Priority</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center mb-1 p-4">
                        <Label htmlFor="message" className="text-gray-500 dark:text-gray-400">Start adding tasks to see them here.</Label>
                    </div>
                )}
            </motion.div>
            <AnimatePresence>
                <div className="todo-list-scroll flex-grow overflow-y-auto space-y-4 pr-2 pb-40 pl-1 max-h-[calc(100vh-200px)] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
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
            </AnimatePresence>
        </div>
    );
};

export default TodoList;
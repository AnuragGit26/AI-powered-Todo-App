import React, {useEffect, useState, useMemo, useCallback, useRef} from "react";
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
    Trash2,
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
            return `cursor-pointer text-sm font-semibold bg-gray-300 text-gray-800 text-center rounded-full px-2 py-1`;
        } else if (status === "In progress") {
            return `cursor-pointer text-sm font-semibold bg-orange-200 text-orange-800 text-center rounded-full px-2 py-1`;
        } else if (status === "Completed") {
            return `cursor-pointer text-sm font-semibold bg-green-200 text-green-800 text-center rounded-full px-2 py-1`;
        }
        return `cursor-pointer text-sm font-semibold text-center rounded-full px-2 py-1`;
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high":
                return "text-black cursor-pointer text-sm font-semibold bg-red-400 text-center rounded-full px-2 py-1";
            case "medium":
                return "text-black cursor-pointer text-sm font-semibold bg-yellow-300 text-center rounded-full px-2 py-1";
            case "low":
                return "text-black cursor-pointer text-sm font-semibold bg-green-500 text-center rounded-full px-2 py-1";
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
                completedAt:updatedCompleted? new Date(): null,
            });
            updateSubtask(todo.id, { completed: updatedCompleted, status: newStatus,completedAt:updatedCompleted? new Date(): null }).catch((error) =>
                console.error("Error updating subtask:", error)
            );
        } else {
            updateTodo(todo.id, { completed: updatedCompleted, status: newStatus ,completedAt:updatedCompleted? new Date(): null,});
            updateTask(todo.id, { completed: updatedCompleted, status: newStatus ,completedAt:updatedCompleted? new Date(): null,}).catch((error) =>
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
            className={`p-4 bg-white bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur rounded-lg shadow-md ${
                level > 0 ? "ml-8 mt-2" : "mb-4"
            }`}
        >
            <div className="flex items-center gap-4">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleTodoCompletion(todo)}
                    className={`p-2 rounded-full ${
                        todo.completed ? "bg-green-500" : "bg-gray-200 dark:bg-gray-800"
                    }`}
                >
                    <Check
                        className={`w-4 h-4 ${
                            todo.completed ? "text-white" : "text-gray-400"
                        }`}
                    />
                </motion.button>
                <div className="flex-1">
                    {isEditing ? (
                        <div className="flex flex-col gap-3">
                            <input
                                type="text"
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                onBlur={handleSave}
                                onKeyDown={handleKeyDown}
                                className="w-full p-2 border rounded-lg dark:bg-white/5 dark:border-white/10"
                            />
                            <div className="flex gap-3">
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
                                    className="p-2 border rounded-lg dark:bg-white/5 dark:border-white/10"
                                />
                                <Select
                                    value={editedPriority}
                                    onValueChange={(val) =>
                                        setEditedPriority(val as Priority)
                                    }
                                >
                                    <SelectTrigger className="w-28 dark:bg-white/5 border dark:border-white/10 backdrop-blur rounded-lg">
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
                                    value={editedStatus}
                                    onValueChange={(val) =>
                                        setEditedStatus(val as Status)
                                    }
                                >
                                    <SelectTrigger className="w-28 dark:bg-white/5 border dark:border-white/10 backdrop-blur rounded-lg">
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
                    ) : (
                        <p className={`text-lg ${todo.completed ? "line-through text-gray-200" : ""}`}>
                            {todo.title}
                        </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-white">
                        <span className={getPriorityColor(todo.priority)}>
                             {todo.priority ? todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1) : ""}
                        </span>
                        <div className="p-1 pt-1.5 pb-2 border rounded-lg dark:bg-white/5 dark:border-white/10">
                            {todo.dueDate && (
                                <p
                                    onMouseEnter={() => setIsHovered(true)}
                                    onMouseLeave={() => setIsHovered(false)}
                                    className="transition-colors duration-200"
                                >
                                    {renderDueDate(todo.dueDate)}
                                </p>
                            )}
                        </div>
                        <span onClick={toggleStatus} className={getStatusClasses(todo.status)}>
                            {todo.status}
                        </span>
                        {todo.analysis && (
                            <button
                                onClick={() => toggleInsights(todo.id)}
                                className="flex items-center gap-1 text-blue-500 hover:text-blue-600 dark:text-blue-400"
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
                                <Label>Insights</Label>
                            </button>
                        )}
                        <button
                            onClick={() => setShowSubtaskForm(!showSubtaskForm)}
                            className="flex items-center gap-1 text-blue-500 hover:text-blue-600 dark:text-blue-400"
                        >
                            {showSubtaskForm ? (
                                <Minus className="w-4 h-4" />
                            ) : (
                                <Plus className="w-4 h-5" />
                            )}
                            <Label>Subtask</Label>
                        </button>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger className="flex items-center space-x-1">
                                    <Clock className="w-5 h-5 text-blue-500" />
                                    <span className="font-medium ">Estimated Time</span>
                                </TooltipTrigger>
                                <TooltipContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-2">
                                    <p className="text-sm">{todo.estimatedTime}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
                {isEditing ? (
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleSave}
                        className="p-2 text-white dark:text-black rounded-lg bg-blue-500 dark:bg-blue-200"
                    >
                        Save{analysisLoading?<Loader2 className="w-5 h-5 text-green-400 animate-spin mr-2" />:null}
                    </motion.button>

                ) : (
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleEdit}
                        className="p-2 text-blue-500 hover:bg-blue-100 rounded-full"
                    >
                        <Edit3 className="w-5 h-5" />
                    </motion.button>
                )}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleRemove(todo.id)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                >
                    <Trash2 className="w-5 h-5" />
                </motion.button>
            </div>
            <AnimatePresence>
                {expandedInsights.includes(todo.id) && todo.analysis && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-3 pt-3 border-t dark:border-gray-700 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Tag className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600 dark:text-gray-300">
                                    {todo.analysis.category}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <HelpCircle className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600 dark:text-gray-300">
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
                    >
                        <TodoForm parentId={todo.id} />
                    </motion.div>
                )}
            </AnimatePresence>
            {todo.subtasks && todo.subtasks.length > 0 && (
                <div className="mt-4 space-y-2">
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
        <div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg shadow-md mb-4"
            >
                {todos?.length !== 0 ? (
                    <div className="flex justify-between mb-1 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur rounded-lg p-4 transition-all duration-300 animate-fadeIn">
                        <Input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchTasks}
                            placeholder="Search tasks..."
                            className="w-3/5 p-2 border rounded-lg dark:bg-white/5 dark:border-white/10"
                        />
                        <Search className="relative top-2 right-28 w-5 h-5 z-50 text-gray-400" />
                        <div className="flex justify-end mb-1">
                            <Select
                                value={sortCriteria}
                                onValueChange={(e) => setSortCriteria(e as "date" | "priority")}
                            >
                                <SelectTrigger className="w-[180px]">
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
                    <div className="flex justify-center mb-1">
                        <Label htmlFor="message">Start adding tasks to see them here.</Label>
                    </div>
                )}
            </motion.div>
            <AnimatePresence>
                <div className="todo-list-scroll space-y-4 pr-2 pb-2 pl-1">
                    {filteredTodos.map((todo) => (
                        <TodoItem key={todo.id} todo={todo} />
                    ))}
                </div>
            </AnimatePresence>
        </div>
    );
};

export default TodoList;
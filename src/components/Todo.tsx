import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Check,
    Clock,
    Edit3,
    Trash2,
    ChevronDown,
    AlertCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { type Todo as TodoType, type Priority, type Status } from '../types';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import { Input } from './ui/input';
import { useTodoStore } from '../store/todoStore';
import { updateTask, updateSubtask, deleteTask, deleteSubtask } from '../services/taskService';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Button } from './ui/button';

interface TodoProps {
    todo: TodoType;
    level?: number;
}

const Todo: React.FC<TodoProps> = ({ todo, level = 0 }) => {
    const { updateTodo, removeTodo, updateSubtaskStore, deleteSubtaskStore } = useTodoStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(todo.title);
    const [editedPriority, setEditedPriority] = useState<Priority>(todo.priority);
    const [editedStatus, setEditedStatus] = useState<Status>(todo.status);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleSave = async () => {
        const updates = {
            title: editedTitle,
            priority: editedPriority,
            status: editedStatus,
        };

        if (todo.parentId) {
            updateSubtaskStore(todo.parentId, todo.id, updates);
            await updateSubtask(todo.id, updates);
        } else {
            updateTodo(todo.id, updates);
            await updateTask(todo.id, updates);
        }
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (todo.parentId) {
            deleteSubtaskStore(todo.parentId, todo.id);
            await deleteSubtask(todo.id);
        } else {
            removeTodo(todo.id);
            await deleteTask(todo.id);
        }
        setShowDeleteConfirm(false);
    };

    const handleStatusChange = async (newStatus: Status) => {
        if (todo.parentId) {
            updateSubtaskStore(todo.parentId, todo.id, { status: newStatus });
            await updateSubtask(todo.id, { status: newStatus });
        } else {
            updateTodo(todo.id, { status: newStatus });
            await updateTask(todo.id, { status: newStatus });
        }
    };

    const getStatusClasses = (status: Status) => {
        switch (status) {
            case 'Not Started':
                return 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-100';
            case 'In progress':
                return 'theme-secondary-bg text-white';
            case 'Completed':
                return 'theme-accent-bg text-white';
            default:
                return '';
        }
    };

    const getPriorityColor = (priority: Priority) => {
        switch (priority) {
            case 'high':
                return 'text-white bg-gradient-to-r from-red-500 to-pink-500 dark:from-red-600 dark:to-pink-600';
            case 'medium':
                return 'text-gray-800 dark:text-gray-100 bg-gradient-to-r from-amber-300 to-yellow-400 dark:from-amber-500 dark:to-yellow-600';
            case 'low':
                return 'text-gray-800 dark:text-white theme-accent-bg';
            default:
                return 'text-gray-500';
        }
    };

    const renderDueDate = () => {
        if (!todo.dueDate) return null;
        const dueDate = new Date(todo.dueDate);
        if (isNaN(dueDate.getTime())) return null;

        const now = new Date();
        if (dueDate < now) {
            return <span className="text-red-500">{dueDate.toLocaleDateString()}</span>;
        } else {
            const timeLeft = dueDate.getTime() - now.getTime();
            const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
            return <span className="text-gray-600 dark:text-gray-300">{`${daysLeft} days left`}</span>;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={cn(
                'flex flex-col gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm',
                { 'ml-6': level > 0 }
            )}
        >
            <div className="flex items-center gap-4">
                <button
                    onClick={() => handleStatusChange(todo.status === 'Completed' ? 'Not Started' : 'Completed')}
                    className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                        todo.status === 'Completed'
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300 hover:border-gray-400'
                    )}
                >
                    {todo.status === 'Completed' && <Check className="w-4 h-4 text-white" />}
                </button>

                {isEditing ? (
                    <div className="flex-1 flex gap-2">
                        <Input
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                            className="flex-1"
                            autoFocus
                        />
                        <Select value={editedPriority} onValueChange={(value: Priority) => setEditedPriority(value)}>
                            <SelectTrigger className={cn('w-24', getPriorityColor(editedPriority))}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={editedStatus} onValueChange={(value: Status) => setEditedStatus(value)}>
                            <SelectTrigger className={cn('w-32', getStatusClasses(editedStatus))}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Not Started">Not Started</SelectItem>
                                <SelectItem value="In progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                        <button
                            onClick={handleSave}
                            className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                        >
                            Save
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1">
                            <h3 className={cn(
                                'text-lg font-medium',
                                todo.status === 'Completed' && 'line-through text-gray-500'
                            )}>
                                {todo.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-sm">
                                {renderDueDate()}
                                {todo.estimatedTime && (
                                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                                        <Clock className="w-4 h-4" />
                                        <span>{todo.estimatedTime}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                'px-3 py-1 rounded-full text-sm font-medium',
                                getPriorityColor(todo.priority)
                            )}>
                                {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                            </span>
                            <span className={cn(
                                'px-3 py-1 rounded-full text-sm font-medium',
                                getStatusClasses(todo.status)
                            )}>
                                {todo.status}
                            </span>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-red-500"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            {todo.subtasks && todo.subtasks.length > 0 && (
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                >
                                    <ChevronDown
                                        className={cn(
                                            'w-4 h-4 transition-transform',
                                            isExpanded && 'transform rotate-180'
                                        )}
                                    />
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>

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
                                    onClick={handleDelete}
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

            {isExpanded && todo.subtasks && (
                <div className="mt-2">
                    {todo.subtasks.map((subtask) => (
                        <Todo
                            key={subtask.id}
                            todo={subtask}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default Todo; 
import React, {useEffect, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {AlertCircle, Check, ChevronDown, Edit3, HelpCircle, Minus, Plus, Tag, Trash2} from 'lucide-react';
import {useTodoStore} from '../store/todoStore';
import TodoForm from './TodoForm';
import type {SubTodo, Todo} from '../types';
import {ConfettiSideCannons} from './ui/ConfettiSideCannons.ts';
import {analyzeTodo} from "../services/gemini.ts";
import {
    deleteSubtask,
    deleteTask,
    fetchSubtasks,
    updateSubtask,
    updateTask
} from '../services/taskService';



const TodoItem: React.FC<{ todo: Todo; level?: number }> = ({todo, level = 0}) => {
    const {toggleTodo, removeTodo, updateTodo} = useTodoStore();
    const [expandedInsights, setExpandedInsights] = useState<string[]>([]);
    const [showSubtaskForm, setShowSubtaskForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(todo.title);
    const [subtasks, setSubtasks] = useState<SubTodo[]>([]);
    const [isHovered, setIsHovered] = useState(false);

    // const calculateTimeLeft = (dueDate: Date | string | null) => {
    //     if (!dueDate) return '';
    //     // Convert string to Date if necessary
    //     const parsedDate = dueDate instanceof Date ? dueDate : new Date(dueDate);
    //     if (isNaN(parsedDate.getTime())) return '';
    //     const now = new Date();
    //     const timeLeft = parsedDate.getTime() - now.getTime();
    //     const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
    //     return daysLeft < 0 ? 'Crossed due date' : `${daysLeft} days left`;
    // };

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
            return <span>{`${daysLeft} days left`}</span>;
        }
    };

    const toggleInsights = (id: string) => {
        setExpandedInsights(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleRemove = async (id:string) => {
        removeTodo(id);
        if (todo.parentId) {
            await deleteSubtask(id); // Delete subtask from Supabase
        } else {
            await deleteTask(id); // Delete task from Supabase
        }
    };

    const toggleStatus = () => {
        const newStatus = todo.status === 'Not Started' ? 'In progress' : 'Not Started';
        updateTodo(todo.id, { status: newStatus });
    };

    const getStatusClasses = (status: string) => {
        if (status === 'Not Started') {
            return `cursor-pointer text-sm font-semibold bg-gray-300 text-gray-800 rounded-full px-2 py-1`;
        } else if (status === 'In progress') {
            return `cursor-pointer text-sm font-semibold bg-orange-200 text-orange-800 rounded-full px-2 py-1`;
        } else if (status === 'Completed') {
            return `cursor-pointer text-sm font-semibold bg-green-200 text-green-800 rounded-full px-2 py-1`;
        }
        return `cursor-pointer text-sm font-semibold rounded-full px-2 py-1`;
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'text-red-500';
            case 'medium':
                return 'text-yellow-500';
            case 'low':
                return 'text-green-500';
            default:
                return 'text-gray-500';
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = async () => {
        const analysis = await analyzeTodo(editedTitle);
        updateTodo(todo.id, { title: editedTitle, analysis });
        if (todo.parentId) {
            await updateSubtask(todo.id, { title: editedTitle, analysis }); // Update subtask in Supabase
        } else {
            await updateTask(todo.id, { title: editedTitle, analysis }); // Update task in Supabase
        }
        setIsEditing(false);
    };

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            await handleSave();
        }
    };

    useEffect(() => {
        const newStatus = todo.completed ? "Completed" : "In progress";
        if (todo.status !== newStatus) {
            if (todo.completed) {
                ConfettiSideCannons();
            }
            updateTask(todo.id, { status: newStatus });
            updateTodo(todo.id, { status: newStatus });
            todo.status = newStatus;
        }
    }, [todo.completed]);

    useEffect(() => {
        const loadSubtasks = async () => {
            const fetchedSubtasks = await fetchSubtasks(todo.id);
            setSubtasks(fetchedSubtasks);
        };

        if (todo.id) {
            loadSubtasks();
        }
    }, [todo.id]);



    return (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, x: -100}}
            className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md ${level > 0 ? 'ml-8 mt-2' : 'mb-4'}`}
        >
            <div className="flex items-center gap-4">
                <motion.button
                    whileHover={{scale: 1.1}}
                    whileTap={{scale: 0.9}}
                    onClick={() => toggleTodo(todo.id)}
                    className={`p-2 rounded-full ${
                        todo.completed ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                >
                    <Check className={`w-4 h-4 ${todo.completed ? 'text-white' : 'text-gray-400'}`}/>
                </motion.button>

                <div className="flex-1">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        />
                    ) : (
                        <p className={`text-lg ${todo.completed ? 'line-through text-gray-400' : ''}`}>
                            {todo.title}
                        </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <AlertCircle className={`w-6 h-6 ${getPriorityColor(todo.priority)}`}/>
                        <div className="p-0.5 border rounded-lg">
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
                                className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                            >
                                {expandedInsights.includes(todo.id) ? (
                                    <ChevronDown className="w-4 h-4"/>
                                ) : (
                                    <img src="https://svgmix.com/uploads/e567ca-google-bard.svg" alt={"Gemini"}
                                         className="w-4 h-4"/>
                                )}
                                Insights
                            </button>
                        )}
                        <button
                            onClick={() => setShowSubtaskForm(!showSubtaskForm)}
                            className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                        >
                            {showSubtaskForm ? (
                                <Minus className="w-4 h-4"/>
                            ) : (
                                <Plus className="w-4 h-5"/>
                            )}
                            Subtask
                        </button>
                    </div>
                </div>

                <motion.button
                    whileHover={{scale: 1.1}}
                    whileTap={{scale: 0.9}}
                    onClick={handleEdit}
                    className="p-2 text-blue-500 hover:bg-blue-100 rounded-full"
                >
                    <Edit3 className="w-5 h-5"/>
                </motion.button>

                <motion.button
                    whileHover={{scale: 1.1}}
                    whileTap={{scale: 0.9}}
                    onClick={() => handleRemove(todo.id)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                >
                    <Trash2 className="w-5 h-5"/>
                </motion.button>
            </div>

            <AnimatePresence>
                {expandedInsights.includes(todo.id) && todo.analysis && (
                    <motion.div
                        initial={{height: 0, opacity: 0}}
                        animate={{height: 'auto', opacity: 1}}
                        exit={{height: 0, opacity: 0}}
                        className="overflow-hidden"
                    >
                        <div className="mt-3 pt-3 border-t dark:border-gray-700 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Tag className="w-4 h-4 text-gray-500"/>
                                <span className="text-gray-600 dark:text-gray-300">
                  {todo.analysis.category}
                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <HelpCircle className="w-4 h-4 text-gray-500"/>
                                <span className="text-gray-600 dark:text-gray-300">
                  {todo.analysis.howTo}
                </span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {showSubtaskForm && (
                    <motion.div
                        initial={{opacity: 0, y: -10}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -10}}
                    >
                        <TodoForm parentId={todo.id}/>
                    </motion.div>
                )}
            </AnimatePresence>

            {subtasks.length > 0 && (
                <div className="mt-4 space-y-2">
                    {subtasks.map((subtask) => (
                        <TodoItem key={subtask.id} todo={subtask} level={level + 1} />
                    ))}
                </div>
            )}
        </motion.div>
    );
};


const TodoList: React.FC = () => {
    const todos = useTodoStore((state) => state.todos);
    const [sortCriteria, setSortCriteria] = useState<'date' | 'priority'>('date');
    const sortedTodos=[...todos].sort((a,b)=>{
        if(sortCriteria==='date')
        {
            return (a.dueDate ? new Date(a.dueDate).getTime() : Infinity) - (b.dueDate ? new Date(b.dueDate).getTime() : Infinity);
        }
        else if (sortCriteria === 'priority') {
            const priorityOrder = { high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return 0;
    })

    return (
        <div>
            <div className="flex justify-end mb-4">
                <select
                    value={sortCriteria}
                    onChange={(e) => setSortCriteria(e.target.value as 'date' | 'priority')}
                    className="mt-2 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                    <option value="date">Sort by Date</option>
                    <option value="priority">Sort by Priority</option>
                </select>
            </div>
            <AnimatePresence>
                <div className="space-y-4">
                    {sortedTodos.map((todo) => (
                        <TodoItem key={todo.id} todo={todo} />
                    ))}
                </div>
            </AnimatePresence>
        </div>
    );
};

export default TodoList;
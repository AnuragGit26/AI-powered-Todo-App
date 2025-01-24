import React, {useEffect, useState} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Trash2, AlertCircle, ChevronDown, Tag, HelpCircle, Plus, Minus, Edit3 } from 'lucide-react';
import { useTodoStore } from '../store/todoStore';
import TodoForm from './TodoForm';
import type { Todo } from '../types';
import { ConfettiSideCannons } from './ui/ConfettiSideCannons.ts';
import {analyzeTodo} from "../services/gemini.ts";

const TodoItem: React.FC<{ todo: Todo; level?: number }> = ({ todo, level = 0 }) => {
  const { toggleTodo, removeTodo, updateTodo } = useTodoStore();
  const [expandedInsights, setExpandedInsights] = useState<string[]>([]);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(todo.title);

  const calculateTimeLeft = (dueDate: Date | null) => {
    if (!dueDate) return '';
    const now = new Date();
    const timeLeft = dueDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? `${daysLeft} days left` : 'Due today';
  };

  const toggleInsights = (id: string) => {
    setExpandedInsights(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleStatus = (id: string) => {
    updateTodo(id, { status: todo.status === 'Not Started' ? 'In progress' : 'Not Started' });
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    const analysis = await analyzeTodo(editedTitle);
    updateTodo(todo.id, { title: editedTitle, analysis });
    setIsEditing(false);
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      await handleSave();
    }
  };

  useEffect(() => {
    if(todo.completed){
      ConfettiSideCannons();
      todo.status="Completed";
    }
    else{
      todo.status="In progress";
    }
  }, [todo,todo.status]);

  return (
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -100 }}
          className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md ${level > 0 ? 'ml-8 mt-2' : 'mb-4'}`}
      >
        <div className="flex items-center gap-4">
          <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => toggleTodo(todo.id)}
              className={`p-2 rounded-full ${
                  todo.completed ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
          >
            <Check className={`w-4 h-4 ${todo.completed ? 'text-white' : 'text-gray-400'}`} />
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
              <AlertCircle className={`w-6 h-6 ${getPriorityColor(todo.priority)}`} />
              {todo.dueDate && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {calculateTimeLeft(todo.dueDate)}
                  </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {todo.status}
              </p>
              {todo.analysis && (
                  <button
                      onClick={() => toggleInsights(todo.id)}
                      className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                  >
                    {expandedInsights.includes(todo.id) ? (
                        <ChevronDown className="w-4 h-4" />
                    ) : (
                        <img src="https://svgmix.com/uploads/e567ca-google-bard.svg" alt={"Gemini"} className="w-4 h-4"/>
                    )}
                    Insights
                  </button>
              )}
              <button
                  onClick={() => setShowSubtaskForm(!showSubtaskForm)}
                  className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
              >
                {showSubtaskForm ? (
                    <Minus className="w-4 h-4" />
                ) : (
                    <Plus className="w-4 h-5" />
                )}
                Subtask
              </button>
            </div>
          </div>

          <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleEdit}
              className="p-2 text-blue-500 hover:bg-blue-100 rounded-full"
          >
            <Edit3 className="w-5 h-5" />
          </motion.button>

          <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => removeTodo(todo.id)}
              className="p-2 text-red-500 hover:bg-red-100 rounded-full"
          >
            <Trash2 className="w-5 h-5" />
          </motion.button>
        </div>

        <AnimatePresence>
          {expandedInsights.includes(todo.id) && todo.analysis && (
              <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
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

        {todo.subtasks.length > 0 && (
            <div className="mt-4 space-y-2">
              {todo.subtasks.map((subtask) => (
                  <TodoItem key={subtask.id} todo={subtask} level={level + 1} />
              ))}
            </div>
        )}
      </motion.div>
  );
};


const TodoList: React.FC = () => {
  const todos = useTodoStore((state) => state.todos);

  return (
    <AnimatePresence>
      <div className="space-y-4">
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </div>
    </AnimatePresence>
  );
};

export default TodoList;
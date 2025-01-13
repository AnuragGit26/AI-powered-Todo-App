import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2 } from 'lucide-react';
import { useTodoStore } from '../store/todoStore';
import { analyzeTodo } from '../services/gemini';
import type { Priority } from '../types';

const TodoForm: React.FC<{ parentId?: string }> = ({ parentId }) => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [priority, setPriority] = useState<Priority>('medium');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { addTodo, addSubtask } = useTodoStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsAnalyzing(true);
    const analysis = await analyzeTodo(title);
    setIsAnalyzing(false);
    
    const newTodo = {
      title: title.trim(),
      completed: false,
      dueDate,
      priority,
      analysis,
      subtasks: [],
    };
    
    if (parentId) {
      addSubtask(parentId, newTodo);
    } else {
      addTodo(newTodo);
    }
    
    setTitle('');
    setDueDate(null);
    setPriority('medium');
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className={`mb-6 space-y-4 ${parentId ? 'ml-8 mt-2' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={parentId ? "Add a subtask..." : "Add a new task..."}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute top-2.5 right-1"
              >
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <DatePicker
          selected={dueDate}
          onChange={(date) => setDueDate(date)}
          placeholderText="Due date"
          className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 bg-blue-500 text-white rounded-lg flex items-center"
          type="submit"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </div>
    </motion.form>
  );
};

export default TodoForm;
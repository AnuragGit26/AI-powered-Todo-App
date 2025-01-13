import React, {useEffect, useState} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Trash2, AlertCircle, ChevronDown, Tag, HelpCircle, Plus, Minus } from 'lucide-react';
import { useTodoStore } from '../store/todoStore';
import { format } from 'date-fns';
import TodoForm from './TodoForm';
import type { Todo } from '../types';
import { ConfettiSideCannons } from './ui/ConfettiSideCannons.ts';

const TodoItem: React.FC<{ todo: Todo; level?: number }> = ({ todo, level = 0 }) => {
  const { toggleTodo, removeTodo } = useTodoStore();
  const [expandedInsights, setExpandedInsights] = useState<string[]>([]);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);


  const toggleInsights = (id: string) => {
    setExpandedInsights(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  useEffect(() => {
    if(todo.completed){
      ConfettiSideCannons();
    }
  }, [todo]);

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
          <p className={`text-lg ${todo.completed ? 'line-through text-gray-400' : ''}`}>
            {todo.title}
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <AlertCircle className={`w-6 h-6 ${getPriorityColor(todo.priority)}`} />
            {todo.dueDate && (
              <span>Due: {format(new Date(todo.dueDate), 'PPP')}</span>
            )}
            {todo.analysis && (
              <button
                onClick={() => toggleInsights(todo.id)}
                className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
              >
                {expandedInsights.includes(todo.id) ? (
                    <ChevronDown className="w-4 h-4" />
                ) : (
                    <img src="../../src/components/assets/gemini-color.svg" alt={"Gemini"} className="w-4 h-4"/>
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
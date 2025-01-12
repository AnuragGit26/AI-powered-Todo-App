import React from 'react';
import { motion } from 'framer-motion';
import { ListTodo } from 'lucide-react';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import ThemeCustomizer from './components/ThemeCustomizer';
import { useTodoStore } from './store/todoStore';

function App() {
  const theme = useTodoStore((state) => state.theme);

  // Update document class when theme changes
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme.mode === 'dark');
  }, [theme.mode]);

  return (
    <div 
      className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8 transition-colors duration-200"
      style={{
        '--primary-color': theme.primaryColor,
        '--secondary-color': theme.secondaryColor,
      } as React.CSSProperties}
    >
      <ThemeCustomizer />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <div className="flex items-center gap-4 mb-8">
          <ListTodo className="w-10 h-10 text-blue-500" />
          <h1 className="text-4xl font-bold">Todo List</h1>
        </div>

        <TodoForm />
        <TodoList />
      </motion.div>
    </div>
  );
}

export default App;
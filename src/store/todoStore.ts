import { create } from 'zustand';
import { TodoStore, Todo } from '../types';

export const useTodoStore = create<TodoStore>((set) => ({
  todos: [],
  theme: {
    mode: 'light',
    primaryColor: '#3b82f6',
    secondaryColor: '#60a5fa',
  },
  addTodo: (todo) =>
    set((state) => ({
      todos: [
        ...state.todos,
        {
          ...todo,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          subtasks: [],
        },
      ],
    })),
  addSubtask: (parentId, subtask) =>
    set((state) => ({
      todos: state.todos.map((todo) => {
        if (todo.id === parentId) {
          return {
            ...todo,
            subtasks: [
              ...todo.subtasks,
              {
                ...subtask,
                id: crypto.randomUUID(),
                createdAt: new Date(),
                parentId,
                subtasks: [],
              },
            ],
          };
        }
        return todo;
      }),
    })),
  toggleTodo: (id) =>
    set((state) => ({
      todos: state.todos.map((todo) => {
        if (todo.id === id) {
          return { ...todo, completed: !todo.completed };
        }
        // Also check subtasks
        if (todo.subtasks.some(subtask => subtask.id === id)) {
          return {
            ...todo,
            subtasks: todo.subtasks.map(subtask =>
              subtask.id === id ? { ...subtask, completed: !subtask.completed } : subtask
            ),
          };
        }
        return todo;
      }),
    })),
  removeTodo: (id) =>
    set((state) => ({
      todos: state.todos.filter((todo) => {
        if (todo.id === id) return false;
        // Also filter out from subtasks
        todo.subtasks = todo.subtasks.filter(subtask => subtask.id !== id);
        return true;
      }),
    })),
  updateTodo: (id, updatedTodo) =>
    set((state) => ({
      todos: state.todos.map((todo) => {
        if (todo.id === id) {
          return { ...todo, ...updatedTodo };
        }
        // Also check subtasks
        if (todo.subtasks.some(subtask => subtask.id === id)) {
          return {
            ...todo,
            subtasks: todo.subtasks.map(subtask =>
              subtask.id === id ? { ...subtask, ...updatedTodo } : subtask
            ),
          };
        }
        return todo;
      }),
    })),
  setTheme: (theme) => set({ theme }),
}));
import { create } from 'zustand';
import { TodoStore, Todo, SubTodo } from '../types';

export const useTodoStore = create<TodoStore>((set) => ({
    todos: [],
    theme: {
        mode: 'light',
        primaryColor: '#53c9d9',
        secondaryColor: '#5f4ae8',
    },
    addTodo: (todo: Partial<Todo>) =>
        set((state) => ({
            todos: [
                ...state.todos,
                {
                    ...todo,
                    id: crypto.randomUUID(),
                    createdAt: new Date(),
                    subtasks: [],
                    title: todo.title || '', // Ensure title is not undefined
                } as Todo,
            ],
        })),
    addSubtask: (parentId: string, subtask: Partial<SubTodo>) =>
        set((state) => ({
            todos: state.todos.map((todo) => {
                if (todo.id === parentId) {
                    return {
                        ...todo,
                        subtasks: [
                            ...todo.subtasks || [], // Ensure subtasks is not undefined
                            {
                                ...subtask,
                                id: crypto.randomUUID(),
                                createdAt: new Date(),
                                parentId,
                                subtasks: [],
                                title: subtask.title || '', // Ensure title is not undefined
                            } as SubTodo,
                        ],
                    };
                }
                return todo;
            }),
        })),
    toggleTodo: (id: string) =>
        set((state) => ({
            todos: state.todos.map((todo) => {
                if (todo.id === id) {
                    return { ...todo, completed: !todo.completed };
                }
                // Also check subtasks
                if (todo.subtasks?.some(subtask => subtask.id === id)) {
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
    removeTodo: (id: string) =>
        set((state) => ({
            todos: state.todos.filter((todo) => {
                if (todo.id === id) return false;
                // Also filter out from subtasks
                todo.subtasks = todo.subtasks?.filter(subtask => subtask.id !== id) || [];
                return true;
            }),
        })),
    updateTodo: (id: string, updatedTodo: Partial<Todo>) =>
        set((state) => ({
            todos: state.todos.map((todo) => {
                if (todo.id === id) {
                    return { ...todo, ...updatedTodo };
                }
                // Also check subtasks
                if (todo.subtasks?.some(subtask => subtask.id === id)) {
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
    setTodos: (todos: Todo[]) => set({ todos }),
}));
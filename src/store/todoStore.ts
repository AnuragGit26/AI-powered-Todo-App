import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { TodoStore, Todo, SubTodo, userData, ThemeConfig, PomodoroSettings, PomodoroState } from '../types';

// Helper function to determine initial theme based on system preference
const getInitialTheme = (): ThemeConfig => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set appropriate document class
    if (prefersDarkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        return {
            mode: 'dark',
            primaryColor: '#3db9e5',
            secondaryColor: '#7c5bf2',
        };
    } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        return {
            mode: 'light',
            primaryColor: '#53c9d9',
            secondaryColor: '#5f4ae8',
        };
    }
};

// Default pomodoro settings
const defaultPomodoroSettings: PomodoroSettings = {
    workTime: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
};

// Default pomodoro state
const defaultPomodoroState: PomodoroState = {
    isActive: false,
    isWorkTime: true,
    timeLeft: defaultPomodoroSettings.workTime * 60,
    completedSessions: 0,
    settings: defaultPomodoroSettings,
    sessionHistory: [],
    currentLabel: '',
    autoStartNext: false,
    notificationEnabled: true,
    notificationVolume: 0.5,
    lastUpdatedAt: Date.now(),
};

// Create the store
export const useTodoStore = create<TodoStore>()(
    devtools(
        persist(
            (set, get) => ({
                todos: [],
                theme: getInitialTheme(),
                userToken: null,
                userData: null,
                
                // Pomodoro state
                pomodoro: defaultPomodoroState,
                
                setUserToken: (token: string) => set({ userToken: token }),
                setUserData: (data: userData) => set({ userData: data }),
                
                addTodo: (todo: Partial<Todo>) => 
                    set((state) => ({
                        todos: [
                            ...state.todos,
                            {
                                ...todo,
                                id: crypto.randomUUID(),
                                createdAt: new Date(),
                                subtasks: [],
                                title: todo.title || '',
                                status: todo.status || 'Not Started',
                                completed: todo.completed || false,
                                priority: todo.priority || 'medium',
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
                                        ...(todo.subtasks || []),
                                        {
                                            ...subtask,
                                            id: crypto.randomUUID(),
                                            createdAt: new Date(),
                                            parentId,
                                            title: subtask.title || '',
                                            status: subtask.status || 'Not Started',
                                            completed: subtask.completed || false,
                                        } as SubTodo,
                                    ],
                                };
                            }
                            return todo;
                        }),
                    })),
                
                removeTodo: (id: string) =>
                    set((state) => ({
                        todos: state.todos
                            .map(todo => ({
                                ...todo,
                                subtasks: todo.subtasks?.filter(subtask => subtask.id !== id) || []
                            }))
                            .filter(todo => todo.id !== id),
                    })),
                
                updateTodo: (id: string, updatedTodo: Partial<Todo>) =>
                    set((state) => ({
                        todos: state.todos.map((todo) => {
                            if (todo.id === id) {
                                return { ...todo, ...updatedTodo };
                            }
                            return todo;
                        }),
                    })),
                
                createSubtaskStore: (parentId: string, subtask: SubTodo) =>
                    set((state) => ({
                        todos: state.todos.map((todo) => {
                            if (todo.id === parentId) {
                                return {
                                    ...todo,
                                    subtasks: [...(todo.subtasks || []), subtask],
                                };
                            }
                            return todo;
                        }),
                    })),
                
                updateSubtaskStore: (parentId: string, subtaskId: string, updates: Partial<SubTodo>) =>
                    set((state) => ({
                        todos: state.todos.map((todo) => {
                            if (todo.id === parentId) {
                                return {
                                    ...todo,
                                    subtasks: (todo.subtasks || []).map((subtask) =>
                                        subtask.id === subtaskId ? { ...subtask, ...updates } : subtask
                                    ),
                                };
                            }
                            return todo;
                        }),
                    })),
                
                deleteSubtaskStore: (parentId: string, subtaskId: string) =>
                    set((state) => ({
                        todos: state.todos.map((todo) => {
                            if (todo.id === parentId) {
                                return {
                                    ...todo,
                                    subtasks: (todo.subtasks || []).filter((subtask) => subtask.id !== subtaskId),
                                };
                            }
                            return todo;
                        }),
                    })),
                
                setTodos: (todos: Todo[]) => set({ todos }),
                setTheme: (theme: ThemeConfig) => set({ theme }),
                setPomodoro: (pomodoro: PomodoroState) => set({ pomodoro }),
                
                // Pomodoro functions
                updatePomodoroState: (newState: Partial<PomodoroState>) => {
                    set((state) => ({
                        pomodoro: {
                            ...state.pomodoro,
                            ...newState,
                            lastUpdatedAt: Date.now(),
                        }
                    }));
                },
                
                resetPomodoroTimer: () => {
                    const { pomodoro } = get();
                    set({
                        pomodoro: {
                            ...pomodoro,
                            isActive: false,
                            isWorkTime: true,
                            timeLeft: pomodoro.settings.workTime * 60,
                            completedSessions: 0,
                            lastUpdatedAt: Date.now(),
                        }
                    });
                },
                
                togglePomodoroTimer: () => {
                    const { pomodoro } = get();
                    set({
                        pomodoro: {
                            ...pomodoro,
                            isActive: !pomodoro.isActive,
                            lastUpdatedAt: Date.now(),
                        }
                    });
                },
            }),
            {
                name: 'todo-storage',
                partialize: (state) => ({
                    theme: state.theme,
                    pomodoro: state.pomodoro,
                }),
            }
        )
    )
);
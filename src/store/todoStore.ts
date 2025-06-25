import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { TodoStore, Todo, SubTodo, userData, ThemeConfig, PomodoroSettings, PomodoroState, PriorityScore } from '../types';
import { pomodoroService } from '../services/pomodoroService';
import { aiPrioritizationEngine } from '../services/aiPrioritizationEngine';

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
    isPaused: false,
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
    syncedAt: Date.now(),
    deviceId: crypto.randomUUID(),
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
                    set((state) => {
                        // Ensure deviceId is always present
                        const currentDeviceId = state.pomodoro.deviceId || crypto.randomUUID();

                        return {
                            pomodoro: {
                                ...state.pomodoro,
                                ...newState,
                                deviceId: newState.deviceId || currentDeviceId, // Preserve or generate deviceId
                                lastUpdatedAt: Date.now(),
                            }
                        };
                    });
                },

                resetPomodoroTimer: () => {
                    const { pomodoro } = get();
                    // Ensure deviceId is preserved during reset
                    const deviceId = pomodoro.deviceId || crypto.randomUUID();

                    set({
                        pomodoro: {
                            ...pomodoro,
                            isActive: false,
                            isPaused: false,
                            isWorkTime: true,
                            timeLeft: pomodoro.settings.workTime * 60,
                            completedSessions: 0,
                            deviceId: deviceId, // Preserve deviceId
                            lastUpdatedAt: Date.now(),
                        }
                    });
                },

                togglePomodoroTimer: () => {
                    const { pomodoro } = get();
                    // Ensure deviceId is preserved during toggle
                    const deviceId = pomodoro.deviceId || crypto.randomUUID();

                    const newState = {
                        ...pomodoro,
                        deviceId: deviceId, // Preserve deviceId
                        lastUpdatedAt: Date.now(),
                    };

                    if (pomodoro.isActive) {
                        // Currently active, so pause it
                        newState.isActive = false;
                        newState.isPaused = true;
                    } else if (pomodoro.isPaused) {
                        // Currently paused, so resume it
                        newState.isActive = true;
                        newState.isPaused = false;
                    } else {
                        // Currently stopped, so start it
                        newState.isActive = true;
                        newState.isPaused = false;
                    }

                    set({ pomodoro: newState });
                },

                // Sync functions
                syncPomodoroState: async (userId: string) => {
                    const { pomodoro } = get();
                    try {
                        // Ensure deviceId is present before syncing
                        if (!pomodoro.deviceId) {
                            const newDeviceId = crypto.randomUUID();
                            console.warn('Device ID missing during sync, generating new one:', newDeviceId);

                            // Update the state with the new deviceId
                            set((state) => ({
                                pomodoro: {
                                    ...state.pomodoro,
                                    deviceId: newDeviceId,
                                }
                            }));

                            // Use updated state for sync
                            await pomodoroService.syncState(userId, {
                                ...pomodoro,
                                deviceId: newDeviceId,
                            });
                        } else {
                            await pomodoroService.syncState(userId, pomodoro);
                        }

                        // Mark as synced
                        set((state) => ({
                            pomodoro: {
                                ...state.pomodoro,
                                syncedAt: Date.now()
                            }
                        }));
                    } catch (error) {
                        console.error('Failed to sync pomodoro state:', error);
                    }
                },

                loadPomodoroState: async (userId: string) => {
                    try {
                        const serverState = await pomodoroService.loadState(userId);

                        if (serverState) {
                            const { pomodoro } = get();

                            // Only sync if server state is newer and from different device
                            if (serverState.lastUpdatedAt > pomodoro.lastUpdatedAt &&
                                serverState.deviceId !== pomodoro.deviceId) {
                                set({
                                    pomodoro: {
                                        ...serverState,
                                        syncedAt: Date.now(),
                                        deviceId: pomodoro.deviceId // Keep current device ID
                                    }
                                });
                            }
                        }
                    } catch (error) {
                        console.error('Failed to load pomodoro state:', error);
                    }
                },

                subscribeToPomodoroSync: (userId: string) => {
                    try {
                        return pomodoroService.subscribeToStateChanges(userId, (newState) => {
                            const { pomodoro } = get();

                            // Only update if it's from a different device and newer
                            if (newState.deviceId !== pomodoro.deviceId &&
                                newState.lastUpdatedAt > pomodoro.lastUpdatedAt) {
                                set({
                                    pomodoro: {
                                        ...newState,
                                        syncedAt: Date.now(),
                                        deviceId: pomodoro.deviceId // Keep current device ID
                                    }
                                });
                            }
                        });
                    } catch (error) {
                        console.error('Failed to subscribe to pomodoro sync:', error);
                        return null;
                    }
                },

                // AI Priority Scoring functions
                calculatePriorityScore: async (taskId: string) => {
                    const { todos, userData } = get();

                    // Try to get userId from multiple sources
                    let userId = userData?.userId;
                    if (!userId) {
                        // Fallback to localStorage
                        const storedUserId = localStorage.getItem('userId');
                        userId = storedUserId || undefined;
                    }

                    if (!userId) {
                        alert('Please log in to use AI priority scoring');
                        return;
                    }

                    // Find the task (could be main task or subtask)
                    let targetTask: Todo | SubTodo | undefined = todos.find(t => t.id === taskId);

                    if (!targetTask) {
                        // Also check subtasks
                        const parentTask = todos.find(t =>
                            t.subtasks?.some(subtask => subtask.id === taskId)
                        );
                        if (parentTask) {
                            targetTask = parentTask.subtasks?.find(s => s.id === taskId);
                        }
                    }

                    if (!targetTask) {
                        alert('Task not found');
                        return;
                    }

                    try {
                        const allTasks = todos.flatMap(todo => [todo, ...(todo.subtasks || [])]);
                        const score = await aiPrioritizationEngine.calculatePriorityScore(targetTask, allTasks, userId);

                        set((state) => ({
                            todos: state.todos.map((todo) => {
                                if (todo.id === taskId) {
                                    return { ...todo, priorityScore: score };
                                }
                                // Check subtasks
                                return {
                                    ...todo,
                                    subtasks: todo.subtasks?.map(subtask =>
                                        subtask.id === taskId ? { ...subtask, priorityScore: score } : subtask
                                    )
                                };
                            })
                        }));
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                        alert(`Error calculating priority score: ${errorMessage}`);
                    }
                },

                calculateAllPriorityScores: async () => {
                    const { todos, userData } = get();
                    if (!userData?.userId) return;

                    try {
                        const allTasks = todos.flatMap(todo => [todo, ...(todo.subtasks || [])]);
                        // Only calculate scores for incomplete tasks
                        const incompleteTasks = allTasks.filter(task => !task.completed);
                        const scores = await aiPrioritizationEngine.calculateBatchPriorityScores(incompleteTasks, userData.userId);

                        set((state) => ({
                            todos: state.todos.map((todo) => {
                                const updatedTodo = { ...todo };

                                // Update main task score
                                const todoScore = scores.get(todo.id);
                                if (todoScore) {
                                    updatedTodo.priorityScore = todoScore;
                                }

                                // Update subtask scores
                                if (updatedTodo.subtasks) {
                                    updatedTodo.subtasks = updatedTodo.subtasks.map(subtask => {
                                        const subtaskScore = scores.get(subtask.id);
                                        return subtaskScore ? { ...subtask, priorityScore: subtaskScore } : subtask;
                                    });
                                }

                                return updatedTodo;
                            })
                        }));
                    } catch (error) {
                        console.error('Error calculating all priority scores:', error);
                    }
                },

                updateTaskPriorityScore: (taskId: string, score: PriorityScore) => {
                    set((state) => ({
                        todos: state.todos.map((todo) => {
                            if (todo.id === taskId) {
                                return { ...todo, priorityScore: score };
                            }
                            // Check subtasks
                            return {
                                ...todo,
                                subtasks: todo.subtasks?.map(subtask =>
                                    subtask.id === taskId ? { ...subtask, priorityScore: score } : subtask
                                )
                            };
                        })
                    }));
                },

                getSortedTodosByPriority: () => {
                    const { todos } = get();
                    // Only sort incomplete tasks by priority
                    const incompleteTodos = todos.filter(todo => !todo.completed);
                    const completedTodos = todos.filter(todo => todo.completed);

                    const sortedIncomplete = [...incompleteTodos].sort((a, b) => {
                        const scoreA = a.priorityScore?.overall || 0;
                        const scoreB = b.priorityScore?.overall || 0;
                        return scoreB - scoreA; // Descending order (highest priority first)
                    });

                    // Return incomplete tasks first (sorted by priority), then completed tasks
                    return [...sortedIncomplete, ...completedTodos];
                },

                refreshPriorityScores: async () => {
                    const { todos, userData } = get();
                    if (!userData?.userId) return;

                    // Only refresh scores that are older than 1 hour for incomplete tasks
                    const oneHourAgo = new Date();
                    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

                    const tasksNeedingRefresh = todos.filter(todo =>
                        !todo.completed && (
                            !todo.priorityScore ||
                            new Date(todo.priorityScore.lastUpdated) < oneHourAgo
                        )
                    );

                    if (tasksNeedingRefresh.length > 0) {
                        for (const task of tasksNeedingRefresh) {
                            await get().calculatePriorityScore(task.id);

                            // Also refresh incomplete subtasks if needed
                            if (task.subtasks) {
                                for (const subtask of task.subtasks) {
                                    if (!subtask.completed && (!subtask.priorityScore || new Date(subtask.priorityScore.lastUpdated) < oneHourAgo)) {
                                        await get().calculatePriorityScore(subtask.id);
                                    }
                                }
                            }
                        }
                    }
                },
            }),
            {
                name: 'todo-storage',
                partialize: (state) => ({
                    theme: state.theme,
                    pomodoro: state.pomodoro,
                }),
                onRehydrateStorage: () => (state) => {
                    // Ensure deviceId is present after rehydration
                    if (state && state.pomodoro && !state.pomodoro.deviceId) {
                        state.pomodoro.deviceId = crypto.randomUUID();
                        console.log('Generated deviceId after rehydration:', state.pomodoro.deviceId);
                    }
                },
            }
        )
    )
);
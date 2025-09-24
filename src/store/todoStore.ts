import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { TodoStore, Todo, SubTodo, userData, ThemeConfig, PomodoroSettings, PomodoroState, PriorityScore } from '../types';
import { pomodoroService } from '../services/pomodoroService';
import { aiPrioritizationEngine } from '../services/aiPrioritizationEngine';
import { AIPriorityCache } from '../lib/cacheUtils';
import { useBillingStore } from './billingStore';

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
                                id: todo.id || crypto.randomUUID(),
                                createdAt: todo.createdAt || new Date(),
                                subtasks: todo.subtasks || [],
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
                        // Billing: enforce pomodoro session limits before starting
                        try {
                            const billing = useBillingStore.getState();
                            if (billing?.subscription) {
                                const canStart = billing.checkUsageLimits('maxPomodoroSessions');
                                if (!canStart) {
                                    alert("You've reached your Pomodoro sessions limit for your current plan. Please upgrade to continue.");
                                    return; // Abort start
                                }
                                // Increment pomodoro session usage on start
                                billing.incrementUsage('pomodoroSessions');
                            }
                        } catch (e) {
                            // Non-fatal if billing store is unavailable
                            console.warn('Pomodoro billing check failed', e);
                        }

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

                    // Billing: check AI analysis limit before computing
                    const billing = useBillingStore.getState();
                    if (!billing.subscription) {
                        alert('Subscription not initialized. Please visit Billing to set up your plan.');
                        return;
                    }
                    const canAnalyze = billing.checkUsageLimits('maxAiAnalysis');
                    if (!canAnalyze) {
                        alert("You've reached your AI analysis limit for your current plan. Please upgrade to continue.");
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
                        // Ensure we attach a timestamp and write into the AI cache so UI can read the authoritative value
                        const scoreWithTimestamp = { ...score, lastUpdated: new Date() };
                        AIPriorityCache.set(taskId, scoreWithTimestamp);

                        // Pull from cache (authoritative) and update store
                        const cachedScore = AIPriorityCache.get(taskId) || scoreWithTimestamp;

                        set((state) => ({
                            todos: state.todos.map((todo) => {
                                if (todo.id === taskId) {
                                    return { ...todo, priorityScore: cachedScore };
                                }
                                return {
                                    ...todo,
                                    subtasks: todo.subtasks?.map(subtask =>
                                        subtask.id === taskId ? { ...subtask, priorityScore: cachedScore } : subtask
                                    )
                                };
                            })
                        }));

                        try {
                            billing.incrementUsage('aiAnalysisUsed');
                        } catch (e) {
                            console.warn('Failed to increment AI analysis usage', e);
                        }
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                        alert(`Error calculating priority score: ${errorMessage}`);
                    }
                },

                calculateAllPriorityScores: async () => {
                    const { todos, userData } = get();
                    // Try to get userId from multiple sources (mirror single-task calc)
                    let userId = userData?.userId;
                    if (!userId) {
                        const storedUserId = localStorage.getItem('userId');
                        userId = storedUserId || undefined;
                    }

                    if (!userId) {
                        alert('Please log in to use AI priority scoring');
                        return;
                    }

                    // Billing: determine remaining AI analyses available
                    const billing = useBillingStore.getState();
                    if (!billing.subscription) {
                        alert('Subscription not initialized. Please visit Billing to set up your plan.');
                        return;
                    }
                    const { usage, limits } = billing.subscription;
                    const maxAi = limits.maxAiAnalysis;
                    const remainingAi = maxAi === -1 ? Number.POSITIVE_INFINITY : Math.max(0, maxAi - usage.aiAnalysisUsed);
                    if (remainingAi === 0) {
                        alert("You've reached your AI analysis limit for your current plan. Please upgrade to continue.");
                        return;
                    }

                    try {
                        const allTasks = todos.flatMap(todo => [todo, ...(todo.subtasks || [])]);
                        // Only calculate scores for incomplete tasks
                        const incompleteTasks = allTasks.filter(task => !task.completed);

                        // Respect remaining AI allowance
                        const tasksToProcess = Number.isFinite(remainingAi)
                            ? incompleteTasks.slice(0, remainingAi as number)
                            : incompleteTasks;

                        // Progress callback for UI updates
                        const onProgress = (completed: number, total: number) => {
                            console.log(`AI Calculation Progress: ${completed}/${total} tasks (${Math.round(completed / total * 100)}%)`);
                        };

                        const scores = await aiPrioritizationEngine.calculateBatchPriorityScores(tasksToProcess, userId, onProgress);
                        const now = new Date();

                        // Persist each returned score into the AIPriorityCache with a timestamp so the store can pull authoritative values
                        if (scores && typeof scores.forEach === 'function') {
                            scores.forEach((s, id) => {
                                try {
                                    AIPriorityCache.set(id, { ...s, lastUpdated: now });
                                } catch (e) {
                                    // ignore cache set failures
                                    console.warn('Failed to set AIPriorityCache for', id, e);
                                }
                            });
                        }

                        set((state) => ({
                            todos: state.todos.map((todo) => {
                                const updatedTodo = { ...todo };

                                // Prefer cached score (authoritative), fall back to scores map if needed
                                const todoScore = AIPriorityCache.get(todo.id) || (scores ? scores.get(todo.id) : undefined);
                                if (todoScore) {
                                    updatedTodo.priorityScore = { ...todoScore, lastUpdated: now };
                                }

                                // Update subtask scores (use cache first)
                                if (updatedTodo.subtasks) {
                                    updatedTodo.subtasks = updatedTodo.subtasks.map(subtask => {
                                        const subtaskScore = AIPriorityCache.get(subtask.id) || (scores ? scores.get(subtask.id) : undefined);
                                        return subtaskScore
                                            ? { ...subtask, priorityScore: { ...subtaskScore, lastUpdated: now } }
                                            : subtask;
                                    });
                                }

                                return updatedTodo;
                            })
                        }));

                        // Billing: increment usage by number of processed tasks (skip if unlimited)
                        if (Number.isFinite(remainingAi)) {
                            const processedCount = tasksToProcess.length;
                            for (let i = 0; i < processedCount; i++) {
                                try {
                                    billing.incrementUsage('aiAnalysisUsed');
                                } catch (e) {
                                    console.warn('Failed to increment AI analysis usage (batch)', e);
                                }
                            }
                        }
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

                    const parseDate = (d?: Date | string | null): number => {
                        if (!d) return Number.POSITIVE_INFINITY; // put undated tasks later
                        const dt = d instanceof Date ? d : new Date(d);
                        const t = dt.getTime();
                        return isNaN(t) ? Number.POSITIVE_INFINITY : t;
                    };

                    const getOrZero = (n?: number): number => (typeof n === 'number' ? n : 0);

                    const sortedIncomplete = [...incompleteTodos].sort((a, b) => {
                        // 1) Primary: overall descending
                        const scoreA = getOrZero(a.priorityScore?.overall);
                        const scoreB = getOrZero(b.priorityScore?.overall);
                        if (scoreB !== scoreA) return scoreB - scoreA;

                        // 2) Earlier due date first
                        const dueA = parseDate(a.dueDate);
                        const dueB = parseDate(b.dueDate);
                        if (dueA !== dueB) return dueA - dueB;

                        // 3) Higher impact first
                        const impactA = getOrZero(a.priorityScore?.impactScore);
                        const impactB = getOrZero(b.priorityScore?.impactScore);
                        if (impactB !== impactA) return impactB - impactA;

                        // 4) Lower effort first
                        const effortA = getOrZero(a.priorityScore?.effortScore);
                        const effortB = getOrZero(b.priorityScore?.effortScore);
                        if (effortA !== effortB) return effortA - effortB;

                        // 5) Earlier creation first
                        const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                        const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                        if (createdA !== createdB) return createdA - createdB;

                        // 6) Final stable tiebreaker: id lexical
                        return a.id.localeCompare(b.id);
                    });

                    // Return incomplete tasks first (sorted by priority), then completed tasks
                    return [...sortedIncomplete, ...completedTodos];
                },

                refreshPriorityScores: async () => {
                    const { todos, userData } = get();
                    // Fallback to localStorage if userData is not set
                    let userId = userData?.userId;
                    if (!userId) {
                        const storedUserId = localStorage.getItem('userId');
                        userId = storedUserId || undefined;
                    }

                    if (!userId) {
                        alert('Please log in to refresh AI priority scores');
                        return;
                    }

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
import type { SubTodo, Todo, RecurrenceConfig } from '../types';
import { useTodoStore } from "../store/todoStore";
import { logActivity } from "./activityMetrics.ts";
import { supabase } from "../lib/supabaseClient";
import { handleUUID, isValidUUID } from "../lib/utils";
import { useMutationStore } from "../store/mutationStore";

export const getTaskById = (id: string): Todo | undefined => {
    const todos = useTodoStore.getState().todos;
    for (const todo of todos) {
        if (todo.id === id) {
            return todo;
        }
        if (todo.subtasks) {
            for (const subtask of todo.subtasks) {
                if (subtask.id === id) {
                    return subtask;
                }
            }
        }
    }
    return undefined;
};

export const fetchTasks = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        console.error("User ID not available for fetching tasks");
        return null;
    }

    try {
        // Fetch all tasks
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('userId', userId);

        if (tasksError) throw tasksError;
        if (!tasks || tasks.length === 0) return null;

        // Fetch all subtasks for these tasks
        const taskIds = tasks.map(task => task.id);
        const { data: subtasks, error: subtasksError } = await supabase
            .from('subtasks')
            .select('*')
            .in('parentId', taskIds);

        if (subtasksError) throw subtasksError;

        // Group subtasks by parent ID
        const subtasksByParent = (subtasks || []).reduce((acc, subtask) => {
            if (!acc[subtask.parentId]) {
                acc[subtask.parentId] = [];
            }
            acc[subtask.parentId].push(subtask);
            return acc;
        }, {});

        // Combine tasks with their subtasks
        const tasksWithSubtasks = tasks.map(task => ({
            ...task,
            subtasks: subtasksByParent[task.id] || []
        }));

        return tasksWithSubtasks;
    } catch (error) {
        console.error('Error fetching tasks:', error);
        throw error;
    }
};

export const createTask = async (task: Todo) => {
    const { beginCrud, endCrud } = useMutationStore.getState();
    beginCrud();
    // Clone the task to avoid modifying the original object
    const taskToSave = { ...task };

    // Validate UUID format
    if (!isValidUUID(taskToSave.id)) {
        console.warn(`Invalid UUID format: ${taskToSave.id}, generating a new one.`);
        taskToSave.id = handleUUID(taskToSave.id);
    }

    // Extract subtasks before saving
    const subtasks = taskToSave.subtasks;
    delete taskToSave.subtasks;

    // Handle AI priority score serialization
    if (taskToSave.priorityScore) {
        try {
            // Ensure priority score is properly formatted for database
            taskToSave.priorityScore = {
                ...taskToSave.priorityScore,
                lastUpdated: new Date(taskToSave.priorityScore.lastUpdated)
            };
        } catch (err) {
            console.warn("Error processing priority score data:", err);
            delete taskToSave.priorityScore;
        }
    }

    // Ensure recurrence is properly formatted as JSONB for database
    if (taskToSave.recurrence) {
        try {
            // Ensure dates are serialized properly
            if (taskToSave.recurrence.endDate) {
                const endDate = new Date(taskToSave.recurrence.endDate);
                if (!isNaN(endDate.getTime())) {
                    taskToSave.recurrence.endDate = endDate;
                }
            }
        } catch (err) {
            console.warn("Error processing recurrence data:", err);
        }
    }

    try {
        // Insert the main task
        const { error } = await supabase
            .from('tasks')
            .insert([taskToSave]);

        if (error) {
            // If the error is related to lastRecurrenceDate or recurrence column not existing
            if (error.message && (error.message.includes('lastRecurrenceDate') || error.message.includes('recurrence'))) {
                console.warn(`Column not found: ${error.message}. Attempting without problematic fields.`);

                // Delete the problematic properties and try again
                if (error.message.includes('lastRecurrenceDate')) {
                    delete taskToSave.lastRecurrenceDate;
                }

                if (error.message.includes('recurrence')) {
                    delete taskToSave.recurrence;
                }

                const { error: retryError } = await supabase
                    .from('tasks')
                    .insert([taskToSave]);

                if (retryError) {
                    console.error('Error creating task (retry):', retryError);
                    return;
                }
            } else {
                console.error('Error creating task:', error);
                return;
            }
        }

        // If there are subtasks, create them (sanitize columns to match DB schema)
        if (subtasks && subtasks.length > 0) {
            const subtasksToCreate = subtasks.map((subtask) => {
                const {
                    id,
                    title,
                    completed,
                    createdAt,
                    dueDate,
                    priority,
                    analysis,
                    status,
                    completedAt,
                    estimatedTime,
                } = subtask as Partial<SubTodo>;

                return {
                    id: isValidUUID(String(id)) ? String(id) : handleUUID(id as string | undefined),
                    parentId: taskToSave.id,
                    title,
                    completed: completed ?? false,
                    createdAt,
                    dueDate,
                    priority,
                    analysis,
                    status: status ?? 'Not Started',
                    completedAt,
                    estimatedTime,
                };
            });

            const { error: subtasksError } = await supabase
                .from('subtasks')
                .insert(subtasksToCreate);

            if (subtasksError) {
                console.error('Error creating subtasks:', subtasksError);
            }
        }

        console.log('Task created:', task.id);
        const userId = localStorage.getItem('userId');
        if (userId) {
            await logActivity(userId, `Task Created ${task.title}`);
        }
    } catch (err) {
        console.error('Unexpected error creating task:', err);
    } finally {
        endCrud();
    }
};

const calculateNextDueDate = (currentDueDate: Date, recurrence: RecurrenceConfig): Date => {
    const nextDate = new Date(currentDueDate);

    switch (recurrence.frequency) {
        case 'daily':
            nextDate.setDate(nextDate.getDate() + recurrence.interval);
            break;
        case 'weekly':
            if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
                // Find the next selected day
                const currentDay = nextDate.getDay();
                const nextDay = recurrence.daysOfWeek
                    .sort((a, b) => a - b)
                    .find(day => day > currentDay) || recurrence.daysOfWeek[0];

                const daysUntilNext = (nextDay - currentDay + 7) % 7;
                nextDate.setDate(nextDate.getDate() + daysUntilNext + (recurrence.interval - 1) * 7);
            } else {
                nextDate.setDate(nextDate.getDate() + recurrence.interval * 7);
            }
            break;
        case 'monthly':
            if (recurrence.dayOfMonth) {
                nextDate.setMonth(nextDate.getMonth() + recurrence.interval);
                nextDate.setDate(recurrence.dayOfMonth);
            } else {
                nextDate.setMonth(nextDate.getMonth() + recurrence.interval);
            }
            break;
        case 'yearly':
            if (recurrence.monthOfYear) {
                nextDate.setFullYear(nextDate.getFullYear() + recurrence.interval);
                nextDate.setMonth(recurrence.monthOfYear - 1);
                if (recurrence.dayOfMonth) {
                    nextDate.setDate(recurrence.dayOfMonth);
                }
            } else {
                nextDate.setFullYear(nextDate.getFullYear() + recurrence.interval);
            }
            break;
    }

    return nextDate;
};

export const createNextRecurrence = async (task: Todo): Promise<void> => {
    if (!task.recurrence || !task.dueDate) return;

    const currentDueDate = new Date(task.dueDate);
    const nextDueDate = calculateNextDueDate(currentDueDate, task.recurrence);

    // Check if we've reached the end date
    if (task.recurrence.endDate && nextDueDate > new Date(task.recurrence.endDate)) {
        return;
    }

    const nextTask: Todo = {
        ...task,
        id: crypto.randomUUID(),
        completed: false,
        dueDate: nextDueDate,
        createdAt: new Date(),
        lastRecurrenceDate: currentDueDate,
        status: 'Not Started',
    };

    // Remove the recurrence config from the next task to prevent infinite recursion
    delete nextTask.recurrence;

    await createTask(nextTask);
};

export const updateTask = async (taskId: string, updates: Partial<Todo>) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        console.error("User ID not available for updating task");
        return;
    }

    const { beginCrud, endCrud } = useMutationStore.getState();
    beginCrud();
    try {
        // Clone the updates to avoid modifying the original object
        const updatesToApply = { ...updates };

        // Handle AI priority score serialization
        if (updatesToApply.priorityScore) {
            try {
                updatesToApply.priorityScore = {
                    ...updatesToApply.priorityScore,
                    lastUpdated: new Date(updatesToApply.priorityScore.lastUpdated)
                };
            } catch (err) {
                console.warn("Error processing priority score data during update:", err);
                delete updatesToApply.priorityScore;
            }
        }

        const { error } = await supabase
            .from('tasks')
            .update(updatesToApply)
            .eq('id', taskId).eq('userId', userId);

        if (error) {
            // If the error is related to missing columns
            if (error.message && (error.message.includes('lastRecurrenceDate') || error.message.includes('recurrence'))) {
                console.warn(`Column not found: ${error.message}. Attempting without problematic fields.`);

                // Delete the problematic properties and try again
                if (error.message.includes('lastRecurrenceDate')) {
                    delete updatesToApply.lastRecurrenceDate;
                }

                if (error.message.includes('recurrence')) {
                    delete updatesToApply.recurrence;
                }

                const { error: retryError } = await supabase
                    .from('tasks')
                    .update(updatesToApply)
                    .eq('id', taskId).eq('userId', userId);

                if (retryError) {
                    console.error('Error updating task (retry):', retryError);
                    return;
                }
            } else {
                console.error('Error updating task:', error);
                return;
            }
        }

        console.log('Task updated:', taskId);
        const changedFields = Object.keys(updates).join(', ');
        await logActivity(userId, `Task Updated: ${taskId} (Changed: ${changedFields})`);

        // If the task is completed and has recurrence, create the next occurrence
        if (updates.completed === true) {
            const task = await getTaskById(taskId);
            if (task?.recurrence) {
                await createNextRecurrence(task);
            }
        }
    } catch (err) {
        console.error('Unexpected error updating task:', err);
    } finally {
        endCrud();
    }
};

export const deleteTask = async (taskId: string) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        console.error("User ID not available for deleting task");
        return;
    }

    const { beginCrud, endCrud } = useMutationStore.getState();
    beginCrud();
    try {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId).eq('userId', userId);

        if (error) {
            console.error('Error deleting task:', error);
        } else {
            console.log('Task deleted:', taskId);
            await logActivity(userId, `Task Deleted ${taskId}`);
        }
    } finally {
        endCrud();
    }
};

export const fetchSubtasks = async (parentId: string) => {
    const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('parentId', parentId);

    if (error) throw error;
    return data;
};

export const createSubtask = async (subtask: Partial<SubTodo>) => {
    const { beginCrud, endCrud } = useMutationStore.getState();
    beginCrud();
    try {
        // Pick only columns that exist in the 'subtasks' table to avoid insert errors
        const {
            id,
            parentId,
            title,
            completed,
            createdAt,
            dueDate,
            priority,
            analysis,
            status,
            completedAt,
            estimatedTime,
            reminders,
        } = (subtask || {}) as Partial<SubTodo>;

        if (!parentId) {
            console.error('Error creating subtask: parentId is required');
            return;
        }

        const payload = {
            id: isValidUUID(String(id)) ? String(id) : handleUUID(id as string | undefined),
            parentId,
            title,
            completed: completed ?? false,
            createdAt,
            dueDate,
            priority,
            analysis,
            status: status ?? 'Not Started',
            completedAt,
            estimatedTime,
            reminders,
        };

        const { error } = await supabase
            .from('subtasks')
            .insert([payload]);

        if (error) {
            console.error('Error creating subtask:', error);
        } else {
            console.log('Subtask created:', payload.id);
            const userId = localStorage.getItem('userId');
            if (userId) {
                await logActivity(userId, `SubTask Created ${payload.id}`);
            }
        }
    } catch (e) {
        console.error('Unexpected error creating subtask:', e);
    } finally {
        endCrud();
    }
};

export const updateSubtask = async (subtaskId: string, updates: Partial<Todo>) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        console.error("User ID not available for updating subtask");
        return;
    }

    // Only pass allowed columns for subtasks table
    const {
        title,
        completed,
        createdAt,
        dueDate,
        priority,
        analysis,
        status,
        completedAt,
        estimatedTime,
        reminders,
    } = (updates || {}) as Partial<SubTodo>;

    const sanitizedUpdates = {
        ...(title !== undefined ? { title } : {}),
        ...(completed !== undefined ? { completed } : {}),
        ...(createdAt !== undefined ? { createdAt } : {}),
        ...(dueDate !== undefined ? { dueDate } : {}),
        ...(priority !== undefined ? { priority } : {}),
        ...(analysis !== undefined ? { analysis } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(completedAt !== undefined ? { completedAt } : {}),
        ...(estimatedTime !== undefined ? { estimatedTime } : {}),
        ...(reminders !== undefined ? { reminders } : {}),
    };

    const { beginCrud, endCrud } = useMutationStore.getState();
    beginCrud();
    try {
        const { error } = await supabase
            .from('subtasks')
            .update(sanitizedUpdates)
            .eq('id', subtaskId);

        if (error) {
            console.error('Error updating subtask:', error);
        } else {
            console.log('Subtask updated:', subtaskId);
            const changedFields = Object.keys(updates).join(', ');
            await logActivity(userId, `Subtask Updated: ${subtaskId} (Changed: ${changedFields})`);
        }
    } finally {
        endCrud();
    }
};

export const deleteSubtask = async (subtaskId: string) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        console.error("User ID not available for deleting subtask");
        return;
    }

    const { beginCrud, endCrud } = useMutationStore.getState();
    beginCrud();
    try {
        const { error } = await supabase
            .from('subtasks')
            .delete()
            .eq('id', subtaskId);

        if (error) {
            console.error('Error deleting subtask:', error);
        } else {
            console.log('Subtask deleted:', subtaskId);
            await logActivity(userId, `SubTask Deleted ${subtaskId}`);
        }
    } finally {
        endCrud();
    }
};
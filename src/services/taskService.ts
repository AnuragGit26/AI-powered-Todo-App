import type {SubTodo, Todo} from '../types';
import { createClient } from '@supabase/supabase-js';
import {useTodoStore} from "../store/todoStore.ts";
import {logActivity} from "./activityMetrics.ts";


const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const  userId=localStorage.getItem('userId');


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
    const { data, error } = await supabase
        .from('tasks')
        .select('*').eq('userId', userId);

    if (error) throw error;
    return !data || data.length === 0 ? null : data;
};

export const createTask = async (task: Todo) => {
    const { data, error } = await supabase
        .from('tasks')
        .insert([task]);

    if (error) {
        console.error('Error creating task:', error);
    } else {
        console.log('Task created:', task.id);
        await logActivity(localStorage.getItem('userId'),`Task Created ${task.title}`);
    }
};

export const updateTask = async (taskId: string, updates: Partial<Todo>) => {
    const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId).eq('userId', userId);

    if (error) {
        console.error('Error updating task:', error);
    } else {
        console.log('Task updated:', taskId);
        const changedFields = Object.keys(updates).join(', ');
        await logActivity(userId, `Task Updated: ${taskId} (Changed: ${changedFields})`);
    }
};

export const deleteTask = async (taskId: string) => {
    const { data, error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId).eq('userId', userId);

    if (error) {
        console.error('Error deleting task:', error);
    } else {
        console.log('Task deleted:', taskId);
        await logActivity(localStorage.getItem('userId'),`Task Deleted ${taskId}`);
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
    const { data, error } = await supabase
        .from('subtasks')
        .insert([subtask]);

    if (error) {
        console.error('Error creating subtask:', error);
    } else {
        console.log('Subtask created:', subtask.id);
        await logActivity(localStorage.getItem('userId'),`SubTask Created ${subtask?.id}`);
    }
};

export const updateSubtask = async (subtaskId: string, updates: Partial<Todo>) => {
    const { data, error } = await supabase
        .from('subtasks')
        .update(updates)
        .eq('id', subtaskId);

    if (error) {
        console.error('Error updating subtask:', error);
    } else {
        console.log('Subtask updated:',subtaskId);
        const changedFields = Object.keys(updates).join(', ');
        await logActivity(localStorage.getItem('userId'),`Subtask Updated: ${subtaskId} (Changed: ${changedFields})`);
    }
};

export const deleteSubtask = async (subtaskId: string) => {
    const { data, error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId);

    if (error) {
        console.error('Error deleting subtask:', error);
    } else {
        console.log('Subtask deleted:', subtaskId);
        await logActivity(localStorage.getItem('userId'),`SubTask Deleted ${subtaskId}`);
    }
};
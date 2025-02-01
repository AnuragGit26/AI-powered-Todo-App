import type {SubTodo, Todo} from '../types';
import { createClient } from '@supabase/supabase-js';
import {useTodoStore} from "../store/todoStore.ts";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

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
        .select('*');

    if (error) throw error;
    return data;
};

export const createTask = async (task: Todo) => {
    const { data, error } = await supabase
        .from('tasks')
        .insert([task]);

    if (error) {
        console.error('Error creating task:', error);
    } else {
        console.log('Task created:', data);
    }
};

export const updateTask = async (taskId: string, updates: Partial<Todo>) => {
    const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);

    if (error) {
        console.error('Error updating task:', error);
    } else {
        console.log('Task updated:', data);
    }
};

export const deleteTask = async (taskId: string) => {
    const { data, error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

    if (error) {
        console.error('Error deleting task:', error);
    } else {
        console.log('Task deleted:', data);
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

export const createSubtask = async (subtask: SubTodo) => {
    const { data, error } = await supabase
        .from('subtasks')
        .insert([subtask]);

    if (error) {
        console.error('Error creating subtask:', error);
    } else {
        console.log('Subtask created:', data);
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
        console.log('Subtask updated:', data);
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
        console.log('Subtask deleted:', data);
    }
};
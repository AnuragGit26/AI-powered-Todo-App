import { useQuery } from '@tanstack/react-query';
import { fetchTasks, fetchSubtasks } from '../services/taskService';

export const useTasks = () => {
    return useQuery({
        queryKey: ['tasks'],
        queryFn: async () => {
            const tasks = await fetchTasks();
            const tasksWithSubtasks = await Promise.all(
                (tasks || []).map(async (task) => {
                    const subtasks = await fetchSubtasks(task.id);
                    return { ...task, subtasks: subtasks || [] };
                })
            );
            return tasksWithSubtasks;
        },
    });
};
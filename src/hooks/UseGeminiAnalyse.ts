import { useQuery } from '@tanstack/react-query';
import { analyzeTodo } from '../services/gemini';

interface AnalyzeParams {
    title: string;
    context?: {
        type: 'task' | 'subtask';
        parentTitle?: string;
        region?: string;
    };
}

export const UseGeminiAnalyse = ({ title, context = { type: 'task' } }: AnalyzeParams) => {
    return useQuery({
        queryKey: ['analyzeTodo', title, context],
        queryFn: () => analyzeTodo(title, context),
        enabled: !!title,
        staleTime: 1000 * 60 * 60, // Cache results for 1 hour
        retry: 1, // Only retry once on failure
    });
}
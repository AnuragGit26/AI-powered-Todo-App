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

export const UseGeminiAnalyse=({ title, context = { type: 'task' } }: AnalyzeParams) =>{
    return useQuery({
        queryKey: ['analyzeTodo', title, context],
        queryFn: () => analyzeTodo(title, context),
        enabled: !!title,
    });
}
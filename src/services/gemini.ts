// File: src/services/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function analyzeTodo(
    title: string,
    context: { type: "task" | "subtask"; parentTitle?: string; region?: string } = { type: "task" }
): Promise<{ category: string; howTo: string; estimatedTime: string }> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        let prompt = `Analyze this ${context.type} with title: "${title}".`;

        if (context.type === 'subtask' && context.parentTitle) {
            prompt += ` This subtask belongs to the task: "${context.parentTitle}".`;
        }
        if (context.region) {
            prompt += ` Region: "${context.region}".`;
        }

        prompt += `
Provide three brief responses (max 1 line each):
1. Category: What category or type is it in minimum words and relating to real world ?
2. How To: A quick tip to accomplish it effectively?
3. Estimated Time: How long will it take to complete in days or hrs?`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const category = text.match(/Category:(.+?)(?=\n\d+\.\s*How To:|$)/is)?.[1]?.trim() || 'General Task';
        const howTo = text.match(/How To:(.+?)(?=\n\d+\.\s*Estimated Time:|$)/is)?.[1]?.trim() || 'No specific tips available';
        const estimatedTime = text.match(/Estimated Time:(.+?)(?=\n\d+\.\s*|$)/is)?.[1]?.trim() || 'Unknown';

        return { category, howTo, estimatedTime };
    } catch (error) {
        console.error('Error analyzing todo:', error);
        return {
            category: 'Task',
            howTo: 'Unable to analyze task at this moment.',
            estimatedTime: 'Unknown'
        };
    }
}
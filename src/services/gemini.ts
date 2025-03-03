import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function analyzeTodo(
    title: string,
    context: { type: "task" | "subtask"; parentTitle?: string; region?: string } = { type: "task" }
): Promise<{ category: string; howTo: string }> {
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
Provide two brief responses (max 1 line each):
1. Category: What category or type is it?
2. How To: A quick tip to accomplish it effectively?`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const category = text.match(/Category:(.+?)(?=How To:|$)/is)?.[1]?.trim() || 'General Task';
        const howTo = text.match(/How To:(.+?)$/is)?.[1]?.trim() || 'No specific tips available';

        return { category, howTo };
    } catch (error) {
        console.error('Error analyzing todo:', error);
        return {
            category: 'Task',
            howTo: 'Unable to analyze task at this moment.'
        };
    }
}
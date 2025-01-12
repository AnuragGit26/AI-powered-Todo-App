import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function analyzeTodo(title: string): Promise<{ category: string; howTo: string }> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const prompt = `Analyze this todo task and provide two very brief responses (max 1 line each):
    1. Category: What category/type of task is this?
    2. How To: A quick tip on how to accomplish it effectively?
    Task: "${title}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract category and howTo from the response
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
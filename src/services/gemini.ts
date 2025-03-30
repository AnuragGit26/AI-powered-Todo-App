// File: src/services/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function analyzeTodo(
    title: string,
    context: { type: "task" | "subtask"; parentTitle?: string; region?: string } = { type: "task" }
): Promise<{
    category: string;
    howTo: string;
    estimatedTime: string;
    difficulty: string;
    resources: string;
    potentialBlockers: string;
    nextSteps: string;
    resourceLinks?: { name: string, url: string, type: string }[];
}> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        let prompt = `Analyze this ${context.type} with title: "${title}".`;

        if (context.type === 'subtask' && context.parentTitle) {
            prompt += ` This subtask belongs to the task: "${context.parentTitle}".`;
        }
        if (context.region) {
            prompt += ` Consider the regional context: "${context.region}".`;
        }

        prompt += `
Please provide the following insights in a structured format to help with productivity and task completion:

1. Category: What specific category does this task fall into? (Keep it concise, max 4-6 words)
2. How To: What's the most efficient approach to accomplish this task? (1-2 sentences only)
3. Estimated Time: How long will this likely take to complete? (Be specific with hours/days)
4. Difficulty: Rate as Easy/Medium/Hard - followed by a brief explanation why (use dash separator)
5. Resources: What tools or resources would be most helpful? (List 2-3 specific ones)
6. Potential Blockers: What obstacles might delay completion? (Brief and specific)
7. Next Steps: What should be done immediately after completing this? (Clear, actionable)

Additionally, provide LOCALIZED RESOURCE LINKS based on the task and regional context ${context.region || ''}:
8. Resource Links: Provide 2-4 specific links that would be helpful for completing this task. 
   Include a mix of the following types when relevant:
   - Location links (Google Maps locations relevant to the task)
   - Learning materials (tutorials, courses, documentation)
   - Tools (software, online services, templates)
   - Reference materials (articles, guides, examples)

For Resource Links, use this format:
8. Resource Links:
   - [Link Name 1](URL1) - TYPE: brief description
   - [Link Name 2](URL2) - TYPE: brief description

FORMAT YOUR RESPONSE LIKE THIS:
1. Category: [Your concise answer]
2. How To: [Your efficient approach]
3. Estimated Time: [Your time estimate]
4. Difficulty: [Your difficulty assessment]
5. Resources: [Your resource suggestions]
6. Potential Blockers: [Your obstacle identification]
7. Next Steps: [Your follow-up recommendation]
8. Resource Links:
   - [Link Name 1](URL1) - TYPE: brief description
   - [Link Name 2](URL2) - TYPE: brief description`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Enhanced regex patterns with better handling of various response formats
        const extractContent = (fieldName: string): string => {
            // Primary pattern for numbered list format with colon
            const numberedPattern = new RegExp(`(?:^|\\n)\\s*(?:\\d+\\.\\s*)?${fieldName}:[ \\t]*(.+?)(?=\\n\\s*(?:\\d+\\.\\s*)?[A-Za-z\\s]+:|$)`, 'is');

            // Alternative pattern for non-numbered format with colon
            const simplePattern = new RegExp(`(?:^|\\n)\\s*${fieldName}:[ \\t]*(.+?)(?=\\n\\s*[A-Za-z\\s]+:|$)`, 'is');

            // Fallback pattern for content that spans multiple lines until the next section
            const multilinePattern = new RegExp(`(?:^|\\n)\\s*(?:\\d+\\.\\s*)?${fieldName}:[ \\t]*([\\s\\S]*?)(?=\\n\\s*(?:\\d+\\.\\s*)?[A-Za-z\\s]+:|$)`, 'is');

            // Try each pattern in order of specificity
            const numberedMatch = text.match(numberedPattern);
            const simpleMatch = text.match(simplePattern);
            const multilineMatch = text.match(multilinePattern);

            let content = (numberedMatch?.[1] || simpleMatch?.[1] || multilineMatch?.[1] || '').trim();

            // Clean up extra whitespace, newlines, etc.
            content = content.replace(/\n\s*-\s*/g, ', ').replace(/\n+/g, ' ').trim();

            return content;
        };

        // Extract resource links from the response
        const extractResourceLinks = (): { name: string, url: string, type: string }[] => {
            // First try to get the whole section
            const resourceLinksSection = extractContent('Resource Links');
            if (!resourceLinksSection) return [];

            const links: { name: string, url: string, type: string }[] = [];

            // Pattern 1: Look for markdown-style links [Name](URL) with TYPE information
            const markdownWithTypePattern = /\[(.*?)\]\((https?:\/\/[^\s\)]+)\)(?:.*?(?:TYPE|type):?\s*(.*?))?(?=\n|\r|$)/gi;

            // Pattern 2: Look for markdown-style links [Name](URL)
            const markdownPattern = /\[(.*?)\]\((https?:\/\/[^\s\)]+)\)/gi;

            // Pattern 3: Look for named URLs in format "Name: URL"
            const namedUrlPattern = /(.*?):\s*(https?:\/\/[^\s]+)/gi;

            // Pattern 4: Extract just URLs
            const urlPattern = /(https?:\/\/[^\s]+)/g;

            // Try pattern 1 (markdown with type)
            let match;
            let linkCount = 0;

            while ((match = markdownWithTypePattern.exec(resourceLinksSection)) !== null) {
                linkCount++;
                links.push({
                    name: match[1].trim(),
                    url: match[2].trim(),
                    type: inferResourceType(match[3]?.trim() || match[1].trim())
                });
            }

            // If no links found with pattern 1, try pattern 2
            if (linkCount === 0) {
                while ((match = markdownPattern.exec(resourceLinksSection)) !== null) {
                    linkCount++;
                    links.push({
                        name: match[1].trim(),
                        url: match[2].trim(),
                        type: inferResourceType(match[1].trim())
                    });
                }
            }

            // If still no links, try pattern 3
            if (linkCount === 0) {
                while ((match = namedUrlPattern.exec(resourceLinksSection)) !== null) {
                    linkCount++;
                    links.push({
                        name: match[1].trim(),
                        url: match[2].trim(),
                        type: inferResourceType(match[1].trim())
                    });
                }
            }

            // If still no links, try pattern 4 (just extract URLs)
            if (linkCount === 0) {
                while ((match = urlPattern.exec(resourceLinksSection)) !== null) {
                    linkCount++;
                    const url = match[1].trim();
                    links.push({
                        name: getDomainFromUrl(url),
                        url: url,
                        type: 'Resource'
                    });
                }
            }

            return links;
        };

        // Helper function to infer resource type based on name or description
        const inferResourceType = (text: string): string => {
            const lowerText = text.toLowerCase();

            if (!text) return 'Resource';

            if (lowerText.includes('map') || lowerText.includes('location')) {
                return 'Location';
            } else if (lowerText.includes('tutorial') || lowerText.includes('learn') ||
                lowerText.includes('course') || lowerText.includes('guide')) {
                return 'Learning';
            } else if (lowerText.includes('tool') || lowerText.includes('software') ||
                lowerText.includes('app') || lowerText.includes('template')) {
                return 'Tool';
            } else if (lowerText.includes('article') || lowerText.includes('document') ||
                lowerText.includes('reference') || lowerText.includes('manual')) {
                return 'Reference';
            }

            return 'Resource';
        };

        // Helper function to extract domain name from URL
        const getDomainFromUrl = (url: string): string => {
            try {
                const domain = new URL(url).hostname;
                return domain.replace('www.', '').split('.')[0];
            } catch (e) {
                return 'Resource';
            }
        };

        // Default values for when extraction fails
        const defaultValues = {
            category: 'General Task',
            howTo: 'Break this down into smaller steps and tackle each one systematically.',
            estimatedTime: 'Varies based on complexity',
            difficulty: 'Medium',
            resources: 'Project management tools, relevant documentation, online tutorials',
            potentialBlockers: 'Time constraints, knowledge gaps, technical issues',
            nextSteps: 'Review completed work and plan related tasks'
        };

        // Extract resource links
        const resourceLinks = extractResourceLinks();

        // Extract or use defaults
        return {
            category: extractContent('Category') || defaultValues.category,
            howTo: extractContent('How To') || defaultValues.howTo,
            estimatedTime: extractContent('Estimated Time') || defaultValues.estimatedTime,
            difficulty: extractContent('Difficulty') || defaultValues.difficulty,
            resources: extractContent('Resources') || defaultValues.resources,
            potentialBlockers: extractContent('Potential Blockers') || defaultValues.potentialBlockers,
            nextSteps: extractContent('Next Steps') || defaultValues.nextSteps,
            resourceLinks: resourceLinks.length > 0 ? resourceLinks : undefined
        };
    } catch (error) {
        console.error('Error analyzing todo:', error);
        return {
            category: 'Task',
            howTo: 'Unable to analyze task at this moment.',
            estimatedTime: 'Unknown',
            difficulty: 'Medium',
            resources: 'No specific resources information available',
            potentialBlockers: 'Unable to identify potential blockers',
            nextSteps: 'Plan your next task'
        };
    }
}
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Todo, SubTodo, PriorityScore, HistoricalPattern } from '../types';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export class AIPrioritizationEngine {
    private static instance: AIPrioritizationEngine;
    private historicalData: Map<string, HistoricalPattern> = new Map();

    static getInstance(): AIPrioritizationEngine {
        if (!AIPrioritizationEngine.instance) {
            AIPrioritizationEngine.instance = new AIPrioritizationEngine();
        }
        return AIPrioritizationEngine.instance;
    }

    /**
     * Calculate AI-powered priority score for a task
     */
    async calculatePriorityScore(
        task: Todo | SubTodo,
        allTasks: (Todo | SubTodo)[],
        userId: string
    ): Promise<PriorityScore> {
        try {
            // Check if Gemini API key is available
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
                return this.getFallbackScore(task);
            }

            // Get historical patterns for this user
            const historicalPattern = await this.getHistoricalPattern(userId);

            // Calculate individual scoring components
            const impactScore = await this.calculateImpactScore(task);
            const effortScore = await this.calculateEffortScore(task, historicalPattern);
            const urgencyScore = this.calculateUrgencyScore(task);
            const dependencyScore = this.calculateDependencyScore(task, allTasks);
            const workloadScore = this.calculateWorkloadScore(allTasks, userId);

            // AI-weighted overall score calculation
            const overall = await this.calculateAIWeightedScore({
                impactScore,
                effortScore,
                urgencyScore,
                dependencyScore,
                workloadScore,
                task,
                historicalPattern
            });

            const confidence = this.calculateConfidence(task, historicalPattern);

            return {
                overall,
                impactScore,
                effortScore,
                urgencyScore,
                dependencyScore,
                workloadScore,
                lastUpdated: new Date(),
                confidence
            };
        } catch {
            // Fallback to basic scoring
            return this.getFallbackScore(task);
        }
    }

    /**
     * Calculate impact score using AI analysis
     */
    private async calculateImpactScore(task: Todo | SubTodo): Promise<number> {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

            const prompt = `
        Analyze the business/personal impact of this task: "${task.title}"
        
        Consider:
        - Strategic importance and long-term benefits
        - Number of people or processes affected
        - Revenue or cost implications
        - Risk if not completed
        - Value creation potential
        
        Context:
        - Priority level: ${task.priority}
        - Estimated time: ${task.estimatedTime || 'Not specified'}
        - Due date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
        - Current status: ${task.status}
        - Impact level: ${task.impactLevel || 'Not specified'}
        
        Return ONLY a number from 0-100 representing the impact score.
        - 0-20: Minimal impact (nice to have)
        - 21-40: Low impact (minor improvement)
        - 41-60: Medium impact (noticeable benefit)
        - 61-80: High impact (significant benefit)
        - 81-100: Critical impact (essential/urgent)
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const scoreText = response.text().trim();

            const score = parseInt(scoreText.match(/\d+/)?.[0] || '50');
            return Math.max(0, Math.min(100, score));
        } catch {
            return this.getBasicImpactScore(task);
        }
    }

    /**
     * Calculate effort score based on complexity and time requirements
     */
    private async calculateEffortScore(task: Todo | SubTodo, historicalPattern?: HistoricalPattern): Promise<number> {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

            const prompt = `
        Analyze the effort required for this task: "${task.title}"
        
        Consider:
        - Technical complexity and skill requirements
        - Time investment needed
        - Resource requirements
        - Learning curve if new skills needed
        - Coordination with others required
        
        Context:
        - Estimated time: ${task.estimatedTime || 'Not specified'}
        - Effort level: ${task.effortLevel || 'Not specified'}
        - Task analysis difficulty: ${task.analysis?.difficulty || 'Not available'}
        - Historical average completion time: ${historicalPattern?.averageCompletionTime || 'No data'} hours
        - Similar tasks completed: ${historicalPattern?.similarTasksCompleted || 0}
        
        Return ONLY a number from 0-100 representing the effort score.
        - 0-20: Very low effort (quick and simple)
        - 21-40: Low effort (straightforward)
        - 41-60: Medium effort (moderate complexity)
        - 61-80: High effort (complex/time-consuming)
        - 81-100: Very high effort (extremely complex)
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const scoreText = response.text().trim();

            const score = parseInt(scoreText.match(/\d+/)?.[0] || '50');
            return Math.max(0, Math.min(100, score));
        } catch {
            return this.getBasicEffortScore(task);
        }
    }

    /**
     * Calculate urgency score based on deadline proximity with buffer calculations
     */
    private calculateUrgencyScore(task: Todo | SubTodo): number {
        if (!task.dueDate) return 20; // Low urgency if no due date

        const now = new Date();
        const dueDate = new Date(task.dueDate);
        const timeDiff = dueDate.getTime() - now.getTime();
        const daysUntilDue = timeDiff / (1000 * 3600 * 24);

        // Calculate buffer time based on estimated completion time
        const estimatedHours = this.parseEstimatedTime(task.estimatedTime);
        const bufferDays = Math.max(1, estimatedHours / 8); // Convert to days with minimum 1-day buffer

        const effectiveDaysLeft = daysUntilDue - bufferDays;

        // Urgency scoring with buffer consideration
        if (effectiveDaysLeft < 0) return 100; // Past due or within buffer zone
        if (effectiveDaysLeft < 1) return 85;  // Critical (less than 1 day after buffer)
        if (effectiveDaysLeft < 3) return 70;  // High urgency
        if (effectiveDaysLeft < 7) return 50;  // Medium urgency
        if (effectiveDaysLeft < 14) return 30; // Low urgency
        return 15; // Very low urgency
    }

    /**
     * Calculate dependency score based on blocking relationships
     */
    private calculateDependencyScore(task: Todo | SubTodo, allTasks: (Todo | SubTodo)[]): number {
        if (!task.dependencies || task.dependencies.length === 0) return 50; // Neutral if no dependencies

        let score = 50;
        const dependencies = task.dependencies;

        // Check for blocking relationships
        const blockingTasks = dependencies.filter(dep => dep.type === 'blocks').length;
        const relatedTasks = dependencies.filter(dep => dep.type === 'related_to').length;

        // Higher score if this task blocks others (should be prioritized)
        score += blockingTasks * 15;

        // Lower score if this task is blocked by others
        const blockedByIncompleteTasks = dependencies
            .filter(dep => dep.type === 'blocked_by')
            .filter(dep => {
                const blockingTask = allTasks.find(t => t.id === dep.taskId);
                return blockingTask && !blockingTask.completed;
            }).length;

        score -= blockedByIncompleteTasks * 20;

        // Slight boost for tasks with many related tasks (part of larger initiative)
        score += Math.min(relatedTasks * 5, 15);

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Calculate workload score based on current capacity
     */
    private calculateWorkloadScore(allTasks: (Todo | SubTodo)[], userId: string): number {
        const incompleteTasks = allTasks.filter(t => {
            if (!t.completed) {
                // For main todos, check if they belong to the user
                if ('userId' in t && t.userId) {
                    return t.userId === userId;
                }
                // For subtasks, they inherit the user from their parent
                return true;
            }
            return false;
        });
        const totalEstimatedHours = incompleteTasks.reduce((total, task) => {
            return total + this.parseEstimatedTime(task.estimatedTime);
        }, 0);

        // Calculate workload pressure (assuming 40 hours/week capacity)
        const weeklyCapacity = 40;
        const workloadRatio = totalEstimatedHours / weeklyCapacity;

        // Higher workload = higher priority for quick wins
        if (workloadRatio > 2) return 80; // Overloaded - prioritize efficiency
        if (workloadRatio > 1.5) return 65; // High load
        if (workloadRatio > 1) return 50; // Normal load
        if (workloadRatio > 0.5) return 35; // Light load
        return 20; // Very light load
    }

    /**
     * AI-weighted overall score calculation
     */
    private async calculateAIWeightedScore(scoreData: {
        impactScore: number;
        effortScore: number;
        urgencyScore: number;
        dependencyScore: number;
        workloadScore: number;
        task: Todo | SubTodo;
        historicalPattern?: HistoricalPattern;
    }): Promise<number> {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

            const prompt = `
        Calculate the optimal priority score by intelligently weighting these factors for task: "${scoreData.task.title}"
        
        Individual Scores:
        - Impact Score: ${scoreData.impactScore}/100 (business/personal value)
        - Effort Score: ${scoreData.effortScore}/100 (complexity/time required)
        - Urgency Score: ${scoreData.urgencyScore}/100 (deadline pressure)
        - Dependency Score: ${scoreData.dependencyScore}/100 (blocking relationships)
        - Workload Score: ${scoreData.workloadScore}/100 (current capacity)
        
        Context:
        - Task Priority: ${scoreData.task.priority}
        - Task Status: ${scoreData.task.status}
        - Historical Success Rate: ${scoreData.historicalPattern?.successRate || 'No data'}
        - User Productivity Patterns: ${scoreData.historicalPattern ? 'Available' : 'No data'}
        
        Apply intelligent weighting considering:
        - High impact + low effort = high priority (quick wins)
        - High impact + high urgency = high priority (critical tasks)
        - Tasks that unblock others = higher priority
        - Current workload affects capacity for complex tasks
        
        Return ONLY a number from 0-100 representing the final weighted priority score.
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const scoreText = response.text().trim();

            const score = parseInt(scoreText.match(/\d+/)?.[0] || '50');
            return Math.max(0, Math.min(100, score));
        } catch {
            return this.getBasicWeightedScore(scoreData);
        }
    }

    /**
     * Get or create historical pattern for user
     */
    private async getHistoricalPattern(userId: string): Promise<HistoricalPattern> {
        const existingPattern = this.historicalData.get(userId);

        if (existingPattern && this.isPatternFresh(existingPattern)) {
            return existingPattern;
        }

        // Calculate new pattern from task completion data
        // This would typically query your database for completed tasks
        const pattern: HistoricalPattern = {
            averageCompletionTime: 4, // Default 4 hours
            successRate: 0.75, // 75% success rate
            timeOfDayPreference: [9, 10, 11, 14, 15, 16], // Morning and afternoon
            dayOfWeekPreference: [1, 2, 3, 4, 5], // Weekdays
            similarTasksCompleted: 0,
            lastUpdated: new Date()
        };

        this.historicalData.set(userId, pattern);
        return pattern;
    }

    /**
     * Helper methods
     */
    private parseEstimatedTime(estimatedTime?: string | null): number {
        if (!estimatedTime) return 2; // Default 2 hours

        const timeStr = estimatedTime.toLowerCase();
        const hourMatch = timeStr.match(/(\d+(?:\.\d+)?)\s*h/);
        const dayMatch = timeStr.match(/(\d+(?:\.\d+)?)\s*d/);
        const minuteMatch = timeStr.match(/(\d+)\s*m/);

        if (hourMatch) return parseFloat(hourMatch[1]);
        if (dayMatch) return parseFloat(dayMatch[1]) * 8; // 8 hours per day
        if (minuteMatch) return parseInt(minuteMatch[1]) / 60;

        return 2; // Default fallback
    }

    private isPatternFresh(pattern: HistoricalPattern): boolean {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return pattern.lastUpdated > oneWeekAgo;
    }

    private calculateConfidence(task: Todo | SubTodo, historicalPattern?: HistoricalPattern): number {
        let confidence = 50; // Base confidence

        if (task.analysis) confidence += 20; // Has AI analysis
        if (task.estimatedTime) confidence += 15; // Has time estimate
        if (task.dueDate) confidence += 10; // Has due date
        if (historicalPattern && historicalPattern.similarTasksCompleted > 0) confidence += 20; // Historical data
        if (task.dependencies && task.dependencies.length > 0) confidence += 10; // Dependency info

        return Math.min(100, confidence);
    }

    private getFallbackScore(task: Todo | SubTodo): PriorityScore {
        const basicImpact = this.getBasicImpactScore(task);
        const basicEffort = this.getBasicEffortScore(task);
        const urgency = this.calculateUrgencyScore(task);

        return {
            overall: Math.round((basicImpact + (100 - basicEffort) + urgency) / 3),
            impactScore: basicImpact,
            effortScore: basicEffort,
            urgencyScore: urgency,
            dependencyScore: 50,
            workloadScore: 50,
            lastUpdated: new Date(),
            confidence: 30
        };
    }

    private getBasicImpactScore(task: Todo | SubTodo): number {
        const priorityMap = { high: 75, medium: 50, low: 25 };
        const impactMap = { critical: 90, high: 70, medium: 50, low: 30 };

        let score = priorityMap[task.priority] || 50;
        if (task.impactLevel) {
            score = (score + impactMap[task.impactLevel]) / 2;
        }

        return score;
    }

    private getBasicEffortScore(task: Todo | SubTodo): number {
        const effortMap = { very_high: 85, high: 65, medium: 45, low: 25 };
        const difficultyMap = { Hard: 75, Medium: 50, Easy: 25 };

        let score = 50;
        if (task.effortLevel) {
            score = effortMap[task.effortLevel];
        } else if (task.analysis?.difficulty) {
            const difficulty = task.analysis.difficulty.split(' - ')[0] as keyof typeof difficultyMap;
            score = difficultyMap[difficulty] || 50;
        }

        return score;
    }

    private getBasicWeightedScore(scoreData: {
        impactScore: number;
        effortScore: number;
        urgencyScore: number;
        dependencyScore: number;
        workloadScore: number;
    }): number {
        // Simple weighted average as fallback
        const weights = {
            impact: 0.3,
            effort: 0.2, // Inverted (lower effort = higher priority)
            urgency: 0.25,
            dependency: 0.15,
            workload: 0.1
        };

        return Math.round(
            scoreData.impactScore * weights.impact +
            (100 - scoreData.effortScore) * weights.effort + // Invert effort score
            scoreData.urgencyScore * weights.urgency +
            scoreData.dependencyScore * weights.dependency +
            scoreData.workloadScore * weights.workload
        );
    }

    /**
     * Batch calculate priority scores for multiple tasks
     */
    async calculateBatchPriorityScores(
        tasks: (Todo | SubTodo)[],
        userId: string
    ): Promise<Map<string, PriorityScore>> {
        const scores = new Map<string, PriorityScore>();

        // Process in batches to avoid API rate limits
        const batchSize = 5;
        for (let i = 0; i < tasks.length; i += batchSize) {
            const batch = tasks.slice(i, i + batchSize);
            const batchPromises = batch.map(async (task) => {
                const score = await this.calculatePriorityScore(task, tasks, userId);
                return { taskId: task.id, score };
            });

            const batchResults = await Promise.all(batchPromises);
            batchResults.forEach(({ taskId, score }) => {
                scores.set(taskId, score);
            });

            // Small delay between batches
            if (i + batchSize < tasks.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return scores;
    }

    /**
     * Update historical patterns based on task completion
     */
    updateHistoricalPattern(userId: string, completedTask: Todo | SubTodo, actualCompletionTime: number): void {
        const pattern = this.historicalData.get(userId) || {
            averageCompletionTime: actualCompletionTime,
            successRate: 1.0,
            timeOfDayPreference: [],
            dayOfWeekPreference: [],
            similarTasksCompleted: 1,
            lastUpdated: new Date()
        };

        // Update average completion time (rolling average)
        const totalTasks = pattern.similarTasksCompleted;
        pattern.averageCompletionTime = (pattern.averageCompletionTime * totalTasks + actualCompletionTime) / (totalTasks + 1);
        pattern.similarTasksCompleted += 1;
        pattern.lastUpdated = new Date();

        // Update time preferences based on completion time
        const completionHour = new Date().getHours();
        const completionDay = new Date().getDay();

        if (!pattern.timeOfDayPreference.includes(completionHour)) {
            pattern.timeOfDayPreference.push(completionHour);
        }

        if (!pattern.dayOfWeekPreference.includes(completionDay)) {
            pattern.dayOfWeekPreference.push(completionDay);
        }

        this.historicalData.set(userId, pattern);
    }
}

// Export singleton instance
export const aiPrioritizationEngine = AIPrioritizationEngine.getInstance(); 
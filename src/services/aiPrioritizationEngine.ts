import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Todo, SubTodo, PriorityScore, HistoricalPattern } from "../types";
import { AIPriorityCache } from "../lib/cacheUtils";

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
            // Check cache first (treat >1h old as stale so refresh works)
            const cachedScore = AIPriorityCache.get(task.id);
            if (cachedScore) {
                const ageMs = Date.now() - new Date(cachedScore.lastUpdated).getTime();
                const oneHour = 3600000;
                if (ageMs <= oneHour) {
                    return cachedScore;
                }
                // else fall-through to recompute a fresh score
            }

            // Check if Gemini API key is available
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const hasApi = !!apiKey;

            // Get historical patterns for this user (used for confidence and optional effort weighting)
            const historicalPattern = await this.getHistoricalPattern(userId);

            // Calculate individual scoring components
            const impactScore = hasApi
                ? await this.calculateImpactScore(task)
                : this.getBasicImpactScore(task);
            const effortScore = hasApi
                ? await this.calculateEffortScore(task, historicalPattern)
                : this.getBasicEffortScore(task);
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
                historicalPattern,
            });

            const confidence = this.calculateConfidence(task, historicalPattern);

            const priorityScore: PriorityScore = {
                overall,
                impactScore,
                effortScore,
                urgencyScore,
                dependencyScore,
                workloadScore,
                lastUpdated: new Date(),
                confidence,
            };

            // Cache the calculated score
            AIPriorityCache.set(task.id, priorityScore);

            return priorityScore;
        } catch {
            // Fallback to basic scoring
            return this.getFallbackScore(task);
        }
    }

    /**
     * Calculate impact score using AI analysis with concise prompt
     */
    private async calculateImpactScore(task: Todo | SubTodo): Promise<number> {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
            const prompt = `
Context:
- Task: "${task.title}"
- Priority: ${task.priority}
- Estimated time: ${task.estimatedTime || "Not specified"}
- Due date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Not set"}
- Status: ${task.status}
- Impact level: ${task.impactLevel || "Not specified"}

Impact score (0–100):
90–100: Transformational
80–89: Strategic
70–79: High operational
60–69: Moderate
50–59: Standard
40–49: Limited
20–39: Low
0–19: Minimal

Return only the number (0–100).
`;
            const result = await model.generateContent(prompt);
            const response = result.response;
            const scoreText = response.text().trim();
            const score = parseInt(scoreText.match(/\d+/)?.[0] || "50");
            return Math.max(0, Math.min(100, score));
        } catch {
            return this.getBasicImpactScore(task);
        }
    }

    /**
     * Calculate effort score using AI analysis with concise prompt
     */
    private async calculateEffortScore(
        task: Todo | SubTodo,
        historicalPattern?: HistoricalPattern
    ): Promise<number> {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
            const prompt = `
Context:
- Task: "${task.title}"
- Estimated time: ${task.estimatedTime || "Not specified"}
- Effort level: ${task.effortLevel || "Not specified"}
- Analysis difficulty: ${task.analysis?.difficulty || "Not available"}
- Historical avg. completion: ${historicalPattern?.averageCompletionTime || "No data"} hours
- Similar tasks completed: ${historicalPattern?.similarTasksCompleted || 0}
- User success rate: ${historicalPattern?.successRate ? (historicalPattern.successRate * 100).toFixed(1) + "%" : "No data"}

Effort score (0–100):
90–100: Extreme
80–89: Very high
70–79: High
60–69: Moderate-high
50–59: Standard
40–49: Moderate
30–39: Low
20–29: Very low
0–19: Minimal

Return only the number (0–100).
`;
            const result = await model.generateContent(prompt);
            const response = result.response;
            const scoreText = response.text().trim();
            const score = parseInt(scoreText.match(/\d+/)?.[0] || "50");
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

        // Continuous urgency scoring with buffer consideration
        // <= 0 days after buffer -> 100 (critical)
        if (effectiveDaysLeft <= 0) return 100;
        // >= 14 days after buffer -> 15 (very low)
        if (effectiveDaysLeft >= 14) return 15;
        // Linearly interpolate between 100 (at 0) to 15 (at 14)
        const t = effectiveDaysLeft / 14; // 0..1
        const score = 15 + (1 - t) * 85; // 15..100
        return Math.round(Math.max(0, Math.min(100, score)));
    }

    /**
     * Calculate dependency score based on blocking relationships
     */
    private calculateDependencyScore(
        task: Todo | SubTodo,
        allTasks: (Todo | SubTodo)[]
    ): number {
        if (!task.dependencies || task.dependencies.length === 0) return 50; // Neutral if no dependencies

        let score = 50;
        const dependencies = task.dependencies;

        // Check for blocking relationships
        const blockingTasks = dependencies.filter(
            (dep) => dep.type === "blocks"
        ).length;
        const relatedTasks = dependencies.filter(
            (dep) => dep.type === "related_to"
        ).length;

        // Higher score if this task blocks others (should be prioritized)
        score += blockingTasks * 15;

        // Lower score if this task is blocked by others
        const blockedByIncompleteTasks = dependencies
            .filter((dep) => dep.type === "blocked_by")
            .filter((dep) => {
                const blockingTask = allTasks.find((t) => t.id === dep.taskId);
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
    private calculateWorkloadScore(
        allTasks: (Todo | SubTodo)[],
        userId: string
    ): number {
        const incompleteTasks = allTasks.filter((t) => {
            if (!t.completed) {
                // For main todos, check if they belong to the user
                if ("userId" in t && t.userId) {
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
     * AI-weighted overall score calculation using concise prompt
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
        // Deterministic weighted score to avoid LLM-induced rounding collisions
        // and ensure small differences in component scores are reflected.
        try {
            return this.getBasicWeightedScore(scoreData);
        } catch {
            return this.getBasicWeightedScore(scoreData);
        }
    }

    /**
     * Get or create historical pattern for user
     */
    private async getHistoricalPattern(
        userId: string
    ): Promise<HistoricalPattern> {
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
            lastUpdated: new Date(),
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

    private calculateConfidence(
        task: Todo | SubTodo,
        historicalPattern?: HistoricalPattern
    ): number {
        let confidence = 50; // Base confidence

        if (task.analysis) confidence += 20; // Has AI analysis
        if (task.estimatedTime) confidence += 15; // Has time estimate
        if (task.dueDate) confidence += 10; // Has due date
        if (historicalPattern && historicalPattern.similarTasksCompleted > 0)
            confidence += 20; // Historical data
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
            confidence: 30,
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
            const difficulty = task.analysis.difficulty.split(
                " - "
            )[0] as keyof typeof difficultyMap;
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
            workload: 0.1,
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
     * Batch calculate priority scores for multiple tasks with aggressive rate limiting
     */
    async calculateBatchPriorityScores(
        tasks: (Todo | SubTodo)[],
        userId: string,
        onProgress?: (completed: number, total: number) => void
    ): Promise<Map<string, PriorityScore>> {
        const scores = new Map<string, PriorityScore>();

        // Check individual cached scores first
        const tasksNeedingCalculation: (Todo | SubTodo)[] = [];
        for (const task of tasks) {
            const cachedScore = AIPriorityCache.get(task.id);
            if (cachedScore) {
                const ageMs = Date.now() - new Date(cachedScore.lastUpdated).getTime();
                const oneHour = 3600000;
                if (ageMs <= oneHour) {
                    scores.set(task.id, cachedScore);
                } else {
                    tasksNeedingCalculation.push(task);
                }
            } else {
                tasksNeedingCalculation.push(task);
            }
        }

        // Report progress for cached scores
        if (onProgress) {
            onProgress(scores.size, tasks.length);
        }

        if (tasksNeedingCalculation.length === 0) {
            return scores;
        }

        // Very conservative batching to avoid rate limits
        const batchSize = 2;
        const delayBetweenBatches = 2000;
        const delayBetweenTasks = 1000;

        for (let i = 0; i < tasksNeedingCalculation.length; i += batchSize) {
            const batch = tasksNeedingCalculation.slice(i, i + batchSize);

            // Process tasks sequentially within batch to avoid overwhelming the API
            for (const task of batch) {
                try {
                    const score = await this.calculatePriorityScoreWithRetry(
                        task,
                        tasks,
                        userId
                    );
                    scores.set(task.id, score);

                    // Report progress
                    if (onProgress) {
                        onProgress(scores.size, tasks.length);
                    }

                    // Delay between individual tasks
                    await new Promise((resolve) =>
                        setTimeout(resolve, delayBetweenTasks)
                    );
                } catch (error) {
                    console.warn(
                        `Failed to calculate score for task: ${task.title}`,
                        error
                    );
                    // Use fallback score for failed tasks
                    scores.set(task.id, this.getFallbackScore(task));
                }
            }

            // Longer delay between batches
            if (i + batchSize < tasksNeedingCalculation.length) {
                await new Promise((resolve) =>
                    setTimeout(resolve, delayBetweenBatches)
                );
            }
        }

        return scores;
    }

    /**
     * Calculate priority score with retry logic for rate limits
     */
    private async calculatePriorityScoreWithRetry(
        task: Todo | SubTodo,
        allTasks: (Todo | SubTodo)[],
        userId: string,
        maxRetries: number = 3
    ): Promise<PriorityScore> {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.calculatePriorityScore(task, allTasks, userId);
            } catch (error: unknown) {
                // Check if it's a rate limit error
                const isRateLimitError =
                    (error as { status?: number })?.status === 429 ||
                    (error as { message?: string })?.message?.includes("429") ||
                    (error as { message?: string })?.message?.includes(
                        "Too Many Requests"
                    );

                if (isRateLimitError && attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 2000; // Exponential backoff: 4s, 8s, 16s
                    console.warn(
                        `Rate limit hit for task: ${task.title}. Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`
                    );
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                } else {
                    // Max retries reached or non-rate-limit error
                    if (isRateLimitError) {
                        console.error(
                            `Rate limit exceeded after ${maxRetries} attempts for task: ${task.title}. Using fallback score.`
                        );
                    } else {
                        console.warn(
                            `API error for task: ${task.title}. Using fallback score.`,
                            error
                        );
                    }
                    return this.getFallbackScore(task);
                }
            }
        }

        // Fallback if all retries failed
        return this.getFallbackScore(task);
    }

    /**
     * Update historical patterns based on task completion
     */
    updateHistoricalPattern(
        userId: string,
        _completedTask: Todo | SubTodo,
        actualCompletionTime: number
    ): void {
        const pattern = this.historicalData.get(userId) || {
            averageCompletionTime: actualCompletionTime,
            successRate: 1.0,
            timeOfDayPreference: [],
            dayOfWeekPreference: [],
            similarTasksCompleted: 1,
            lastUpdated: new Date(),
        };

        // Update average completion time (rolling average)
        const totalTasks = pattern.similarTasksCompleted;
        pattern.averageCompletionTime =
            (pattern.averageCompletionTime * totalTasks + actualCompletionTime) /
            (totalTasks + 1);
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

    /**
     * Clear expired cache entries
     */
    clearExpiredCache(): void {
        AIPriorityCache.clearExpired();
    }
}

// Export singleton instance
export const aiPrioritizationEngine = AIPrioritizationEngine.getInstance();

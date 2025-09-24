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

    // Get AI priority score
    async calculatePriorityScore(
        task: Todo | SubTodo,
        allTasks: (Todo | SubTodo)[],
        userId: string
    ): Promise<PriorityScore> {
        try {
            // Cache first (older than 1h = stale)
            const cachedScore = AIPriorityCache.get(task.id);
            if (cachedScore) {
                const ageMs = Date.now() - new Date(cachedScore.lastUpdated).getTime();
                const oneHour = 3600000;
                if (ageMs <= oneHour) {
                    return cachedScore;
                }
                // else recompute
            }

            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const hasApi = !!apiKey;

            // Get user's history (for confidence/weighting)
            const historicalPattern = await this.getHistoricalPattern(userId);

            // Parts of the score
            const impactScore = hasApi
                ? await this.calculateImpactScore(task)
                : this.getBasicImpactScore(task);
            const effortScore = hasApi
                ? await this.calculateEffortScore(task, historicalPattern)
                : this.getBasicEffortScore(task);
            const urgencyScore = this.calculateUrgencyScore(task);
            const dependencyScore = this.calculateDependencyScore(task, allTasks);
            const workloadScore = this.calculateWorkloadScore(allTasks, userId);

            // Overall (weighted)
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

            // Save to cache
            AIPriorityCache.set(task.id, priorityScore);

            return priorityScore;
        } catch {
            // Fallback basic
            return this.getFallbackScore(task);
        }
    }

    // Impact via AI
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

    // Effort via AI
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

    // Urgency from deadline + buffer
    private calculateUrgencyScore(task: Todo | SubTodo): number {
        if (!task.dueDate) return 20; // no due date => low

        const now = new Date();
        const dueDate = new Date(task.dueDate);
        const timeDiff = dueDate.getTime() - now.getTime();
        const daysUntilDue = timeDiff / (1000 * 3600 * 24);

        // Buffer from estimated time
        const estimatedHours = this.parseEstimatedTime(task.estimatedTime);
        const bufferDays = Math.max(1, estimatedHours / 8); // hours->days, min 1

        const effectiveDaysLeft = daysUntilDue - bufferDays;

        // Continuous score with buffer
        // <= 0 after buffer -> 100
        if (effectiveDaysLeft <= 0) return 100;
        // >= 14 after buffer -> 15
        if (effectiveDaysLeft >= 14) return 15;
        // Linear between 100..15
        const t = effectiveDaysLeft / 14; // 0..1
        const score = 15 + (1 - t) * 85; // 15..100
        return Math.round(Math.max(0, Math.min(100, score)));
    }

    // Dependency score
    private calculateDependencyScore(
        task: Todo | SubTodo,
        allTasks: (Todo | SubTodo)[]
    ): number {
        if (!task.dependencies || task.dependencies.length === 0) return 50; // neutral

        let score = 50;
        const dependencies = task.dependencies;

        // Count relationships
        const blockingTasks = dependencies.filter(
            (dep) => dep.type === "blocks"
        ).length;
        const relatedTasks = dependencies.filter(
            (dep) => dep.type === "related_to"
        ).length;

        // Blocks others -> higher
        score += blockingTasks * 15;

        // Blocked by others -> lower
        const blockedByIncompleteTasks = dependencies
            .filter((dep) => dep.type === "blocked_by")
            .filter((dep) => {
                const blockingTask = allTasks.find((t) => t.id === dep.taskId);
                return blockingTask && !blockingTask.completed;
            }).length;

        score -= blockedByIncompleteTasks * 20;

        // Many related -> slight boost
        score += Math.min(relatedTasks * 5, 15);

        return Math.max(0, Math.min(100, score));
    }

    // Workload score (capacity)
    private calculateWorkloadScore(
        allTasks: (Todo | SubTodo)[],
        userId: string
    ): number {
        const incompleteTasks = allTasks.filter((t) => {
            if (!t.completed) {
                // For main todos, ensure owner
                if ("userId" in t && t.userId) {
                    return t.userId === userId;
                }
                // Subtasks inherit
                return true;
            }
            return false;
        });
        const totalEstimatedHours = incompleteTasks.reduce((total, task) => {
            return total + this.parseEstimatedTime(task.estimatedTime);
        }, 0);

        // Pressure (assume 40h/week)
        const weeklyCapacity = 40;
        const workloadRatio = totalEstimatedHours / weeklyCapacity;

        // Higher load => favor quick wins
        if (workloadRatio > 2) return 80; // Overloaded - prioritize efficiency
        if (workloadRatio > 1.5) return 65; // High load
        if (workloadRatio > 1) return 50; // Normal load
        if (workloadRatio > 0.5) return 35; // Light load
        return 20; // Very light load
    }

    // Weighted overall (deterministic)
    private async calculateAIWeightedScore(scoreData: {
        impactScore: number;
        effortScore: number;
        urgencyScore: number;
        dependencyScore: number;
        workloadScore: number;
        task: Todo | SubTodo;
        historicalPattern?: HistoricalPattern;
    }): Promise<number> {
        // Deterministic weights; avoid LLM rounding quirks
        try {
            return this.getBasicWeightedScore(scoreData);
        } catch {
            return this.getBasicWeightedScore(scoreData);
        }
    }

    // Get or make user history
    private async getHistoricalPattern(
        userId: string
    ): Promise<HistoricalPattern> {
        const existingPattern = this.historicalData.get(userId);

        if (existingPattern && this.isPatternFresh(existingPattern)) {
            return existingPattern;
        }

        // New pattern from completions (normally from DB)
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

    // Helpers
    private parseEstimatedTime(estimatedTime?: string | null): number {
        if (!estimatedTime) return 2; // Default 2 hours

        const timeStr = estimatedTime.toLowerCase();
        const hourMatch = timeStr.match(/(\d+(?:\.\d+)?)\s*h/);
        const dayMatch = timeStr.match(/(\d+(?:\.\d+)?)\s*d/);
        const minuteMatch = timeStr.match(/(\d+)\s*m/);

        if (hourMatch) return parseFloat(hourMatch[1]);
        if (dayMatch) return parseFloat(dayMatch[1]) * 8; // 8h/day
        if (minuteMatch) return parseInt(minuteMatch[1]) / 60;

        return 2; // default
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
        let confidence = 50; // base

        if (task.analysis) confidence += 20; // Has AI analysis
        if (task.estimatedTime) confidence += 15; // Has time estimate
        if (task.dueDate) confidence += 10; // Has due date
        if (historicalPattern && historicalPattern.similarTasksCompleted > 0)
            confidence += 20; // history
        if (task.dependencies && task.dependencies.length > 0) confidence += 10; // deps info

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
        // Simple weighted avg
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

    // Batch calc with rate limits
    async calculateBatchPriorityScores(
        tasks: (Todo | SubTodo)[],
        userId: string,
        onProgress?: (completed: number, total: number) => void
    ): Promise<Map<string, PriorityScore>> {
        const scores = new Map<string, PriorityScore>();

        // Use cached first
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

        // Progress for cached
        if (onProgress) {
            onProgress(scores.size, tasks.length);
        }

        if (tasksNeedingCalculation.length === 0) {
            return scores;
        }

        // Conservative batching
        const batchSize = 2;
        const delayBetweenBatches = 2000;
        const delayBetweenTasks = 1000;

        for (let i = 0; i < tasksNeedingCalculation.length; i += batchSize) {
            const batch = tasksNeedingCalculation.slice(i, i + batchSize);

            // Sequential inside batch
            for (const task of batch) {
                try {
                    const score = await this.calculatePriorityScoreWithRetry(
                        task,
                        tasks,
                        userId
                    );
                    scores.set(task.id, score);

                    // Progress
                    if (onProgress) {
                        onProgress(scores.size, tasks.length);
                    }

                    // Delay per task
                    await new Promise((resolve) =>
                        setTimeout(resolve, delayBetweenTasks)
                    );
                } catch (error) {
                    console.warn(
                        `Failed to calculate score for task: ${task.title}`,
                        error
                    );
                    // Use fallback on fail
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

    // With retry for 429s
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
                // Rate limit?
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
                    // Maxed out or other error
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

        // All retries failed
        return this.getFallbackScore(task);
    }

    // Update user history from completion
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

        // Rolling avg
        const totalTasks = pattern.similarTasksCompleted;
        pattern.averageCompletionTime =
            (pattern.averageCompletionTime * totalTasks + actualCompletionTime) /
            (totalTasks + 1);
        pattern.similarTasksCompleted += 1;
        pattern.lastUpdated = new Date();

        // Update time prefs
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

    // Clear expired cache
    clearExpiredCache(): void {
        AIPriorityCache.clearExpired();
    }
}

// Singleton
export const aiPrioritizationEngine = AIPrioritizationEngine.getInstance();

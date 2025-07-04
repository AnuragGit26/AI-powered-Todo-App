import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Todo, SubTodo, PriorityScore, HistoricalPattern } from '../types';
import { AIPriorityCache } from '../lib/cacheUtils';

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
            // Check cache first
            const cachedScore = AIPriorityCache.get(task.id);
            if (cachedScore) {
                return cachedScore;
            }

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

            const priorityScore: PriorityScore = {
                overall,
                impactScore,
                effortScore,
                urgencyScore,
                dependencyScore,
                workloadScore,
                lastUpdated: new Date(),
                confidence
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
     * Calculate impact score using AI analysis with advanced research insights
     */
    private async calculateImpactScore(task: Todo | SubTodo): Promise<number> {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const prompt = `
        You are a senior strategy consultant with expertise in business impact assessment and access to current industry research. 
        
        Analyze the comprehensive business/personal impact of this task: "${task.title}"
        
        ADVANCED IMPACT ANALYSIS FRAMEWORK:
        Consider current industry benchmarks, market research, and proven impact assessment methodologies:
        
        STRATEGIC IMPACT FACTORS:
        - Strategic alignment with current industry best practices and emerging trends
        - ROI potential based on similar initiatives in the market (reference industry studies)
        - Long-term value creation and competitive advantage
        - Risk mitigation value (what industry risks does this address?)
        - Stakeholder value across multiple dimensions (customers, employees, partners, shareholders)
        
        MARKET & COMPETITIVE CONTEXT:
        - Current market conditions and how they affect this task's importance
        - Competitive landscape implications (first-mover advantage, catch-up necessity)
        - Industry disruption factors and regulatory changes
        - Economic trends and their impact on task relevance
        - Technology adoption curves and market maturity
        
        QUANTITATIVE IMPACT ASSESSMENT:
        - Revenue impact potential (direct/indirect revenue generation or cost savings)
        - Market share implications and customer acquisition/retention effects
        - Operational efficiency gains based on industry benchmarks
        - Risk reduction value (compliance, security, reputation)
        - Resource optimization and productivity improvements
        
        RESEARCH-BACKED IMPACT METRICS:
        Reference proven impact assessment frameworks like:
        - McKinsey's Value Creation Pyramid
        - Harvard Business Review's Strategic Impact Matrix
        - Balanced Scorecard methodology
        - OKR (Objectives and Key Results) impact measurement
        - Lean Startup validated learning principles
        
        Context Data:
        - Priority level: ${task.priority}
        - Estimated time: ${task.estimatedTime || 'Not specified'}
        - Due date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
        - Current status: ${task.status}
        - Impact level: ${task.impactLevel || 'Not specified'}
        
        SCORING METHODOLOGY:
        Use research-backed impact scoring based on industry benchmarks:
        
        Return ONLY a number from 0-100 representing the comprehensive impact score:
        - 90-100: Transformational impact (Industry-changing, major competitive advantage, >$1M+ value potential)
        - 80-89: Strategic impact (Significant market position improvement, major efficiency gains)
        - 70-79: High operational impact (Measurable business metrics improvement, clear ROI)
        - 60-69: Moderate impact (Noticeable improvement in key performance indicators)
        - 50-59: Standard impact (Routine business value, maintenance of current position)
        - 40-49: Limited impact (Minor improvements, incremental optimization)
        - 20-39: Low impact (Nice-to-have improvements, minimal business effect)
        - 0-19: Minimal impact (No measurable business value, purely administrative)
        
        Consider industry data: Tasks with high strategic alignment show 3.2x better ROI according to recent McKinsey studies.
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
     * Calculate effort score with advanced complexity analysis and industry benchmarks
     */
    private async calculateEffortScore(task: Todo | SubTodo, historicalPattern?: HistoricalPattern): Promise<number> {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const prompt = `
        You are an expert project complexity analyst with access to industry benchmarking data and research on task complexity assessment.
        
        Analyze the comprehensive effort required for this task: "${task.title}"
        
        ADVANCED EFFORT ANALYSIS FRAMEWORK:
        Apply proven complexity assessment methodologies and current industry research:
        
        TECHNICAL COMPLEXITY FACTORS:
        - Technical skill requirements and current market availability of expertise
        - Learning curve analysis based on industry adoption curves
        - Integration complexity with existing systems/processes
        - Quality assurance and testing requirements
        - Documentation and knowledge transfer needs
        
        RESOURCE & COORDINATION COMPLEXITY:
        - Team coordination requirements (reference Brooks' Law and team scaling research)
        - Cross-functional dependencies and communication overhead
        - External vendor/partner coordination needs
        - Approval and governance processes based on organizational complexity
        - Resource availability in current market conditions
        
        MARKET & INDUSTRY COMPLEXITY:
        - Industry-specific compliance and regulatory requirements
        - Current market conditions affecting resource availability
        - Competitive pressure and time-to-market constraints
        - Technology maturity and adoption challenges
        - Economic factors affecting project complexity
        
        RESEARCH-BACKED COMPLEXITY METRICS:
        Reference proven frameworks:
        - COCOMO (Constructive Cost Model) for software projects
        - PMBOK complexity assessment guidelines
        - Cynefin framework for problem complexity classification
        - Agile story point estimation with industry benchmarks
        - Critical Chain Project Management resource analysis
        
        Historical Performance Data:
        - Estimated time: ${task.estimatedTime || 'Not specified'}
        - Effort level: ${task.effortLevel || 'Not specified'}
        - Task analysis difficulty: ${task.analysis?.difficulty || 'Not available'}
        - Historical average completion time: ${historicalPattern?.averageCompletionTime || 'No data'} hours
        - Similar tasks completed: ${historicalPattern?.similarTasksCompleted || 0}
        - User success rate: ${historicalPattern?.successRate ? (historicalPattern.successRate * 100).toFixed(1) + '%' : 'No data'}
        
        EFFORT SCORING WITH INDUSTRY BENCHMARKS:
        Return ONLY a number from 0-100 representing the comprehensive effort score:
        
        - 90-100: Extreme complexity (Research projects, industry firsts, >6 month timelines)
        - 80-89: Very high complexity (Multi-team coordination, new technology, >3 months)
        - 70-79: High complexity (Significant learning curve, cross-functional, 1-3 months)
        - 60-69: Moderate-high complexity (Some new skills needed, 2-4 weeks)
        - 50-59: Standard complexity (Familiar domain, established processes, 1-2 weeks)
        - 40-49: Moderate complexity (Well-defined scope, some experience needed, <1 week)
        - 30-39: Low complexity (Routine tasks, established expertise, 1-3 days)
        - 20-29: Very low complexity (Quick tasks, minimal coordination, <1 day)
        - 0-19: Minimal complexity (Administrative, automated, <2 hours)
        
        Industry insight: According to Standish Group research, projects with clear complexity assessment have 31% higher success rates.
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
     * AI-weighted overall score calculation with advanced decision frameworks
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
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const prompt = `
        You are a senior strategic advisor with expertise in advanced decision-making frameworks and access to current business research on priority optimization.
        
        Calculate the optimal priority score using proven decision science methodologies for task: "${scoreData.task.title}"
        
        COMPREHENSIVE SCORING DATA:
        - Impact Score: ${scoreData.impactScore}/100 (Strategic and business value assessment)
        - Effort Score: ${scoreData.effortScore}/100 (Complexity and resource requirements)
        - Urgency Score: ${scoreData.urgencyScore}/100 (Time-sensitive deadline pressure)
        - Dependency Score: ${scoreData.dependencyScore}/100 (Blocking relationships and dependencies)
        - Workload Score: ${scoreData.workloadScore}/100 (Current capacity and resource availability)
        
        ADVANCED DECISION FRAMEWORKS TO APPLY:
        
        1. STRATEGIC PORTFOLIO OPTIMIZATION:
        - Apply BCG Growth-Share Matrix principles (Stars, Cash Cows, Question Marks, Dogs)
        - Use McKinsey 3C Framework (Customer, Competition, Company capabilities)
        - Consider Ansoff Matrix positioning (Market penetration, development, diversification)
        
        2. RESEARCH-BACKED PRIORITIZATION METHODS:
        - ICE Score methodology (Impact × Confidence × Ease) used by leading tech companies
        - RICE Framework (Reach × Impact × Confidence ÷ Effort) from Intercom/Facebook
        - MoSCoW method with quantitative weights (Must, Should, Could, Won't)
        - Weighted Shortest Job First (WSJF) from SAFe Agile framework
        
        3. BEHAVIORAL ECONOMICS CONSIDERATIONS:
        - Loss aversion principles (avoiding missed opportunities weighs 2.5x more)
        - Prospect theory applications (diminishing marginal utility)
        - Cognitive load theory (complexity impacts decision quality)
        - Sunk cost fallacy avoidance in ongoing projects
        
        4. CURRENT MARKET CONDITIONS:
        - Economic uncertainty factors (recession, inflation, market volatility)
        - Technology adoption cycles and digital transformation trends
        - Competitive landscape dynamics and first-mover advantages
        - Regulatory changes and compliance requirements
        - Workforce availability and skill market conditions
        
        PERFORMANCE CONTEXT:
        - Task Priority: ${scoreData.task.priority}
        - Current Status: ${scoreData.task.status}
        - Historical Success Rate: ${scoreData.historicalPattern?.successRate ? (scoreData.historicalPattern.successRate * 100).toFixed(1) + '%' : 'No historical data'}
        - User Performance Pattern: ${scoreData.historicalPattern ? 'Data-driven insights available' : 'No performance history'}
        - Average Completion Time: ${scoreData.historicalPattern?.averageCompletionTime || 'Unknown'} hours
        - Similar Tasks Completed: ${scoreData.historicalPattern?.similarTasksCompleted || 0}
        
        ADVANCED WEIGHTING STRATEGY:
        Apply research-backed weighting based on current business environment:
        
        QUICK WINS IDENTIFICATION (High Impact + Low Effort):
        - Multiply priority by 1.3x for tasks with >70 impact and <40 effort
        - Reference Harvard Business Review research on quick wins delivering 40% faster ROI
        
        STRATEGIC INITIATIVES (High Impact + High Urgency):
        - Multiply priority by 1.25x for critical strategic tasks
        - Consider McKinsey data showing strategic alignment increases success by 3.2x
        
        DEPENDENCY CASCADE EFFECTS:
        - Boost priority by 1.4x for tasks unblocking 3+ other tasks
        - Apply Critical Path Method principles for project dependencies  
        
        CAPACITY OPTIMIZATION:
        - Reduce complex task priority by 0.8x when workload >80%
        - Reference Agile velocity research on sustainable pace
        
        RISK-ADJUSTED SCORING:
        - Factor in probability of success based on historical patterns
        - Apply portfolio theory principles for risk-return optimization
        
        MARKET TIMING CONSIDERATIONS:
        - Increase urgency multiplier by 1.2x for tasks affected by current market conditions
        - Consider seasonal business cycles and economic indicators
        
        Return ONLY a number from 0-100 representing the sophisticated weighted priority score using these advanced frameworks.
        
        Industry benchmark: Tasks scored using multi-factor decision frameworks show 45% better completion rates and 60% higher business value realization.
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
                scores.set(task.id, cachedScore);
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
                    const score = await this.calculatePriorityScoreWithRetry(task, tasks, userId);
                    scores.set(task.id, score);

                    // Report progress
                    if (onProgress) {
                        onProgress(scores.size, tasks.length);
                    }

                    // Delay between individual tasks
                    await new Promise(resolve => setTimeout(resolve, delayBetweenTasks));
                } catch (error) {
                    console.warn(`Failed to calculate score for task: ${task.title}`, error);
                    // Use fallback score for failed tasks
                    scores.set(task.id, this.getFallbackScore(task));
                }
            }

            // Longer delay between batches
            if (i + batchSize < tasksNeedingCalculation.length) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
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
                const isRateLimitError = (
                    (error as { status?: number })?.status === 429 ||
                    (error as { message?: string })?.message?.includes('429') ||
                    (error as { message?: string })?.message?.includes('Too Many Requests')
                );

                if (isRateLimitError && attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 2000; // Exponential backoff: 4s, 8s, 16s
                    console.warn(`Rate limit hit for task: ${task.title}. Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                } else {
                    // Max retries reached or non-rate-limit error
                    if (isRateLimitError) {
                        console.error(`Rate limit exceeded after ${maxRetries} attempts for task: ${task.title}. Using fallback score.`);
                    } else {
                        console.warn(`API error for task: ${task.title}. Using fallback score.`, error);
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

    /**
     * Clear expired cache entries
     */
    clearExpiredCache(): void {
        AIPriorityCache.clearExpired();
    }
}

// Export singleton instance
export const aiPrioritizationEngine = AIPrioritizationEngine.getInstance(); 
import { useEffect, useCallback } from 'react';
import { useTodoStore } from '../store/todoStore';

export const useAIPriority = () => {
    const {
        todos,
        userData,
        refreshPriorityScores,
        calculateAllPriorityScores
    } = useTodoStore();

    // Auto-refresh stale priority scores when component mounts or todos change
    const autoRefreshScores = useCallback(async () => {
        if (!userData?.userId || todos.length === 0) return;

        // Check if any tasks have stale or missing priority scores
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 3600000); // 1 hour ago

        // Only consider incomplete tasks for scoring
        const incompleteTodos = todos.filter(todo => !todo.completed);

        const tasksNeedingScores = incompleteTodos.filter(todo =>
            !todo.priorityScore ||
            new Date(todo.priorityScore.lastUpdated) < oneHourAgo
        );

        const totalTasksNeedingScores = tasksNeedingScores.reduce((count, todo) => {
            let taskCount = 1; // Main task
            if (todo.subtasks) {
                taskCount += todo.subtasks.filter(subtask =>
                    !subtask.completed && (
                        !subtask.priorityScore ||
                        new Date(subtask.priorityScore.lastUpdated) < oneHourAgo
                    )
                ).length;
            }
            return count + taskCount;
        }, 0);

        // If more than 50% of incomplete tasks need scoring, run a batch calculation
        const totalIncompleteTasks = incompleteTodos.reduce((count, todo) => {
            const incompleteSubtasks = todo.subtasks?.filter(subtask => !subtask.completed).length || 0;
            return count + 1 + incompleteSubtasks;
        }, 0);

        if (totalTasksNeedingScores > totalIncompleteTasks * 0.5) {
            try {
                await calculateAllPriorityScores();
            } catch {
                // Silent fail for auto-calculation
            }
        } else if (totalTasksNeedingScores > 0) {
            try {
                await refreshPriorityScores();
            } catch {
                // Silent fail for auto-refresh
            }
        }
    }, [todos, userData, refreshPriorityScores, calculateAllPriorityScores]);

    // Auto-refresh on mount and when todos change (with debouncing)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            autoRefreshScores();
        }, 2000); // 2 second delay to avoid excessive API calls

        return () => clearTimeout(timeoutId);
    }, [autoRefreshScores]);

    // Smart priority score calculation based on task characteristics
    const shouldCalculatePriorityScore = useCallback((todo: any) => {
        if (!todo) return false;

        // Always calculate for high priority tasks
        if (todo.priority === 'high') return true;

        // Calculate for tasks with due dates
        if (todo.dueDate) return true;

        // Calculate for tasks with dependencies
        if (todo.dependencies && todo.dependencies.length > 0) return true;

        // Calculate for tasks with AI analysis
        if (todo.analysis) return true;

        return false;
    }, []);

    // Get priority score status for a task
    const getPriorityScoreStatus = useCallback((todo: any) => {
        if (!todo.priorityScore) {
            return {
                status: 'missing',
                message: 'No AI priority score available',
                needsCalculation: true
            };
        }

        const now = new Date();
        const scoreAge = now.getTime() - new Date(todo.priorityScore.lastUpdated).getTime();
        const oneHour = 3600000;
        const oneDay = 86400000;

        if (scoreAge > oneDay) {
            return {
                status: 'stale',
                message: 'Priority score is outdated (>1 day old)',
                needsCalculation: true
            };
        } else if (scoreAge > oneHour) {
            return {
                status: 'aging',
                message: 'Priority score is aging (>1 hour old)',
                needsCalculation: false
            };
        }

        return {
            status: 'fresh',
            message: 'Priority score is up to date',
            needsCalculation: false
        };
    }, []);

    // Get prioritized task recommendations
    const getPriorityRecommendations = useCallback(() => {
        const tasksWithScores = todos.filter(todo =>
            !todo.completed && todo.priorityScore
        );

        // Sort by AI priority score
        const sortedTasks = tasksWithScores.sort((a, b) =>
            (b.priorityScore?.overall || 0) - (a.priorityScore?.overall || 0)
        );

        return {
            topPriority: sortedTasks.slice(0, 3), // Top 3 highest priority
            quickWins: sortedTasks.filter(todo => {
                const score = todo.priorityScore;
                return score && score.impactScore >= 60 && score.effortScore <= 40;
            }).slice(0, 3), // High impact, low effort tasks
            urgent: sortedTasks.filter(todo => {
                const score = todo.priorityScore;
                return score && score.urgencyScore >= 70;
            }).slice(0, 3), // Most urgent tasks
            blockers: sortedTasks.filter(todo => {
                const score = todo.priorityScore;
                return score && score.dependencyScore >= 70;
            }).slice(0, 3) // Tasks that unblock others
        };
    }, [todos]);

    return {
        autoRefreshScores,
        shouldCalculatePriorityScore,
        getPriorityScoreStatus,
        getPriorityRecommendations
    };
}; 
import { useEffect, useCallback } from 'react';
import { useTodoStore } from '../store/todoStore';
import { aiPrioritizationEngine } from '../services/aiPrioritizationEngine';
import { AIPriorityCache } from '../lib/cacheUtils';
import type { Todo } from '../types';

export const useAIPriority = () => {
    const {
        todos,
        updateTodo,
        refreshPriorityScores,
        calculateAllPriorityScores
    } = useTodoStore();

    // Auto-populate cached scores on tasks when they load
    const populateCachedScores = useCallback(() => {
        if (!todos.length) return;

        todos.forEach(todo => {
            // Check main task for cached score
            if (!todo.priorityScore) {
                const cachedScore = AIPriorityCache.get(todo.id);
                if (cachedScore) {
                    updateTodo(todo.id, { ...todo, priorityScore: cachedScore });
                    return;
                }
            }

            // Check subtasks for cached scores
            if (todo.subtasks) {
                const updatedSubtasks = todo.subtasks.map(subtask => {
                    if (!subtask.priorityScore) {
                        const cachedScore = AIPriorityCache.get(subtask.id);
                        if (cachedScore) {
                            return { ...subtask, priorityScore: cachedScore };
                        }
                    }
                    return subtask;
                });

                // Update todo if any subtasks were updated
                const hasSubtaskUpdates = updatedSubtasks.some((subtask, index) =>
                    subtask !== todo.subtasks![index]
                );

                if (hasSubtaskUpdates) {
                    updateTodo(todo.id, { ...todo, subtasks: updatedSubtasks });
                }
            }
        });
    }, [todos, updateTodo]);

    // Auto-populate cached scores when todos change
    useEffect(() => {
        populateCachedScores();
    }, [populateCachedScores]);

    // Smart priority score calculation based on task characteristics
    const shouldCalculatePriorityScore = useCallback((todo: Todo) => {
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
    const getPriorityScoreStatus = useCallback((todo: Todo) => {
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

    // Clear expired cache entries
    const clearExpiredCache = useCallback(() => {
        aiPrioritizationEngine.clearExpiredCache();
    }, []);

    return {
        shouldCalculatePriorityScore,
        getPriorityScoreStatus,
        getPriorityRecommendations,
        clearExpiredCache,
        // Manual calculation functions (user-triggered only)
        calculateAllPriorityScores,
        refreshPriorityScores
    };
}; 
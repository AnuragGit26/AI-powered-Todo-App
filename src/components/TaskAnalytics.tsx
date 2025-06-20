"use client"

import * as React from "react"
import { TrendingUp, CheckCircle, ClipboardList, Activity } from "lucide-react"
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, TooltipProps } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card.tsx"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart"
import { useTodoStore } from "../store/todoStore"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "./ui/badge.tsx"
import { Todo, SubTodo } from "../types"

interface ChartDataItem {
    name: string;
    value: number;
    fill: string;
}

interface ChartConfigItem {
    label: string;
    color: string;
}

interface ChartConfig {
    completed: ChartConfigItem;
    pending: ChartConfigItem;
}

const flattenTodos = (items: Todo[]): (Todo | SubTodo)[] => {
    return items.reduce<(Todo | SubTodo)[]>((acc, todo) => {
        acc.push(todo)
        if (todo.subtasks && todo.subtasks.length > 0) {
            acc.push(...flattenTodos(todo.subtasks))
        }
        return acc
    }, [])
}

const TaskAnalytics: React.FC = () => {
    const todos = useTodoStore((state) => state.todos)

    const allTodos = React.useMemo(() => flattenTodos(todos), [todos])

    const totalTasks = allTodos.length
    const completedTasks = allTodos.filter((todo) => todo.completed).length
    const pendingTasks = totalTasks - completedTasks
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // More vibrant colors with gradient
    const chartData: ChartDataItem[] = [
        { name: "Completed", value: completedTasks, fill: "url(#completedGradient)" },
        { name: "Pending", value: pendingTasks, fill: "url(#pendingGradient)" },
    ]

    const chartConfig: ChartConfig = {
        completed: {
            label: "Completed",
            color: "#4ade80",
        },
        pending: {
            label: "Pending",
            color: "#fbbf24",
        },
    }

    // New helper function to get descriptive text based on completion percentage
    const getCompletionMessage = (): string => {
        if (completionPercentage === 0) return "Let's get started!";
        if (completionPercentage < 25) return "Good start!";
        if (completionPercentage < 50) return "Making progress!";
        if (completionPercentage < 75) return "Well done!";
        if (completionPercentage < 100) return "Almost there!";
        return "All tasks complete!";
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="shadow-md backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden transition-all hover:shadow-lg">
                <CardHeader className="items-center pb-1 pt-4 px-6 space-y-1">
                    <div className="flex items-center mb-1">
                        <CardTitle className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            Task Completion Progress
                        </CardTitle>
                    </div>
                    <CardDescription className="text-sm text-gray-600 dark:text-gray-300">
                        {totalTasks > 0 ? `${getCompletionMessage()} (${completedTasks}/${totalTasks})` : "No tasks yet"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-2 pb-4 px-6">
                    <div className="relative w-full h-[190px] mx-auto">
                        <ChartContainer
                            config={chartConfig}
                            className="w-full h-full"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <defs>
                                        <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#4ade80" />
                                            <stop offset="100%" stopColor="#22c55e" />
                                        </linearGradient>
                                        <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#fbbf24" />
                                            <stop offset="100%" stopColor="#f59e0b" />
                                        </linearGradient>
                                    </defs>
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Pie
                                        data={chartData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={58}
                                        outerRadius={80}
                                        strokeWidth={4}
                                        paddingAngle={2}
                                        animationDuration={750}
                                        animationBegin={250}
                                        cx="50%"
                                        cy="50%"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.fill}
                                                stroke="none"
                                            />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        {/* Centered percentage display */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={completionPercentage}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                >
                                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                                        {completionPercentage}%
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 px-6 py-3 border-t border-gray-100 dark:border-gray-700">
                    <motion.div
                        className="flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                        <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {completedTasks} Completed
                        </span>
                    </motion.div>
                    <motion.div
                        className="flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                            <ClipboardList className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {pendingTasks} Pending
                        </span>
                    </motion.div>
                </CardFooter>
            </Card>
        </motion.div>
    )
}

export default TaskAnalytics 
// In src/components/TaskAnalytics.jsx
"use client"

import * as React from "react"
import { TrendingUp, CheckCircle, ClipboardList, Activity } from "lucide-react"
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card.tsx"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart"
import { useTodoStore } from "../store/todoStore"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "./ui/badge.tsx";

const flattenTodos = (items) => {
    return items.reduce((acc, todo) => {
        acc.push(todo)
        if (todo.subtasks && todo.subtasks.length > 0) {
            acc.push(...flattenTodos(todo.subtasks))
        }
        return acc
    }, [])
}

export default function Component() {
    const todos = useTodoStore((state) => state.todos)

    const allTodos = React.useMemo(() => flattenTodos(todos), [todos])

    const totalTasks = allTodos.length
    const completedTasks = allTodos.filter((todo) => todo.completed).length
    const pendingTasks = totalTasks - completedTasks
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // More vibrant colors with gradient
    const chartData = [
        { name: "Completed", value: completedTasks, fill: "url(#completedGradient)" },
        { name: "Pending", value: pendingTasks, fill: "url(#pendingGradient)" },
    ]

    const chartConfig = {
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
    const getCompletionMessage = () => {
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
                        <Activity className="h-5 w-5 mr-2 text-indigo-500" />
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Task Completion Progress
                        </CardTitle>
                    </div>
                    <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                        {totalTasks > 0 ? `${getCompletionMessage()} (${completedTasks}/${totalTasks})` : "No tasks yet"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-2 pb-4 px-6">
                    <div className="mb-6">
                        <ChartContainer
                            config={chartConfig}
                            className="mx-auto aspect-square max-h-[190px]"
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

                        {/* Completion percentage in the center of pie */}
                        <div className="flex justify-center -mt-28 relative z-10">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={completionPercentage}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    className="text-center"
                                >
                                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                                        {completionPercentage}%
                                    </span>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Progress status message */}
                    {totalTasks > 0 && (
                        <motion.div
                            className="text-center mt-2 mb-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Badge
                                variant={completionPercentage === 100 ? "success" : "default"}
                                className={completionPercentage === 100
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"}
                            >
                                {getCompletionMessage()}
                            </Badge>
                        </motion.div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 px-6 py-3 border-t border-gray-100 dark:border-gray-700">
                    <motion.div
                        className="flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                        <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                            <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
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
                            <ClipboardList className="h-4 w-4 text-amber-500 dark:text-amber-400" />
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
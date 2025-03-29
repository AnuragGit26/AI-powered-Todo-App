// In src/components/TaskAnalytics.jsx
"use client"

import * as React from "react"
import { TrendingUp, CheckCircle, ClipboardList } from "lucide-react"
import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card.tsx"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart"
import { useTodoStore } from "../store/todoStore"

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
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // More vibrant colors with gradient
    const chartData = [
        { name: "Completed", value: completedTasks, fill: "#4ade80" },
        { name: "Pending", value: pendingTasks, fill: "#fbbf24" },
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

    return (
        <Card className="shadow-md backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden transition-all hover:shadow-lg">
            <CardHeader className="items-center pb-1 pt-4 px-6 space-y-1">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Task Completion Progress</CardTitle>
                <CardDescription className="text-sm text-gray-500 dark:text-gray-400">Overview of task progress</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 pb-8 px-6">
                <div className="mb-6">
                    <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square max-h-[190px]"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
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
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>

                    {/* Completion percentage in the center of pie */}
                    <div className="flex justify-center -mt-28 relative z-10">
                        <div className="text-center">
                            <span className="text-3xl font-bold text-gray-800 dark:text-white">{completionPercentage}%</span>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 px-6 py-3 mt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {completedTasks} Completed
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-amber-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {pendingTasks} Pending
                    </span>
                </div>
            </CardFooter>
        </Card>
    )
}
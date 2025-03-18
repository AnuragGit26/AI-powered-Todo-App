// In src/components/TaskAnalytics.jsx
"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Pie, PieChart } from "recharts"
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

    // Replace CSS variables with color hex values.
    const chartData = [
        { name: "Completed", value: completedTasks, fill: "#4CAF50" },
        { name: "Pending", value: pendingTasks, fill: "#FFC107" },
    ]

    const chartConfig = {
        completed: {
            label: "Completed",
            color: "#4CAF50",
        },
        pending: {
            label: "Pending",
            color: "#FFC107",
        },
    }

    return (
        <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
                <CardTitle>Task Completion Progress</CardTitle>
                <CardDescription>Overview of task progress</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            strokeWidth={5}
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 font-medium leading-none">
                    {totalTasks > 0 ? `Completed ${completedTasks} out of ${totalTasks} tasks` : "No tasks available"}
                    <TrendingUp className="h-4 w-4" />
                </div>
                <div className="leading-none text-muted-foreground">
                    Task status based on current progress
                </div>
            </CardFooter>
        </Card>
    )
}
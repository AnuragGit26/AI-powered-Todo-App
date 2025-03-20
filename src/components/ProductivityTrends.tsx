import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useTodoStore } from "../store/todoStore";
import { format, subWeeks, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

const ProductivityTrends: React.FC = () => {
    const todos = useTodoStore((state) => state.todos);

    const completedDates: Date[] = [];
    todos.forEach((todo) => {
        if (todo.completed && todo.completedAt) {
            completedDates.push(new Date(todo.completedAt));
        }
        if (todo.subtasks && todo.subtasks.length) {
            todo.subtasks.forEach((subtask) => {
                if (subtask.completed && subtask.completedAt) {
                    completedDates.push(new Date(subtask.completedAt));
                }
            });
        }
    });

    const weeks = [];
    const now = new Date();
    for (let i = 2; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
        const weekLabel = format(weekStart, "MMM d");
        const count = completedDates.filter((date) =>
            isWithinInterval(date, { start: weekStart, end: weekEnd })
        ).length;
        weeks.push({ week: weekLabel, count });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className='flex justify-center'>Weekly Productivity Trends</CardTitle>
                <CardDescription className='flex justify-center'>Tasks completed in past 2 weeks</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="p-0 pr-1 bg-white dark:bg-black rounded-lg shadow-sm">
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={weeks}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="week" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="#4CAF50" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProductivityTrends;
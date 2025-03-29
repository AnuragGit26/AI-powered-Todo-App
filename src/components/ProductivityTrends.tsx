import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { useTodoStore } from "../store/todoStore";
import { format, subWeeks, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { BarChart3, ArrowUpRight, CalendarRange } from "lucide-react";

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

    // Calculate trend
    const trend = weeks.length >= 2 ?
        weeks[weeks.length - 1].count - weeks[weeks.length - 2].count : 0;
    const trendPercentage = weeks.length >= 2 && weeks[weeks.length - 2].count > 0 ?
        Math.round((trend / weeks[weeks.length - 2].count) * 100) : 0;

    return (
        <Card className="shadow-md backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden transition-all hover:shadow-lg mt-6">
            <CardHeader className="items-center pb-2 space-y-0">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Weekly Productivity Trends</CardTitle>
                <CardDescription className="text-sm text-gray-500 dark:text-gray-400">Tasks completed in past 2 weeks</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg shadow-inner p-3">
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={weeks} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                    border: '1px solid #e5e7eb'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fill="url(#colorCount)"
                                activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 px-6 py-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <CalendarRange className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {weeks.reduce((sum, week) => sum + week.count, 0)} Tasks this month
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <ArrowUpRight className={`h-5 w-5 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                    <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {trend >= 0 ? '+' : ''}{trend} ({trendPercentage}%)
                    </span>
                </div>
            </CardFooter>
        </Card>
    );
};

export default ProductivityTrends;
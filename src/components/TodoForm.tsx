import React, { useState } from 'react';
import "react-datepicker/dist/react-datepicker.css";
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2 } from 'lucide-react';
import { useTodoStore } from '../store/todoStore';
import { analyzeTodo } from '../services/gemini';
import type {Priority, Status, SubTodo, Todo} from '../types';
import {createSubtask, createTask, getTaskById} from '../services/taskService';
import { Input } from "./ui/input.tsx";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "./ui/button.tsx";
import { Calendar } from "./ui/calendar.tsx";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./ui/popover.tsx";
import {cn} from "../lib/utils.ts";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "./ui/select.tsx";


const TodoForm: React.FC<{ parentId?: string }> = ({ parentId }) => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [priority, setPriority] = useState<Priority>('medium');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [status, setStatus] = useState<Status>('Not Started');
  const { addTodo } = useTodoStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsAnalyzing(true);
        let analysis;
        if (parentId) {
            const parentTask = getTaskById(parentId);
            analysis = await analyzeTodo(title, {
                type: "subtask",
                parentTitle: parentTask?.title || "Unknown",
            });
        } else {
            analysis = await analyzeTodo(title, { type: "task" });
        }
        setIsAnalyzing(false);

        const newTodo: Todo = {
            id: crypto.randomUUID(),
            title: title.trim(),
            completed: false,
            dueDate,
            status,
            priority,
            analysis,
            estimatedTime: analysis.estimatedTime,
            createdAt: new Date(),
            userId:localStorage.getItem('userId') || '1',
        };

        if (parentId) {
            const parentTask = getTaskById(parentId); // Assuming you have a function to get a task by ID
            if (parentTask && parentTask.id === parentId) {
                const newSubtask: SubTodo = {
                    id: crypto.randomUUID(),
                    title: title.trim(),
                    completed: false,
                    dueDate,
                    status,
                    priority,
                    analysis,
                    estimatedTime: analysis.estimatedTime,
                    createdAt: new Date(),
                    parentId,
                };
                useTodoStore.getState().createSubtaskStore(parentId, newSubtask);
                await createSubtask(newSubtask);
            } else {
                console.error("Parent task not found or ID mismatch");
            }
        } else {
            addTodo(newTodo);
            await createTask(newTodo);
        }

        setTitle('');
        setDueDate(null);
        setPriority('medium');
        setStatus('Not Started');


    };

  return (
      <motion.form
          onSubmit={handleSubmit}
          className={`mb-6 space-y-4 ${parentId ? 'ml-8 mt-2' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row gap-2 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur rounded-lg p-4 transition-all duration-300 animate-fadeIn">
          <div className="relative flex-auto">
            <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={parentId ? "Add a subtask..." : "Add a new task..."}
                className="w-full p-2 dark:bg-white/5 border  dark:border-white/10 backdrop-blur rounded-lg"
            />
            <AnimatePresence>
              {isAnalyzing && (
                  <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute top-2.5 right-1"
                  >
                    <Loader2 className="left-3 w-5 h-5 text-blue-500 animate-spin" />
                  </motion.div>
              )}
            </AnimatePresence>
          </div>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "w-fit justify-start text-left font-normal dark:bg-white/5 border  dark:border-white/10 backdrop-blur rounded-lg",
                            !dueDate && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon />
                        {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={dueDate || undefined}
                        onSelect={(date: Date | undefined) => setDueDate(date || null)}
                        initialFocus
                        disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                        }
                    />
                </PopoverContent>
            </Popover>
            <Select
                value={priority}
                onValueChange={(e) => setPriority(e as Priority)}>
                <SelectTrigger className="w-fit dark:bg-white/5 border  dark:border-white/10 backdrop-blur rounded-lg">
                    <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Priority</SelectLabel>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
            <Select
                value={status}
                onValueChange={(e) => setStatus(e as Status)}>
                <SelectTrigger className="w-fit dark:bg-white/5 border  dark:border-white/10 backdrop-blur rounded-lg">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Status</SelectLabel>
                        <SelectItem value="Not Started">Not Started</SelectItem>
                        <SelectItem value="In progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
          <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full md:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center justify-center transition duration-200 ease-in-out hover:bg-blue-600"
              type="submit"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.form>
  );
};

export default TodoForm;
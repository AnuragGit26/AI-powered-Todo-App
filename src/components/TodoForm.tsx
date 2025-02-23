import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2 } from 'lucide-react';
import { useTodoStore } from '../store/todoStore';
import { analyzeTodo } from '../services/gemini';
import type {Priority, Status, SubTodo, Todo} from '../types';
import {createSubtask, createTask, getTaskById} from '../services/taskService';
import { Input } from "../components/ui/input";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "../components/ui/button.tsx";
import { Calendar } from "../components/ui/calendar.tsx";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../components/ui/popover.tsx";
import {cn} from "../lib/utils.ts";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";


const TodoForm: React.FC<{ parentId?: string }> = ({ parentId }) => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [priority, setPriority] = useState<Priority>('medium');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [status, setStatus] = useState<Status>('Not Started');
  const { addTodo ,createSubtaskStore} = useTodoStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsAnalyzing(true);
        const analysis = await analyzeTodo(title);
        setIsAnalyzing(false);

        const newTodo: Todo = {
            id: crypto.randomUUID(),
            title: title.trim(),
            completed: false,
            dueDate,
            status,
            priority,
            analysis,
            createdAt: new Date(),
        };

        if (parentId) {
            const parentTask = await getTaskById(parentId); // Assuming you have a function to get a task by ID
            if (parentTask && parentTask.id === parentId) {
                const newSubtask: SubTodo = {
                    ...newTodo,
                    parentId,
                };
                //addSubtask(parentId, newSubtask);
                createSubtaskStore(parentId, newSubtask);
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
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={parentId ? "Add a subtask..." : "Add a new task..."}
                className="w-full p-2 border rounded-lg dark:bg-white dark:border-gray-200"
            />
            <AnimatePresence>
              {isAnalyzing && (
                  <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute top-2.5 right-1"
                  >
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  </motion.div>
              )}
            </AnimatePresence>
          </div>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "w-[190px] justify-start text-left font-normal",
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
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                        disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                        }
                    />
                </PopoverContent>
            </Popover>
            <Select
                value={priority}
                onValueChange={(e) => setPriority(e as Priority)}>
                <SelectTrigger className="w-[180px]">
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
                <SelectTrigger className="w-[180px]">
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
              className="w-full md:w-auto p-2 bg-blue-500 text-white rounded-lg flex items-center justify-center"
              type="submit"
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        </div>
      </motion.form>
  );
};

export default TodoForm;
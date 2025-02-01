export type Priority = 'low' | 'medium' | 'high';
export type Status = 'Not Started' | 'In progress' | 'Completed';

export interface TodoAnalysis {
  category: string;
  howTo: string;
}

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  dueDate: Date | null;
  priority: Priority;
  analysis?: TodoAnalysis;
  subtasks?: Todo[];
  parentId?: string;
  status: Status;
}

export interface SubTodo {
    id: string;
    title: string;
    completed: boolean;
    createdAt: Date;
    dueDate: Date | null;
    priority: Priority;
    analysis?: TodoAnalysis;
    parentId?: string;
    status: Status;
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
}

export interface TodoStore {
  todos: Todo[];
  theme: ThemeConfig;
  addTodo: (todo: Partial<Todo>) => void;
  addSubtask: (parentId: string, subtask: Partial<Todo>) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  updateTodo: (id: string, todo: Partial<Todo>) => void;
  setTheme: (theme: ThemeConfig) => void;
  setTodos: (todos: Todo[]) => void;
}
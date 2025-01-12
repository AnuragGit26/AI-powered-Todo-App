export type Priority = 'low' | 'medium' | 'high';

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
  subtasks: Todo[];
  parentId?: string;
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
}

export interface TodoStore {
  todos: Todo[];
  theme: ThemeConfig;
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => void;
  addSubtask: (parentId: string, subtask: Omit<Todo, 'id' | 'createdAt'>) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  updateTodo: (id: string, todo: Partial<Todo>) => void;
  setTheme: (theme: ThemeConfig) => void;
}
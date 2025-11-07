import type { RealtimeChannel } from '@supabase/supabase-js';

export type Priority = 'low' | 'medium' | 'high';
export type Status = 'Not Started' | 'In progress' | 'Completed';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | null;

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate?: Date | null;
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
  dayOfMonth?: number; // 1-31
  monthOfYear?: number; // 1-12
}

export interface ResourceLink {
  name: string;
  url: string;
  type: string;
}

export interface TodoAnalysis {
  category: string;
  howTo: string;
  estimatedTime: string;
  difficulty: string;
  resources: string;
  potentialBlockers: string;
  nextSteps: string;
  industryInsights?: string;
  marketTrends?: string;
  researchBacked?: string;
  resourceLinks?: ResourceLink[];
}

// AI Priority Scoring System
export interface PriorityScore {
  overall: number; // 0-100 overall priority score
  impactScore: number; // 0-100 based on task importance and business value
  effortScore: number; // 0-100 based on complexity and estimated time
  urgencyScore: number; // 0-100 based on deadline proximity with buffer
  dependencyScore: number; // 0-100 based on blocking relationships
  workloadScore: number; // 0-100 based on current capacity
  lastUpdated: Date;
  confidence: number; // 0-100 AI confidence in the scoring
}

export interface TaskDependency {
  taskId: string;
  type: 'blocks' | 'blocked_by' | 'related_to';
  createdAt: Date;
}

export interface HistoricalPattern {
  averageCompletionTime: number; // in hours
  successRate: number; // 0-1 percentage of completed tasks
  timeOfDayPreference: number[]; // 0-23 hours when user is most productive
  dayOfWeekPreference: number[]; // 0-6 days when user is most productive
  similarTasksCompleted: number;
  lastUpdated: Date;
}

export interface TaskReminder {
  id: string;
  taskId: string;
  reminderTime: Date;
  isActive: boolean;
  reminderType: 'due_date' | 'custom' | 'recurring';
  message?: string;
  createdAt: Date;
  lastTriggered?: Date;
}

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  dueDate: Date | string | null;
  priority: Priority;
  analysis?: TodoAnalysis;
  subtasks?: SubTodo[];
  parentId?: string;
  status: Status;
  userId?: string;
  estimatedTime?: string | null;
  completedAt?: Date | null;
  recurrence?: RecurrenceConfig;
  lastRecurrenceDate?: Date | null;
  reminders?: TaskReminder[];

  // AI Priority System
  priorityScore?: PriorityScore;
  dependencies?: TaskDependency[];
  impactLevel?: 'low' | 'medium' | 'high' | 'critical';
  effortLevel?: 'low' | 'medium' | 'high' | 'very_high';
  tags?: string[];
}

export interface SubTodo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  dueDate: Date | string | null;
  priority: Priority;
  analysis?: TodoAnalysis;
  parentId?: string;
  status: Status;
  estimatedTime?: string | null;
  completedAt?: Date | null;
  reminders?: TaskReminder[];

  // AI Priority System
  priorityScore?: PriorityScore;
  dependencies?: TaskDependency[];
  impactLevel?: 'low' | 'medium' | 'high' | 'critical';
  effortLevel?: 'low' | 'medium' | 'high' | 'very_high';
  tags?: string[];
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  fontFamily?: string;
}

export interface PomodoroSettings {
  workTime: number;
  shortBreak: number;
  longBreak: number;
  longBreakInterval: number;
}

export interface SessionHistory {
  type: 'work' | 'shortBreak' | 'longBreak';
  duration: number;
  completedAt: Date;
  label: string;
}

export interface PomodoroState {
  isActive: boolean;
  isPaused: boolean;
  isWorkTime: boolean;
  timeLeft: number;
  completedSessions: number;
  settings: PomodoroSettings;
  sessionHistory: SessionHistory[];
  currentLabel: string;
  autoStartNext: boolean;
  autoStartBreaks?: boolean;
  notificationEnabled: boolean;
  notificationVolume: number;
  soundEnabled?: boolean;
  soundVolume?: number;
  lastUpdatedAt: number;
  syncedAt?: number;
  deviceId?: string;
}

export interface TodoStore {
  todos: Todo[];
  theme: ThemeConfig;
  addTodo: (todo: Partial<Todo>) => void;
  addSubtask: (parentId: string, subtask: Partial<SubTodo>) => void;
  removeTodo: (id: string) => void;
  updateTodo: (id: string, todo: Partial<Todo>) => void;
  setTheme: (theme: ThemeConfig) => void;
  setTodos: (todos: Todo[]) => void;
  userToken: string | null;
  userData: userData | null;
  setUserToken: (token: string) => void;
  setUserData: (data: userData) => void;
  createSubtaskStore: (parentId: string, subtask: SubTodo) => void;
  updateSubtaskStore: (parentId: string, subtaskId: string, subtask: Partial<SubTodo>) => void;
  deleteSubtaskStore: (parentId: string, subtaskId: string) => void;

  // AI Analysis Settings
  aiAnalysisEnabled: boolean;
  setAiAnalysisEnabled: (enabled: boolean) => void;

  // Pomodoro Timer state
  pomodoro: PomodoroState;
  updatePomodoroState: (state: Partial<PomodoroState>) => void;
  resetPomodoroTimer: () => void;
  togglePomodoroTimer: () => void;
  syncPomodoroState: (userId: string) => Promise<void>;
  loadPomodoroState: (userId: string) => Promise<void>;
  subscribeToPomodoroSync: (userId: string) => RealtimeChannel | null;

  // AI Priority Scoring
  calculatePriorityScore: (taskId: string) => Promise<void>;
  calculateAllPriorityScores: () => Promise<void>;
  updateTaskPriorityScore: (taskId: string, score: PriorityScore) => void;
  getSortedTodosByPriority: () => Todo[];
  refreshPriorityScores: () => Promise<void>;

  // Task Reminders
  scheduleTaskReminders: (taskId: string) => void;
  cancelTaskReminders: (taskId: string) => void;
  updateTaskReminders: (taskId: string, reminders: TaskReminder[]) => void;
  scheduleAllReminders: () => void;
  addDefaultRemindersToAllTasks: () => void;
}

export interface userData {
  username?: string;
  userId: string;
  profilePicture?: string;
  email?: string;
  phoneNumber?: string;

}

// Billing and Subscription Types
export type SubscriptionTier = 'free' | 'premium' | 'enterprise';
export type BillingInterval = 'monthly' | 'yearly';
export type PaymentStatus = 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing';

export interface PricingPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price: number;
  interval: BillingInterval;
  features: string[];
  popular?: boolean;
  stripePriceId?: string;
  comingSoon?: boolean;
}

export interface SubscriptionUsage {
  tasksCreated: number;
  aiAnalysisUsed: number;
  pomodoroSessions: number;
  integrationsSynced: number;
  teamMembersInvited: number;
}

export interface SubscriptionLimits {
  maxTasks: number;
  maxAiAnalysis: number;
  maxPomodoroSessions: number;
  maxIntegrations: number;
  maxTeamMembers: number;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customThemes: boolean;
  offlineSync: boolean;
  voiceToTask: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: PaymentStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  usage: SubscriptionUsage;
  limits: SubscriptionLimits;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank_transfer';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  stripePaymentMethodId?: string;
}

export interface BillingInvoice {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  invoiceDate: Date;
  dueDate: Date;
  downloadUrl?: string;
  stripeInvoiceId?: string;
}

export interface BillingStore {
  subscription: Subscription | null;
  paymentMethods: PaymentMethod[];
  invoices: BillingInvoice[];
  isLoading: boolean;
  error: string | null;
  setSubscription: (subscription: Subscription | null) => void;
  setPaymentMethods: (methods: PaymentMethod[]) => void;
  setInvoices: (invoices: BillingInvoice[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  checkUsageLimits: (feature: keyof SubscriptionLimits) => boolean;
  incrementUsage: (feature: keyof SubscriptionUsage) => void;
}
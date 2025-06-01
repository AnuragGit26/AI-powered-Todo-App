import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  BillingStore, 
  Subscription, 
  PaymentMethod, 
  BillingInvoice, 
  SubscriptionLimits, 
  SubscriptionUsage,
  SubscriptionTier 
} from '../types';

// Default limits for each tier
const getDefaultLimits = (tier: SubscriptionTier): SubscriptionLimits => {
  switch (tier) {
    case 'free':
      return {
        maxTasks: 50,
        maxAiAnalysis: 10,
        maxPomodoroSessions: -1, // unlimited
        maxIntegrations: 1,
        maxTeamMembers: 0,
        advancedAnalytics: false,
        prioritySupport: false,
        customThemes: false,
        offlineSync: false,
        voiceToTask: false,
      };
    case 'premium':
      return {
        maxTasks: 1000,
        maxAiAnalysis: 500,
        maxPomodoroSessions: -1, // unlimited
        maxIntegrations: 10,
        maxTeamMembers: 5,
        advancedAnalytics: true,
        prioritySupport: true,
        customThemes: true,
        offlineSync: true,
        voiceToTask: true,
      };
    case 'enterprise':
      return {
        maxTasks: -1, // unlimited
        maxAiAnalysis: -1, // unlimited
        maxPomodoroSessions: -1, // unlimited
        maxIntegrations: -1, // unlimited
        maxTeamMembers: -1, // unlimited
        advancedAnalytics: true,
        prioritySupport: true,
        customThemes: true,
        offlineSync: true,
        voiceToTask: true,
      };
    default:
      return getDefaultLimits('free');
  }
};

const getDefaultUsage = (): SubscriptionUsage => ({
  tasksCreated: 0,
  aiAnalysisUsed: 0,
  pomodoroSessions: 0,
  integrationsSynced: 0,
  teamMembersInvited: 0,
});

export const useBillingStore = create<BillingStore>()(
  persist(
    (set, get) => ({
      subscription: null,
      paymentMethods: [],
      invoices: [],
      isLoading: false,
      error: null,

      setSubscription: (subscription) => set({ subscription }),
      
      setPaymentMethods: (paymentMethods) => set({ paymentMethods }),
      
      setInvoices: (invoices) => set({ invoices }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),

      checkUsageLimits: (feature) => {
        const { subscription } = get();
        if (!subscription) return false;

        const { usage, limits } = subscription;
        
        switch (feature) {
          case 'maxTasks':
            return limits.maxTasks === -1 || usage.tasksCreated < limits.maxTasks;
          case 'maxAiAnalysis':
            return limits.maxAiAnalysis === -1 || usage.aiAnalysisUsed < limits.maxAiAnalysis;
          case 'maxPomodoroSessions':
            return limits.maxPomodoroSessions === -1 || usage.pomodoroSessions < limits.maxPomodoroSessions;
          case 'maxIntegrations':
            return limits.maxIntegrations === -1 || usage.integrationsSynced < limits.maxIntegrations;
          case 'maxTeamMembers':
            return limits.maxTeamMembers === -1 || usage.teamMembersInvited < limits.maxTeamMembers;
          default:
            return Boolean(limits[feature]);
        }
      },

      incrementUsage: (feature) => {
        const { subscription } = get();
        if (!subscription) return;

        const updatedUsage = { ...subscription.usage };
        updatedUsage[feature] += 1;

        set({
          subscription: {
            ...subscription,
            usage: updatedUsage,
          }
        });
      },
    }),
    {
      name: 'billing-storage',
      partialize: (state) => ({
        subscription: state.subscription,
        paymentMethods: state.paymentMethods,
      }),
    }
  )
);

// Initialize default free subscription
export const initializeFreeTierSubscription = (userId: string): Subscription => {
  const now = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(now.getFullYear() + 1);

  return {
    id: `free_${userId}`,
    userId,
    tier: 'free',
    status: 'active',
    currentPeriodStart: now,
    currentPeriodEnd: oneYearFromNow,
    cancelAtPeriodEnd: false,
    usage: getDefaultUsage(),
    limits: getDefaultLimits('free'),
    createdAt: now,
    updatedAt: now,
  };
}; 
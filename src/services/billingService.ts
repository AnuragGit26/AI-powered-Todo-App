import { supabase } from '../lib/supabaseClient';
import { 
  PricingPlan, 
  Subscription, 
  PaymentMethod, 
  BillingInvoice, 
  SubscriptionTier,
  BillingInterval 
} from '../types';

// Premium pricing plans with cutting-edge features
export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    tier: 'free',
    price: 0,
    interval: 'monthly',
    features: [
      'Up to 50 tasks',
      '10 AI task analyses',
      'Unlimited Pomodoro sessions',
      'Basic analytics',
      'Email support',
      'Basic themes',
    ],
  },
  {
    id: 'premium-monthly',
    name: 'Premium',
    tier: 'premium',
    price: 9.99,
    interval: 'monthly',
    popular: true,
    stripePriceId: 'price_premium_monthly',
    comingSoon: true,
    features: [
      'Unlimited tasks',
      '500 AI task analyses',
      'Unlimited Pomodoro sessions',
      'Voice-to-Task AI conversion',
      'Advanced productivity analytics',
      'Offline sync across devices',
      'Priority email support',
      'Custom themes & branding',
      'Team collaboration (5 members)',
      'Calendar integrations',
    ],
  },
  {
    id: 'premium-yearly',
    name: 'Premium',
    tier: 'premium',
    price: 99.99,
    interval: 'yearly',
    stripePriceId: 'price_premium_yearly',
    comingSoon: true,
    features: [
      'Unlimited tasks',
      '500 AI task analyses',
      'Unlimited Pomodoro sessions',
      'Voice-to-Task AI conversion',
      'Advanced productivity analytics',
      'Offline sync across devices',
      'Priority email support',
      'Custom themes & branding',
      'Team collaboration (5 members)',
      'Calendar integrations',
      '2 months free (Save $20)',
    ],
  },
  {
    id: 'enterprise-monthly',
    name: 'Enterprise',
    tier: 'enterprise',
    price: 29.99,
    interval: 'monthly',
    stripePriceId: 'price_enterprise_monthly',
    comingSoon: true,
    features: [
      'Everything in Premium',
      'Unlimited AI task analyses',
      'Unlimited team members',
      'Advanced team analytics',
      'SSO authentication',
      'API access',
      'Custom integrations',
      'Priority phone support',
      'Dedicated account manager',
      'Custom training sessions',
    ],
  },
];

// Get premium features that are most innovative and demanded
export const getPremiumFeatures = () => [
  {
    id: 'voice-to-task',
    name: 'Voice-to-Task AI',
    description: 'Convert speech to smart tasks with AI analysis',
    icon: '🎤',
    category: 'AI Assistant',
  },
  {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    description: 'Deep productivity insights and predictive analytics',
    icon: '📊',
    category: 'Analytics',
  },
  {
    id: 'offline-sync',
    name: 'Offline Sync',
    description: 'Work offline and sync when connected',
    icon: '🔄',
    category: 'Sync',
  },
  {
    id: 'team-collaboration',
    name: 'Team Collaboration',
    description: 'Real-time collaboration and task delegation',
    icon: '👥',
    category: 'Collaboration',
  },
  {
    id: 'smart-prioritization',
    name: 'AI Smart Prioritization',
    description: 'AI-powered task prioritization based on deadlines and importance',
    icon: '🧠',
    category: 'AI Assistant',
  },
  {
    id: 'ai-task-suggestions',
    name: 'AI Task Suggestions',
    description: 'Get intelligent task recommendations based on your patterns',
    icon: '💡',
    category: 'AI Assistant',
  },
  {
    id: 'focus-mode',
    name: 'Advanced Focus Mode',
    description: 'AI-powered distraction blocking and deep work sessions',
    icon: '🎯',
    category: 'Productivity',
  },
  {
    id: 'smart-scheduling',
    name: 'Smart Scheduling',
    description: 'AI automatically schedules tasks based on your energy levels',
    icon: '📅',
    category: 'AI Assistant',
  },
];

class BillingService {
  // Create or retrieve customer subscription
  async getSubscription(userId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }

  // Create a free tier subscription for new users
  async createFreeSubscription(userId: string): Promise<Subscription> {
    const now = new Date();
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(now.getFullYear() + 1);

    const freeSubscription = {
      user_id: userId,
      tier: 'free' as SubscriptionTier,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: oneYearFromNow.toISOString(),
      cancel_at_period_end: false,
      usage_tasks_created: 0,
      usage_ai_analysis_used: 0,
      usage_pomodoro_sessions: 0,
      usage_integrations_synced: 0,
      usage_team_members_invited: 0,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const { data, error } = await supabase
      .from('subscriptions')
      .insert(freeSubscription)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return this.mapSupabaseSubscription(data);
  }

  // Update subscription usage
  async updateUsage(userId: string, usageField: string, increment: number = 1): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_usage', {
        user_id: userId,
        usage_field: usageField,
        increment_value: increment,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating usage:', error);
    }
  }

  // Check if user can perform an action based on their subscription limits
  async checkUsageLimit(userId: string, feature: string): Promise<boolean> {
    try {
      const subscription = await this.getSubscription(userId);
      if (!subscription) return false;

      const { usage, limits } = subscription;

      switch (feature) {
        case 'tasks':
          return limits.maxTasks === -1 || usage.tasksCreated < limits.maxTasks;
        case 'ai_analysis':
          return limits.maxAiAnalysis === -1 || usage.aiAnalysisUsed < limits.maxAiAnalysis;
        case 'pomodoro':
          return limits.maxPomodoroSessions === -1 || usage.pomodoroSessions < limits.maxPomodoroSessions;
        case 'integrations':
          return limits.maxIntegrations === -1 || usage.integrationsSynced < limits.maxIntegrations;
        case 'team_members':
          return limits.maxTeamMembers === -1 || usage.teamMembersInvited < limits.maxTeamMembers;
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return false;
    }
  }

  // Get payment methods for a user
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  // Get billing invoices for a user
  async getInvoices(userId: string): Promise<BillingInvoice[]> {
    try {
      const { data, error } = await supabase
        .from('billing_invoices')
        .select('*')
        .eq('user_id', userId)
        .order('invoice_date', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  // Simulate Stripe integration (in real app, this would call Stripe API)
  async createCheckoutSession(priceId: string, userId: string): Promise<{ url: string }> {
    // This would integrate with Stripe in a real application
    const mockCheckoutUrl = `https://checkout.stripe.com/pay/${priceId}?client_reference_id=${userId}`;
    
    return {
      url: mockCheckoutUrl,
    };
  }

  // Map Supabase subscription data to our Subscription interface
  private mapSupabaseSubscription(data: any): Subscription {
    return {
      id: data.id,
      userId: data.user_id,
      tier: data.tier,
      status: data.status,
      currentPeriodStart: new Date(data.current_period_start),
      currentPeriodEnd: new Date(data.current_period_end),
      cancelAtPeriodEnd: data.cancel_at_period_end,
      trialEnd: data.trial_end ? new Date(data.trial_end) : undefined,
      stripeSubscriptionId: data.stripe_subscription_id,
      stripeCustomerId: data.stripe_customer_id,
      usage: {
        tasksCreated: data.usage_tasks_created || 0,
        aiAnalysisUsed: data.usage_ai_analysis_used || 0,
        pomodoroSessions: data.usage_pomodoro_sessions || 0,
        integrationsSynced: data.usage_integrations_synced || 0,
        teamMembersInvited: data.usage_team_members_invited || 0,
      },
      limits: this.getLimitsForTier(data.tier),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private getLimitsForTier(tier: SubscriptionTier): import('../types').SubscriptionLimits {
    switch (tier) {
      case 'free':
        return {
          maxTasks: 50,
          maxAiAnalysis: 10,
          maxPomodoroSessions: -1,
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
          maxPomodoroSessions: -1,
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
          maxTasks: -1,
          maxAiAnalysis: -1,
          maxPomodoroSessions: -1,
          maxIntegrations: -1,
          maxTeamMembers: -1,
          advancedAnalytics: true,
          prioritySupport: true,
          customThemes: true,
          offlineSync: true,
          voiceToTask: true,
        };
      default:
        return this.getLimitsForTier('free');
    }
  }
}

export const billingService = new BillingService(); 
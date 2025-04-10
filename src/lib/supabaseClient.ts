import { createClient } from '@supabase/supabase-js';

// Create a singleton instance of the Supabase client
let supabaseInstance: ReturnType<typeof createClient> | null = null;

// Global window property to enforce singleton across module reloads during development
declare global {
  interface Window {
    __SUPABASE_INSTANCE__?: ReturnType<typeof createClient>;
  }
}

export const getSupabaseClient = () => {
  // Use existing instance from window if it exists (helps with HMR)
  if (window.__SUPABASE_INSTANCE__) {
    return window.__SUPABASE_INSTANCE__;
  }
  
  // Use cached instance if it exists
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Create new instance
  supabaseInstance = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
  
  // Store on window for HMR stability
  if (typeof window !== 'undefined') {
    window.__SUPABASE_INSTANCE__ = supabaseInstance;
  }
  
  return supabaseInstance;
}; 
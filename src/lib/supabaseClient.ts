import { createClient } from '@supabase/supabase-js';

const MODE = import.meta.env.MODE;
const isTest = MODE === 'test';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (isTest ? 'http://localhost:54321' : undefined);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (isTest ? 'test-anon-key' : undefined);

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
    realtime: {
        params: { eventsPerSecond: 20 },
    },
});
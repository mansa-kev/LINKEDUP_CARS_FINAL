import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Mock auth for development to bypass login
const mockUser = {
  id: 'mock-user-id-123',
  email: 'dev@linkedupcars.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString()
};

supabase.auth.getUser = async () => ({
  data: { user: mockUser as any },
  error: null
});

supabase.auth.getSession = async () => ({
  data: { session: { user: mockUser as any, access_token: 'mock-token', refresh_token: 'mock-token', expires_in: 3600, token_type: 'bearer' } },
  error: null
});

supabase.auth.signInWithPassword = async () => ({
  data: { user: mockUser as any, session: { user: mockUser as any, access_token: 'mock-token', refresh_token: 'mock-token', expires_in: 3600, token_type: 'bearer' } },
  error: null
});
export const handleSupabaseError = (error: any, operation: string) => {
  console.error(`Supabase Error during ${operation}:`, error);
  throw new Error(error.message || `An error occurred during ${operation}`);
};

import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const rawSupabaseUrl = env.VITE_SUPABASE_URL || '';
const rawSupabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

let supabaseUrl = rawSupabaseUrl.replace(/\/$/, '').replace(/\/rest\/v1$/, '');
const supabaseAnonKey = rawSupabaseAnonKey.trim();

const isValidUrl = supabaseUrl.startsWith('https://');
const isValidKey = supabaseAnonKey.length > 20; // Anon keys are long

let supabaseClient: ReturnType<typeof createClient> | null = null;

if (isValidUrl && isValidKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    console.info('[Supabase] Client initialized successfully');
  } catch (err) {
    console.error('[Supabase] Failed to initialize client:', err);
  }
} else {
  console.warn('[Supabase] Supabase client not initialized. Missing environment variables:');
  if (!rawSupabaseUrl) console.warn('  -> VITE_SUPABASE_URL is missing');
  if (!supabaseAnonKey) console.warn('  -> VITE_SUPABASE_ANON_KEY is missing');
  console.warn('[Supabase] For Vercel: Set these in project Environment Variables');
  console.warn('[Supabase] For local: Set these in .env.local');
}

export const supabase = supabaseClient;

import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const rawSupabaseUrl = env.VITE_SUPABASE_URL || '';
const rawSupabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

let supabaseUrl = rawSupabaseUrl.replace(/\/$/, '').replace(/\/rest\/v1$/, '');
const supabaseAnonKey = rawSupabaseAnonKey.trim();

const isValidUrl = supabaseUrl.startsWith('https://');
const isValidKey = supabaseAnonKey.length > 20; // Anon keys are long

if (!isValidUrl || !isValidKey) {
  console.warn('[Supabase] Supabase client not initialized. Check your local environment variables:');
  console.warn('  VITE_SUPABASE_URL:', rawSupabaseUrl || '<missing>');
  console.warn('  VITE_SUPABASE_ANON_KEY length:', supabaseAnonKey.length || '<missing>');
  if (!rawSupabaseUrl) console.warn('  -> Set VITE_SUPABASE_URL in .env.local');
  if (!supabaseAnonKey) console.warn('  -> Set VITE_SUPABASE_ANON_KEY in .env.local');
}

export const supabase = (isValidUrl && isValidKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

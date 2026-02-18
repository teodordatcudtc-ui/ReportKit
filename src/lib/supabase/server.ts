import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _instance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_instance) return _instance;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  _instance = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return _instance;
}

/** Use getSupabaseAdmin() in API routes so build succeeds without env vars. */

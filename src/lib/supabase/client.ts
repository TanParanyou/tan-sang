import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getClientEnv } from '@/lib/env/env';
import type { Database } from '@/lib/supabase/database.types';

let browserSupabaseClient: SupabaseClient<Database> | null = null;

export function getBrowserSupabaseClient(): SupabaseClient<Database> {
  if (!browserSupabaseClient) {
    const env = getClientEnv();
    browserSupabaseClient = createClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
        },
      },
    );
  }
  return browserSupabaseClient;
}

import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/config/env';

/**
 * Creates a Supabase client for browser (client-side) components.
 */
export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

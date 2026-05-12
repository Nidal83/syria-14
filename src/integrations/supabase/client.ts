/**
 * Supabase browser client.
 *
 * URL and anon key come from validated environment variables — never hardcode them
 * (see `@/shared/config/env`).
 *
 * Import this client as:
 *   import { supabase } from '@/integrations/supabase/client';
 *
 * Note: by architectural convention (Phase 1+), UI components should NOT import
 * this directly. They should go through feature services / hooks. This file remains
 * the single low-level entry point.
 */
import { createClient } from '@supabase/supabase-js';
import { env } from '@/shared/config/env';
import type { Database } from './types';

export const supabase = createClient<Database>(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

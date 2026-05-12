/**
 * Validated environment variables.
 *
 * This module is the ONE place where `import.meta.env` is read.
 * Every other file should `import { env } from '@/shared/config/env'`.
 *
 * If a required variable is missing or malformed at boot, the app fails
 * immediately with a clear, actionable error message — never silently.
 */
import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z
    .string()
    .url('VITE_SUPABASE_URL must be a valid URL (e.g. https://xxx.supabase.co)'),
  VITE_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(20, 'VITE_SUPABASE_PUBLISHABLE_KEY looks too short to be a real anon key'),
  VITE_SUPABASE_PROJECT_ID: z.string().optional(),
  VITE_APP_NAME: z.string().default('Syria Homes Nest'),
  VITE_APP_URL: z.string().url().optional(),
  MODE: z.enum(['development', 'production', 'test']).optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(import.meta.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');

    // Build-time / boot-time error: surface it loudly.
    const message =
      `\n[env] Invalid or missing environment variables:\n${issues}\n\n` +
      `Copy \`.env.example\` to \`.env\` and fill in the required values.\n`;

    console.error(message);
    throw new Error('Invalid environment configuration. See console for details.');
  }

  return parsed.data;
}

export const env = loadEnv();

export const isDev = import.meta.env.DEV;
export const isProd = import.meta.env.PROD;

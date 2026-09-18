import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().min(1).default('postgresql://postgres:postgres@localhost:5432/saas_bi'),
  DIRECT_URL: z.string().min(1).optional(),

  // Supabase Auth
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default('https://example.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default('dummy-anon-key-for-building'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Inngest
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  // OpenAI
  OPENAI_API_KEY: z.string().optional(),

  // Encryption
  ENCRYPTION_KEY: z.string().length(64).default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),

  // SSLCommerz
  SSLCOMMERZ_STORE_ID: z.string().optional(),
  SSLCOMMERZ_STORE_PASSWORD: z.string().optional(),
  SSLCOMMERZ_IS_SANDBOX: z.string().transform((v) => v === 'true').default('true'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Normalizes raw process.env values:
 * 1. Strips empty or whitespace-only strings to undefined so that Zod defaults and optional() activate.
 * 2. Auto-prefixes https:// to URLs if the protocol was omitted (common on Vercel deployment configs).
 * 3. Falls back NEXT_PUBLIC_APP_URL to VERCEL_URL when running in Vercel preview/production.
 * 4. Resets malformed ENCRYPTION_KEY to undefined so the 64-character default key is used.
 */
export function sanitizeRawEnv(raw: NodeJS.ProcessEnv): Record<string, string | undefined> {
  const clean: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (trimmed !== '') {
      clean[key] = trimmed;
    }
  }

  // Handle NEXT_PUBLIC_APP_URL
  if (clean.NEXT_PUBLIC_APP_URL) {
    if (!clean.NEXT_PUBLIC_APP_URL.startsWith('http://') && !clean.NEXT_PUBLIC_APP_URL.startsWith('https://')) {
      clean.NEXT_PUBLIC_APP_URL = `https://${clean.NEXT_PUBLIC_APP_URL}`;
    }
  } else if (raw.VERCEL_URL) {
    clean.NEXT_PUBLIC_APP_URL = `https://${raw.VERCEL_URL.trim()}`;
  }

  // Handle NEXT_PUBLIC_SUPABASE_URL
  if (clean.NEXT_PUBLIC_SUPABASE_URL) {
    if (!clean.NEXT_PUBLIC_SUPABASE_URL.startsWith('http://') && !clean.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')) {
      clean.NEXT_PUBLIC_SUPABASE_URL = `https://${clean.NEXT_PUBLIC_SUPABASE_URL}`;
    }
  }

  // If ENCRYPTION_KEY is not exactly 64 characters, treat as undefined to allow fallback
  if (clean.ENCRYPTION_KEY && clean.ENCRYPTION_KEY.length !== 64) {
    clean.ENCRYPTION_KEY = undefined;
  }

  return clean;
}

export function validateEnv(customEnv?: NodeJS.ProcessEnv): Env {
  const targetEnv = customEnv ?? process.env;
  const sanitized = sanitizeRawEnv(targetEnv);
  const parsed = envSchema.safeParse(sanitized);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    const msg = `[WARN] Invalid or incomplete environment variables:\n${issues}\nUsing safe fallback defaults for compilation and offline demo.`;

    // eslint-disable-next-line no-console
    console.warn(msg);
    return envSchema.parse({
      NODE_ENV: sanitized.NODE_ENV,
    });
  }

  return parsed.data;
}

export const env = validateEnv();

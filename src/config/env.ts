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

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    const msg = `[FATAL] Invalid environment variables:\n${issues}`;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg);
    }
    // eslint-disable-next-line no-console
    console.warn(msg);
    return envSchema.parse({});
  }
  return parsed.data;
}

export const env = validateEnv();

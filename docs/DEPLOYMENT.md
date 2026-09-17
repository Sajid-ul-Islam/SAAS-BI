# Production Deployment Guide: Vercel & Supabase

This guide outlines the production deployment workflow for the SaaS BI Analytics Platform using **Vercel** (Next.js 15 App Router) and **Supabase** (PostgreSQL with Row Level Security and Auth).

---

## 1. Prerequisites

Before starting, ensure you have provisioned:
1. **GitHub Repository**: Accessible by Vercel.
2. **Supabase Project**: With PostgreSQL 15+.
3. **Inngest Cloud Account**: For serverless event routing and background crons.
4. **SSLCommerz Merchant Account**: Live Store ID & Store Password.
5. **OpenAI API Account**: For natural language analytics queries.

---

## 2. Supabase Infrastructure Setup

### Step 1: Database Connection Pooling (Supavisor)
Supabase provides two database URLs in the Project Dashboard (**Settings -> Database**):
1. **Direct Connection** (Port 5432): Used for Prisma migrations (`DIRECT_URL`).
2. **Transaction Pooler** (Port 6543): Used for serverless queries (`DATABASE_URL`).

### Step 2: Apply Prisma Schema & Migrations
From your deployment terminal or CI/CD pipeline:

```bash
# Push Prisma schema to Supabase Postgres
npx prisma migrate deploy

# Alternatively for initial deployment:
npx prisma db push
```

### Step 3: Enable Supabase Row Level Security (RLS)
Execute the RLS migration script found in `prisma/migrations/0_init_rls/migration.sql` via the **Supabase SQL Editor**:

```sql
-- Creates helper function for Supabase JWT tenant resolution
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'tenant_id', '')::UUID;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Enable RLS across all tables
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "courier_credentials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_status_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_cache" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_token_usage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "webhook_events" ENABLE ROW LEVEL SECURITY;

-- Apply Tenant Isolation Policies (refer to 0_init_rls/migration.sql for full policy definitions)
```

### Step 4: Supabase Auth & JWT Custom Claims Trigger
Configure a PostgreSQL trigger to attach the active `tenant_id` to Supabase user JWT tokens:

```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  claims jsonb;
  user_tenant_id uuid;
BEGIN
  -- Fetch tenant_id for the authenticating user
  SELECT tenant_id INTO user_tenant_id FROM public.users WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';
  IF user_tenant_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(user_tenant_id::text));
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

---

## 3. Inngest Cloud Orchestration Setup

1. In the [Inngest Cloud Dashboard](https://app.inngest.com), create a new Production environment.
2. Retrieve your `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`.
3. Inngest will automatically discover functions exposed at:
   ```
   https://yourdomain.com/api/inngest
   ```
4. Background jobs enabled:
   - `sync-orders`: Concurrency limit 5 per tenant.
   - `poll-courier-status`: Scheduled reconciliation.
   - `ai-anomaly-detection`: Daily cron (`0 2 * * *`).

---

## 4. SSLCommerz Configuration

In the SSLCommerz Merchant Panel:
1. Set the **IPN (Instant Payment Notification) URL** to:
   ```
   https://yourdomain.com/api/billing/ipn
   ```
2. Enable HTTP POST notifications.
3. Configure your production Store ID and Store Password in the environment variables below.

---

## 5. Environment Variables Specification

Set the following environment variables in **Vercel Project Settings -> Environment Variables**:

| Variable | Description | Required | Example |
|---|---|---|---|
| `NODE_ENV` | Environment identifier | Yes | `production` |
| `DATABASE_URL` | Supabase PgBouncer Pooler URL | Yes | `postgres://postgres.[ref]:[pwd]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Supabase Direct Database Connection | Yes | `postgres://postgres.[ref]:[pwd]@aws-0-[region].supabase.com:5432/postgres` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Yes | `https://[ref].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client anon key | Yes | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server admin key | Yes | `eyJhbGciOi...` |
| `ENCRYPTION_KEY` | AES-256-GCM 32-byte secret | Yes | `64_char_hex_or_base64_string` |
| `OPENAI_API_KEY` | OpenAI API Key | Yes | `sk-proj-...` |
| `INNGEST_EVENT_KEY` | Inngest Event Ingestion Key | Yes | `prod_event_key_...` |
| `INNGEST_SIGNING_KEY` | Inngest Webhook Signing Key | Yes | `signkey-prod-...` |
| `NEXT_PUBLIC_APP_URL` | Canonical Production URL | Yes | `https://app.yourdomain.com` |
| `SSLCOMMERZ_STORE_ID` | SSLCommerz Merchant Store ID | Yes | `yourstorelive` |
| `SSLCOMMERZ_STORE_PASSWORD`| SSLCommerz Merchant Password | Yes | `live_secret_password` |
| `SSLCOMMERZ_IS_SANDBOX` | Sandbox mode switch | Yes | `false` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry Error Tracking DSN | Optional | `https://...@sentry.io/...` |

---

## 6. Vercel Deployment

1. Connect your repository to Vercel.
2. Select Framework Preset: **Next.js**.
3. Build Command: `npm run build`
4. Output Directory: `.next`
5. Click **Deploy**.

---

## 7. Post-Deployment Smoke Test Checklist

- [ ] **Health Check**: Navigate to `/login` and ensure zero console errors.
- [ ] **Auth Flow**: Register a test merchant user, verify tenant creation in PostgreSQL.
- [ ] **Store Connection**: Navigate to `/onboarding`, connect a test WooCommerce / Shopify store.
- [ ] **Courier Webhook**: Send a test POST payload to `/api/webhooks/pathao` and verify status reflection in `/orders`.
- [ ] **AI Query**: Run a query on `/ai` and verify token count increments in `ai_token_usage`.
- [ ] **Billing Redirect**: Click "Upgrade to Pro" in `/settings` and verify redirection to SSLCommerz hosted payment page.

# Project Tasks & Execution Roadmap

## Progress & Execution State
- **Current Phase**: Phase 7 Production Infrastructure & Operations COMPLETE 🚀
- **Status**: ALL PHASES 1–7 100% COMPLETE (Multi-stage Docker stack, Upstash/Redis caching, Bangladeshi SMS gateway, responsive HTML email templates, /api/health telemetry route, GitHub Actions CI/CD, 107 passing tests, Next.js 15 production build passing).
- **Completed**:
  - [x] Phase 1: Foundation (Next.js 15, Prisma 10 models, Supabase RLS, BDT formatter, modular architecture)
  - [x] Phase 2: Integrations (Pathao, Steadfast, RedX normalizers & webhooks, WooCommerce REST, Shopify OAuth)
  - [x] Phase 3: Analytics Dashboard (KPI cards, Recharts, 64-district filters, timeline drawer)
  - [x] Phase 4: AI Layer (SQL grounding, SHA-256 prompt cache, token quotas, anomaly crons, forecasting)
  - [x] Phase 5: Billing & Polish (SSLCommerz checkout & IPN, onboarding wizard, Sentry error tracker)
  - [x] Phase 6: Backend Gap Closure (Two-way courier writeback, parcel dispatch, COD reconciliation, AI streaming, CSV export, RBAC)
  - [x] Phase 7: Production Infrastructure (Redis cache, BD SMS gateway, HTML email templates, /api/health, Docker, CI/CD, operations guide)
- **Deployment Ready**: Yes, fully containerized and verified against strict TypeScript and automated tests.

---

## Phase 1: Foundation (Atomic Tickets)

### [x] [TASK-101] Project Scaffolding, Strict Tooling & Config Setup
- **Objective**: Initialize Next.js 15 App Router project with TypeScript strict mode, Tailwind CSS, Lucide icons, Vitest, and ESLint.
- **Acceptance Criteria**:
  - Next.js 15 initialized with App Router (`/src/app`).
  - `tsconfig.json` configured with `"strict": true`, `"noImplicitAny": true`, `"exactOptionalPropertyTypes": true`.
  - Tailwind CSS installed and configured with design system tokens (BDT aesthetic, slate/indigo palette).
  - Vitest configured for unit testing with TypeScript support.
  - Environment variable validation setup using Zod (`src/config/env.ts`).
  - Structured logger setup (`src/lib/logger.ts`) using Pino (or lightweight structured JSON logger).
- **Definition of Done**: `npm run build` succeeds, `npm test` runs with 0 errors, no TypeScript errors.
- **Commit Message**: `chore(setup): initialize Next.js 15 project with strict TypeScript, tailwind, and vitest`

---

### [x] [TASK-102] Prisma Schema & PostgreSQL Connection Architecture
- **Objective**: Implement the full Prisma schema from `DATA_MODEL.md`, setup Prisma client singleton with connection pooling support.
- **Acceptance Criteria**:
  - `prisma/schema.prisma` created with models: `Tenant`, `User`, `Store`, `CourierCredential`, `Order`, `OrderStatusHistory`, `AiCache`, `AiTokenUsage`, `Subscription`, `WebhookEvent`.
  - Unique constraints, foreign keys, and indexes configured for high-performance query execution.
  - Prisma client singleton created at `src/lib/prisma.ts` with serverless connection pooling handling.
  - Seed script created (`prisma/seed.ts`) to populate mock tenants and orders for local development and testing.
- **Definition of Done**: `npx prisma validate` passes, `npx prisma generate` outputs client types successfully.
- **Commit Message**: `feat(database): implement prisma schema and database client singleton`

---

### [x] [TASK-103] Supabase Row Level Security (RLS) & Multi-Tenant Migration
- **Objective**: Write comprehensive PostgreSQL migration scripts for Supabase RLS policies across all tenant models.
- **Acceptance Criteria**:
  - SQL script `prisma/migrations/0_init_rls/migration.sql` created.
  - Function `current_tenant_id()` extracting `tenant_id` from `auth.jwt()`.
  - Row Level Security enabled on all 10 tenant tables.
  - Policies `tenant_isolation_*` created with `USING (tenant_id = current_tenant_id())` and `WITH CHECK (tenant_id = current_tenant_id())`.
  - Multi-tenant tenant verification tests in Vitest verifying isolation.
- **Definition of Done**: RLS policies documented and verified; SQL script passes syntax check and unit isolation test.
- **Commit Message**: `feat(security): implement supabase row level security policies for multi-tenancy`

---

### [x] [TASK-104] Supabase Auth Flow & Tenant Context Middleware
- **Objective**: Implement authentication flow (signup, login, team member invite) with tenant resolution and server-side session management.
- **Acceptance Criteria**:
  - Supabase client configured for Server Components, Client Components, and Server Actions.
  - Next.js middleware (`src/middleware.ts`) enforcing authenticated sessions and extracting/injecting active tenant context.
  - Auth pages implemented in `src/app/(auth)`:
    - `/login`: Email + password authentication.
    - `/signup`: Merchant onboarding + tenant creation.
    - `/invite`: Team member accept invitation page.
  - Tenant context helper (`src/modules/tenants/tenants.service.ts`) deriving tenant from JWT / user membership securely.
- **Definition of Done**: Auth routes render with proper input validation and error states; unauthenticated requests redirect to login.
- **Commit Message**: `feat(auth): implement supabase auth, tenant resolution middleware, and auth routes`

---

### [x] [TASK-105] Dashboard Shell, Navigation & Responsive Layout
- **Objective**: Build production-grade dashboard layout with sidebar navigation, tenant switcher, user profile dropdown, and BDT currency formatting.
- **Acceptance Criteria**:
  - Dashboard layout implemented at `src/app/(dashboard)/layout.tsx`.
  - Sidebar navigation supporting:
    - Overview (`/dashboard`)
    - Orders (`/dashboard/orders`)
    - Analytics (`/dashboard/analytics`)
    - Integrations (`/dashboard/integrations`)
    - AI Insights (`/dashboard/ai`)
    - Billing & Settings (`/dashboard/settings`)
  - Tenant switcher component in sidebar header.
  - User profile menu with logout option.
  - Currency format helper (`formatBDT(amount)`) with Bengali Taka symbol `৳` and Bangladeshi number format (lakh/crore).
  - Responsive drawer for mobile merchants.
- **Definition of Done**: Dashboard layout renders cleanly on desktop and mobile viewports with zero layout shifts.
- **Commit Message**: `feat(dashboard): build responsive dashboard shell, navigation sidebar, and bdt formatting`

---

### [x] [TASK-106] Modular Domain Scaffolding & Base Repositories
- **Objective**: Scaffold all domain modules according to the modular architecture specification.
- **Acceptance Criteria**:
  - Scaffold folders inside `src/modules/`:
    - `orders` (`index.ts`, `orders.service.ts`, `orders.repository.ts`, `orders.schema.ts`, `orders.types.ts`, `README.md`)
    - `analytics` (`index.ts`, `analytics.service.ts`, `analytics.repository.ts`, `analytics.schema.ts`, `analytics.types.ts`, `README.md`)
    - `integrations` (`index.ts`, `integrations.service.ts`, `integrations.repository.ts`, `integrations.schema.ts`, `integrations.types.ts`, `README.md`)
    - `ai` (`index.ts`, `ai.service.ts`, `ai.repository.ts`, `ai.schema.ts`, `ai.types.ts`, `README.md`)
    - `billing` (`index.ts`, `billing.service.ts`, `billing.repository.ts`, `billing.schema.ts`, `billing.types.ts`, `README.md`)
    - `tenants` (`index.ts`, `tenants.service.ts`, `tenants.repository.ts`, `tenants.schema.ts`, `tenants.types.ts`, `README.md`)
  - Shared validation utilities and error classes in `src/shared/`.
- **Definition of Done**: All modules export strict interfaces with documentation and compile cleanly.
- **Commit Message**: `feat(modules): scaffold modular domain boundaries with public api contracts`

---

### [x] [TASK-107] Phase 1 Verification & Automated Test Suite
- **Objective**: Run complete unit test suite verifying schema validation, tenant isolation, and BDT utilities.
- **Acceptance Criteria**:
  - Unit tests for Zod schemas in all modules.
  - Unit tests for tenant isolation logic and session verification.
  - Test coverage report generated showing >70% coverage on business logic.
  - Full project build passes (`npm run build`).
- **Definition of Done**: All tests pass, build succeeds, commit tagged `phase-1-done`.
- **Commit Message**: `test(phase-1): add unit tests and verify Phase 1 foundation`

---

## Roadmap: Upcoming Phases

### Phase 2: Integrations
- [x] [TASK-201] Courier status normalizer module (`mapStatus` for Pathao, Steadfast, RedX) + unit tests
- [x] [TASK-202] WooCommerce REST API v3 connector (encrypted keys, order fetcher)
- [x] [TASK-203] Shopify OAuth connector & webhook receivers
- [x] [TASK-204] Pathao, Steadfast, RedX webhook endpoints with signature validation
- [x] [TASK-205] Inngest background job setup for order sync and courier polling

### Phase 3: Analytics Dashboard
- [x] [TASK-301] Order tracking view with status tabs, search, and date filters
- [x] [TASK-302] SQL-first KPI cards (Revenue, AOV, Delivery Rate, Return Rate, COD Conversion)
- [x] [TASK-303] Order status timeline modal / drawer
- [x] [TASK-304] Server-side pagination & URL query state
- [x] [TASK-305] Recharts visualization components (sales trend, courier performance)

### Phase 4: AI Layer
- [x] [TASK-401] Natural language query engine with SQL translation & guardrails
- [x] [TASK-402] AI response caching (`ai_cache`) & daily token metering (100K token cap)
- [x] [TASK-403] Automated anomaly detection Inngest cron job
- [x] [TASK-404] Sales velocity forecasting per tenant

### Phase 5: Billing & Polish
- [x] [TASK-501] Subscription tiers & limit enforcement middleware
- [x] [TASK-502] SSLCommerz payment gateway integration
- [x] [TASK-503] Onboarding wizard (< 5 minutes to first store connection)
- [x] [TASK-504] Global error boundaries, Sentry logging, and empty/loading states

### Phase 6: Backend Gap Closure & Production Readiness
- [x] [GAP-01] Two-Way Courier Status Writeback (WooCommerce & Shopify)
- [x] [GAP-02] Automated One-Click Parcel Dispatch API & Action
- [x] [GAP-03] Stale Courier Status Reconciler & Historical Backfill Inngest Workflows
- [x] [GAP-04] Automated COD Statement & Disbursement Reconciliation Service
- [x] [GAP-05] SSLCommerz Server-to-Server Validation API Verification
- [x] [GAP-06] Subscription Expiration & Automatic Downgrade Cron Job
- [x] [GAP-07] Filtered Orders CSV Export API with UTF-8 BOM
- [x] [GAP-08] Custom Date-Range SQL Aggregations & Query Filters
- [x] [GAP-09] Real-Time AI Streaming (SSE) & Multi-Turn History
- [x] [GAP-10] Automated Anomaly Push Alert Dispatcher (SMS/Webhook)
- [x] [GAP-11] Transactional Email Dispatcher (Team Invites & Receipts)
- [x] [GAP-12] Fine-Grained Role-Based Access Control (RBAC) Guards

### Phase 7: Production Infrastructure & Operations
- [x] [INFRA-701] Distributed Redis / Upstash Caching Layer & Invalidation (`src/lib/cache.ts`)
- [x] [INFRA-702] Production Bangladeshi SMS Gateway Client (Greenweb & Onnorokom SMS)
- [x] [INFRA-703] Production HTML Email Templates & Multi-Provider Engine (`src/lib/email.ts`)
- [x] [INFRA-704] Healthcheck & Diagnostic API Route (`/api/health`)
- [x] [INFRA-705] Docker & Local Dev Stack (`Dockerfile`, `docker-compose.yml`, `.dockerignore`)
- [x] [INFRA-706] Automated CI/CD Workflow (`.github/workflows/ci.yml`)
- [x] [INFRA-707] Production Infrastructure Guide (`docs/INFRASTRUCTURE.md`)




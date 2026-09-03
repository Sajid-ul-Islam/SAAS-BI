# Project Tasks & Execution Roadmap

## Progress & Execution State
- **Current Phase**: Phase 2: Integrations
- **Status**: TASK-201 Complete (Courier Status Normalizer Module for Pathao, Steadfast, and RedX implemented with unit tests).
- **Completed**:
  - [x] Initial architecture documentation (`/docs/ARCHITECTURE.md`)
  - [x] Initial data model & Prisma schema specification (`/docs/DATA_MODEL.md`)
  - [x] Phase 1 task breakdown with atomic tickets (`TASKS.md`)
  - [x] [TASK-101] Project Scaffolding, Strict Tooling & Config Setup
  - [x] [TASK-102] Prisma Schema & PostgreSQL Connection Architecture
  - [x] [TASK-103] Supabase Row Level Security (RLS) & Multi-Tenant Migration
  - [x] [TASK-104] Supabase Auth Flow & Tenant Context Middleware
  - [x] [TASK-105] Dashboard Shell, Navigation & Responsive Layout
  - [x] [TASK-106] Modular Domain Scaffolding & Base Repositories
  - [x] [TASK-107] Phase 1 Verification & Automated Test Suite
  - [x] [TASK-201] Courier status normalizer module (`mapStatus` for Pathao, Steadfast, RedX) + unit tests
- **In Progress**: [TASK-202] WooCommerce REST API v3 connector (encrypted keys, order fetcher)
- **Next Up**: [TASK-203] Shopify OAuth connector & webhook receivers

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
- [TASK-202] WooCommerce REST API v3 connector (encrypted keys, order fetcher)
- [TASK-203] Shopify OAuth connector & webhook receivers
- [TASK-204] Pathao, Steadfast, RedX webhook endpoints with signature validation
- [TASK-205] Inngest background job setup for order sync and courier polling

### Phase 3: Analytics Dashboard
- [TASK-301] Order tracking view with status tabs, search, and date filters
- [TASK-302] SQL-first KPI cards (Revenue, AOV, Delivery Rate, Return Rate, COD Conversion)
- [TASK-303] Order status timeline modal / drawer
- [TASK-304] Server-side pagination & URL query state
- [TASK-305] Recharts visualization components (sales trend, courier performance)

### Phase 4: AI Layer
- [TASK-401] Natural language query engine with SQL translation & guardrails
- [TASK-402] AI response caching (`ai_cache`) & daily token metering (100K token cap)
- [TASK-403] Automated anomaly detection Inngest cron job
- [TASK-404] Sales velocity forecasting per tenant

### Phase 5: Billing & Polish
- [TASK-501] Subscription tiers & limit enforcement middleware
- [TASK-502] SSLCommerz payment gateway integration
- [TASK-503] Onboarding wizard (< 5 minutes to first store connection)
- [TASK-504] Global error boundaries, Sentry logging, and empty/loading states

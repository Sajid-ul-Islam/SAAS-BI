# SaaS BI Analytics Platform for Bangladeshi E-Commerce

A production-grade, multi-tenant Business Intelligence (BI) and analytics platform designed specifically for Bangladeshi e-commerce merchants. Connects directly to **WooCommerce** and **Shopify** stores, ingests real-time logistics events from **Pathao**, **Steadfast**, and **RedX**, normalizes courier lifecycle statuses, and delivers SQL-first dashboards and AI-powered natural language insights in Bangladeshi Taka (৳).

---

## 🌟 Key Features

- **Multi-Tenant Architecture**: Robust tenant isolation backed by PostgreSQL Row Level Security (RLS) and cryptographic tenant assertions.
- **Canonical Courier Normalization**: Unifies disparate logistics dialects (Pathao, Steadfast, RedX) into a canonical `NormalizedOrderStatus` enum with dual-status persistence.
- **Bangladeshi E-Commerce First**: Native support for **BDT (৳)** formatting, 64 administrative districts, Cash on Delivery (COD) reconciliation, and Eid/weekday shopping velocity patterns.
- **SQL-First KPI Analytics**: High-performance dashboard cards (Gross Sales, AOV, Delivery Success Rate, RTO Return Rate, COD Conversion Rate, Pending Float) calculated via PostgreSQL indexes — zero LLM latency or cost for standard metrics.
- **Cost-Disciplined AI Insights**: Natural language query engine ("Why did returns spike in Chittagong?") with deterministic SHA-256 prompt caching (24h TTL) and a 100,000 token/day budget cap.
- **Automated Anomaly Detection & Forecasting**: Background Inngest crons flagging return rate surges and projecting 7-day sales demand.
- **Local Payment Gateway**: Integrated with **SSLCommerz** hosted payment redirects and IPN webhooks for subscription management (Free, Pro @ ৳2,500/mo, Business @ ৳6,500/mo).
- **Rapid Onboarding**: Self-serve wizard connecting stores and couriers in under 5 minutes.

---

## 🛠️ Tech Stack & Standards

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, React Server Components)
- **Language**: TypeScript with strict mode (`strict: true`, `noImplicitAny: true`, zero `any`)
- **Database & ORM**: PostgreSQL via [Supabase](https://supabase.com/) & [Prisma ORM](https://www.prisma.io/)
- **Multi-Tenancy & Auth**: Supabase Auth with Row Level Security (RLS) policies
- **Background Workflows**: [Inngest](https://www.inngest.com/) (tenant-keyed concurrency, retries, crons)
- **Styling & UI**: Tailwind CSS, Lucide Icons, Recharts visualizations
- **Validation & Boundaries**: Zod schema validation across all API routes and webhook receivers
- **Testing**: [Vitest](https://vitest.dev/) (88 unit tests, >70% coverage on core logic)
- **Logging & Errors**: Structured JSON logger, global error boundaries, Sentry integration

---

## 📂 Domain-Driven Modular Architecture

The codebase follows a domain-driven modular structure in `/src/modules`:

```
src/
├── app/                      # Next.js 15 App Router pages, layouts, and API routes
│   ├── (auth)/               # Login, Signup, Invite acceptance
│   ├── (dashboard)/          # Dashboard shell, /orders, /analytics, /integrations, /settings
│   ├── api/                  # Inngest endpoint, AI query, webhooks, billing
│   └── onboarding/           # First-store onboarding wizard
├── components/               # Domain UI components & charts (Recharts)
├── config/                   # Zod validated environment configuration
├── lib/                      # Singletons (prisma, logger, encryption, inngest, error-tracker)
├── modules/                  # Self-contained domain modules
│   ├── ai/                   # NL query engine, token metering, prompt cache
│   ├── analytics/            # SQL-first KPI aggregations & time-series
│   ├── billing/              # Subscription plans & SSLCommerz gateway
│   ├── integrations/         # WooCommerce, Shopify, Pathao, Steadfast, RedX connectors
│   ├── orders/               # Order ingestion, status transitions, timeline audit
│   └── tenants/              # Workspaces, member invitations, RLS assertions
└── shared/                   # Currency utilities (formatBDT), errors, shared types
```

Each module exposes a strict `index.ts` public interface and includes its own `README.md`.

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Node.js 20+
- PostgreSQL database (or local Docker / Supabase instance)

### 2. Installation
```bash
git clone https://github.com/your-org/saas-bi-bangladesh.git
cd saas-bi-bangladesh
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure the following key variables are configured:
```env
DATABASE_URL="postgres://postgres:postgres@localhost:5432/saas_bi"
NEXT_PUBLIC_SUPABASE_URL="https://your-supabase-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
OPENAI_API_KEY="sk-proj-..."
SSLCOMMERZ_STORE_ID="testbox"
SSLCOMMERZ_STORE_PASSWORD="test_password"
SSLCOMMERZ_IS_SANDBOX="true"
```

### 4. Database Migration & Seeding
```bash
# Push schema to database
npx prisma db push

# Seed initial tenant, stores, orders, and courier credentials
npx prisma db seed
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

Run the test suite:
```bash
# Run all unit tests with Vitest
npm test

# Check TypeScript strict compliance
npm run typecheck

# Build for production
npm run build
```

---

## 📚 Technical Documentation

Comprehensive documentation is available in the `/docs` directory:

- [**System Architecture (`/docs/ARCHITECTURE.md`)**](./docs/ARCHITECTURE.md): System diagram, domain boundaries, data flow diagrams.
- [**Data Model & RLS (`/docs/DATA_MODEL.md`)**](./docs/DATA_MODEL.md): Entity-relationship diagrams, index specifications, Supabase RLS security policies.
- [**Integrations Guide (`/docs/INTEGRATIONS.md`)**](./docs/INTEGRATIONS.md): Guide for connecting new couriers (eCourier, Paperfly) and e-commerce platforms.
- [**Production Deployment (`/docs/DEPLOYMENT.md`)**](./docs/DEPLOYMENT.md): Step-by-step production setup on Vercel and Supabase.
- [**Security & Threat Model (`/docs/SECURITY.md`)**](./docs/SECURITY.md): Multi-tenant isolation, AES-256-GCM encryption, webhook validation, and AI guardrails.
- [**Scalability & Performance (`/docs/SCALING.md`)**](./docs/SCALING.md): Guardrails, connection pooling (pgBouncer), Inngest concurrency, and indexing strategy.

---

## 🤝 Contribution Guidelines

1. **Follow Domain Boundaries**: Never import internal module files directly; use `@/modules/<domain>`.
2. **Strict Typing**: No `any`. Use `unknown` with type guards.
3. **Validate Boundaries**: All new endpoints must validate input using Zod schemas.
4. **Preserve SQL-First Approach**: Do not introduce LLM calls for standard numerical calculations.
5. **Commit Standards**: Use Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).

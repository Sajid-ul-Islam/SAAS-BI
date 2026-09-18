# Production Infrastructure & Operations Guide

This guide documents the production infrastructure architecture, deployment workflows, caching topology, Bangladeshi SMS gateway setup, transactional email system, and operational observability for the SaaS BI platform.

---

## 1. Architectural Overview

```
                      +---------------------------------------+
                      |          Cloudflare / CDN             |
                      +---------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |     Next.js 15 App Router Server      |
                      |   (Docker Alpine / Standalone Node)   |
                      +---------------------------------------+
                        |                 |                |
         +--------------+                 |                +---------------+
         v                                v                                v
+------------------+             +-----------------+              +-----------------+
|  PostgreSQL 15   |             |  Redis / Upstash|              | Inngest Engine  |
|  (Prisma + RLS)  |             |  (TTL / Cache)  |              | (Order Crons)   |
+------------------+             +-----------------+              +-----------------+
         |                                |                                |
         v                                v                                v
+------------------+             +-----------------+              +-----------------+
| Courier Gateways |             | BD SMS Gateways |              | Resend / Email  |
| Pathao, Steadfast|             | Greenweb / Onno |              | Receipts/Invites|
+------------------+             +-----------------+              +-----------------+
```

---

## 2. Docker & Container Deployment

### Multi-Stage Dockerfile
The production image utilizes a 4-stage build to minimize image size and eliminate development dependencies:
1. `base`: `node:20-alpine` with `libc6-compat` for Alpine Linux compatibility.
2. `deps`: Installs production dependencies and prepares Prisma engines via `npm ci`.
3. `builder`: Compiles Next.js standalone bundle (`output: 'standalone'`) and executes `npx prisma generate`.
4. `runner`: Unprivileged system user `nextjs:nodejs` (UID 1001), serving traffic on port `3000`.

### Local & Production Compose
Launch the entire stack (Next.js Application, PostgreSQL 15, Redis 7) with healthchecks:

```bash
# Build and run containers in detached mode
docker compose up --build -d

# Verify container statuses and health
docker compose ps

# Inspect application logs
docker compose logs -f app
```

### Container Healthchecks
The container image features an integrated Docker `HEALTHCHECK` checking the `/api/health` diagnostic route every 30 seconds.

---

## 3. Distributed Caching Topology (`src/lib/cache.ts`)

The platform implements a multi-tier cache store supporting sub-millisecond query responses for merchant dashboards:

### Provider Priority
1. **Upstash Redis REST API** (Recommended for Serverless/Edge):
   - Configured via `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
   - Communicates via HTTPS without holding persistent TCP socket connections.
2. **Standard Redis TCP**:
   - Configured via `REDIS_URL` (e.g. `redis://localhost:6379`).
3. **In-Memory LRU / TTL Fallback**:
   - Automatically engaged in local development or if Redis is unreachable.
   - Capped at 5,000 keys with automatic timestamp eviction.

### Cache Strategy & Key Conventions
- **Merchant KPIs**: `kpis:${tenantId}:${startDate}:${endDate}` (TTL: 60 seconds).
- **Courier Sync Locks**: `lock:sync:${storeId}` (TTL: 300 seconds).
- **AI Query Grounding**: `ai:response:${sha256Hash}` (TTL: 86,400 seconds / 24 hours).

---

## 4. Bangladeshi SMS Gateway Integration (`src/lib/sms.ts`)

The platform integrates with major Bangladeshi SMS aggregators for instant merchant alerts, delivery notifications, and critical anomaly alarms.

### Phone Number Normalization
All inputs are validated against Bangladesh Telecom Regulatory Commission (BTRC) mobile numbering plans (`013` to `019`):
- Local standard: `01711000000` &rarr; `8801711000000`
- International format: `+8801812345678` &rarr; `8801812345678`
- Non-standard prefixes (e.g. `012`, `010`) are rejected.

### Supported Providers
1. **Greenweb SMS**:
   - Env: `GREENWEB_SMS_TOKEN`
   - Endpoint: `https://api.greenweb.com.bd/api.php`
2. **Onnorokom SMS**:
   - Env: `ONNOROKOM_SMS_API_KEY`
   - Endpoint: `https://api2.onnorokomsms.com/HttpSendSms.ashx`
3. **Mock Dispatcher**:
   - Automatically activated when tokens are absent; logs structured payloads for automated tests and CI.

---

## 5. Transactional Email System (`src/lib/email.ts`)

Emails are rendered using responsive, client-tested HTML templates adhering to email design standards (cross-compatible across Gmail, Apple Mail, and Outlook).

### Production Templates
1. **Team Invitation**:
   - Inviter name, tenant name, assigned role, 7-day expiration notice, and primary call-to-action button.
2. **Payment Receipt**:
   - SSLCommerz payment receipt detailing transaction ID, BDT amount (`৳`), plan tier, and merchant details.
3. **Critical Anomaly Alert**:
   - High-visibility banner, return rate surge metrics, carrier identification, and direct deep link to the AI investigation dashboard.

### Provider Dispatching
- Set `RESEND_API_KEY` and `EMAIL_FROM` to dispatch via Resend REST API.
- Without API keys, the service operates in mock logging mode.

---

## 6. Observability & Healthcheck Telemetry (`/api/health`)

A diagnostic endpoint is exposed at `GET /api/health` providing real-time infrastructure telemetry:

### Response Format
```json
{
  "status": "healthy",
  "timestamp": "2026-09-18T05:00:00.000Z",
  "uptimeSeconds": 1420,
  "environment": "production",
  "nodeVersion": "v20.x",
  "services": {
    "database": {
      "status": "connected",
      "latencyMs": 4,
      "error": null
    },
    "cache": {
      "mode": "redis",
      "operational": true
    }
  },
  "system": {
    "memory": {
      "rssMb": 84.12,
      "heapTotalMb": 48.5,
      "heapUsedMb": 32.18,
      "externalMb": 2.45
    }
  }
}
```

### Kubernetes Probe Configuration
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 15
  periodSeconds: 20
readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

---

## 7. Automated CI/CD Pipeline (`.github/workflows/ci.yml`)

The platform executes an automated GitHub Actions pipeline on every push and pull request to `main`:
1. **Services**: Boots PostgreSQL 15 and Redis 7 containers.
2. **Prisma Generation**: Generates strongly-typed client definitions.
3. **Typecheck**: Executes `tsc --noEmit` under strict TypeScript flags.
4. **Vitest Test Suite**: Runs 107+ unit and integration tests.
5. **Production Build**: Compiles Next.js standalone distribution.

---

## 8. Backup & Maintenance Procedures

### PostgreSQL Logical Backups
```bash
# Dump compressed PostgreSQL database with schema and RLS
pg_dump -U postgres -h localhost -d saas_bi -F c -b -v -f /backups/saas_bi_$(date +%Y%m%d).dump

# Restore from backup archive
pg_restore -U postgres -h localhost -d saas_bi -v /backups/saas_bi_20260918.dump
```

### Database Migrations
Always deploy database schema updates in zero-downtime increments:
```bash
# Apply pending production migrations
npx prisma migrate deploy
```

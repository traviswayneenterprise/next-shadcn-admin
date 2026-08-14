# TWE Learning — Backend and Administration

The authoritative backend API and staff administration application for the TWE Learning LMS. It owns identity, authorization, persistence, commerce, content publication, learning progression, cohorts, notifications, certificates, and operational records.

The learner application deploys independently and consumes this service through the versioned REST API under `/api/v1`.

## Architecture

```text
Learner browser
    |
    | credentialed HTTPS /api/v1
    v
Backend/admin application
    |-- Auth.js and PostgreSQL sessions
    |-- Prisma domain model and migrations
    |-- RBAC and learner entitlements
    |-- Paystack and provider webhooks
    |-- Content, assessment, cohort, and certificate rules
    `-- Staff administration UI
           |
           +-- Neon PostgreSQL
           +-- Cloudflare R2
           +-- Trigger.dev
           +-- Resend
           `-- Meta Cloud API
```

Authoritative cross-system documentation starts at [docs/README.md](docs/README.md). Important references include:

- [Phase 1 architecture](docs/architecture/phase-1.md)
- [Architecture decisions](docs/architecture/adr/README.md)
- [OpenAPI v1](docs/openapi/lms-v1.yaml)
- [Data ownership](docs/data-ownership.md)
- [Authentication and authorization](docs/security/authentication-authorization.md)
- [Collaboration workflow](docs/collaboration.md)
- [Release checklist](docs/release-checklist.md)

Architecture changes require an ADR pull request.

## Technology

- Next.js 16 and React 19
- TypeScript and Tailwind CSS 4
- Auth.js v5 with shared-domain database sessions
- Prisma 7 and PostgreSQL
- Argon2id password hashing
- OpenAPI 3.1 and generated TypeScript definitions
- Paystack, Cloudflare R2, Trigger.dev, Resend, and Meta Cloud API adapters
- pnpm and Node.js 20.9 or newer

## Local development

1. Install Node.js 20.9+ and enable Corepack.
2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Copy `.env.example` to `.env.local` and configure at minimum:

   ```dotenv
   APP_ENV=development
   AUTH_SECRET=replace-with-at-least-32-random-characters
   AUTH_COOKIE_DOMAIN=
   LEARNER_ORIGIN=http://localhost:3000
   DATABASE_URL=postgresql://user:password@localhost:5432/twe_lms
   DIRECT_URL=postgresql://user:password@localhost:5432/twe_lms
   ```

   Add provider credentials only for the integrations you are exercising. Never commit `.env.local`.

4. Validate and generate the Prisma client:

   ```bash
   pnpm db:validate
   pnpm db:generate
   ```

5. Apply development migrations and seed the fixed permission catalogue:

   ```bash
   pnpm db:migrate
   pnpm exec tsx prisma/seed.ts
   ```

6. Start the application on port `3001`:

   ```bash
   pnpm dev --port 3001
   ```

7. Start the learner frontend separately on port `3000`.

API health is available at `/api/v1/health`; the deployment health endpoint is `/health`.

## Commands

```bash
pnpm dev          # local application
pnpm build        # production webpack build
pnpm start        # production server
pnpm typecheck    # TypeScript validation
pnpm lint         # ESLint validation
pnpm db:validate  # validate Prisma schema
pnpm db:generate  # generate Prisma client
pnpm db:migrate   # create/apply a development migration
pnpm api:lint     # validate OpenAPI
pnpm api:types    # regenerate API TypeScript definitions
pnpm check        # combined quality checks
```

## Source layout

```text
docs/                    authoritative architecture and API documentation
prisma/                  schema, migrations, and seed data
src/app/api/auth/        Auth.js protocol routes
src/app/api/v1/          versioned learner and integration API
src/domain/              business rules independent of transport
src/generated/api/       generated OpenAPI TypeScript definitions
src/generated/prisma/    generated Prisma client
src/lib/auth/            session, password, permission, and adapter code
src/lib/payments/        payment provider adapter
src/lib/notifications/   notification provider adapters
```

## Contract and security rules

- Compatible changes extend `/api/v1`; breaking changes require `/api/v2`.
- Keep success/error envelopes, correlation IDs, UTC timestamps, cursor pagination, and idempotency keys consistent with OpenAPI.
- Browser writes require exact-origin validation and credentialed CORS is restricted to the learner origin.
- Staff permissions are enforced here; learners use entitlements rather than staff roles.
- Financial events, webhook deliveries, privilege changes, reviews, cohort overrides, and certificate lifecycle actions must remain auditable.
- Published lesson versions and financial records are immutable business history.

## Collaboration workflow

- Work from short-lived branches; do not push directly to `main`.
- The current architecture branch is `phase1/foundation`.
- Every feature has one primary implementer and one required cross-reviewer.
- Backend domain and OpenAPI changes merge before client publication and frontend integration.
- Architecture, schema, authentication, OpenAPI, payment, RBAC, and certificate changes require the product owner's approval.

## Current implementation status

The Phase 1 foundation includes the platform upgrade, architecture documentation, initial OpenAPI contract, Prisma domain schema, database-backed Auth.js and password flows, permission catalogue, catalogue endpoints, Paystack checkout/webhook foundations, content block validation, health checks, and production container support. Remaining LMS domains are delivered through reviewed cross-repository feature increments before beta.

## Template attribution

The staff interface was refactored from [reoring/next-shadcn-admin](https://github.com/reoring/next-shadcn-admin), itself based on the original shadcn admin dashboard. The template author remains configured as the repository's `upstream` remote and the existing license is preserved.

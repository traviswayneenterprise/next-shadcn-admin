# Week 1 Focus: Foundation, Contract, and Design System

**Dates:** August 17–23, 2026  
**Primary outcome:** A stable, deployable platform on which both collaborators can build safely.

## Objective

Finish the architectural foundation: green builds, CI, initial database migration, shared authentication, generated API client, non-production API documentation, provider access checks, and the first design-system baseline.

## Goal

By Friday, both applications deploy independently, authenticate together, use one validated `/api/v1` contract, and pass repeatable quality checks from a clean checkout.

## Assigned weekly deliverables

### Travis — technical deliverables

- Reviewed initial Prisma migration and idempotent permission seed.
- Hardened Auth.js/password session implementation with origin, expiry, revocation, and negative authorization tests.
- Authoritative OpenAPI contract with examples, error codes, security schemes, and generated-client release.
- API documentation generation pipeline and production exclusion controls.
- Green backend CI, environment validation, Docker health check, and provider-readiness report.

### Mr. Miracle — experience deliverables

- Complete learner authentication and protected-route states using the generated client.
- Non-production `/docs/api` renderer with responsive navigation and readable examples.
- Frontend CI and removal of remaining handwritten contract duplication.
- Component inventory and upgraded core learner/admin primitives.
- Browser, responsive, keyboard, and API-consumer review evidence.

### Shared end-of-week deliverable

Two green preview deployments with secure shared authentication, a clean migration/seed, one pinned API client, non-production API docs, and a reviewed design-system baseline.

## Procedures

The Monday audit evidence, assigned work, dependencies, component decisions, and acceptance criteria are recorded in the [Week 1 Day 1 technical baseline](week-01-day-01-technical-baseline.md).

### Monday — Baseline and ownership

1. Pull `phase1/foundation` and confirm both worktrees are clean.
2. Create cross-repository issues for database, auth, OpenAPI client, API docs, CI, provider checks, and components.
3. Assign an implementer and reviewer to every issue.
4. Record required environment variables without putting secrets in Git.
5. Capture current build, typecheck, Prisma, and OpenAPI failures as issue evidence.

### Tuesday — Persistence and authentication

1. Create the initial Neon migration from the reviewed Prisma schema.
2. Apply the migration to a disposable branch database.
3. Run the seed twice to prove idempotency.
4. Test password registration, verification, login, logout, Google OAuth, expiry, and revocation.
5. Confirm exact-origin CORS and cookie behavior between local learner and backend origins.

### Wednesday — Contract and documentation

1. Lint OpenAPI and generate TypeScript types from it.
2. Package the client with a version tied to the contract.
3. Pin the exact version in the frontend.
4. Replace handwritten API response types where generated types exist.
5. Add `/docs/api` to the frontend using the generated contract artifact.
6. Verify `/docs/api` returns `404` in production mode unless explicitly enabled.

### Thursday — CI and components

1. Add required checks for install, lint, typecheck, build, Prisma validation, OpenAPI lint, and tests.
2. Audit buttons, inputs, forms, dialogs, navigation, tables, loading, empty, and error states.
3. Define design tokens and component ownership rules in both repositories.
4. Import only the minimum registry components needed for the baseline.
5. Smoke-test Neon, R2, Paystack, Resend, Meta, Trigger.dev, and Vercel credentials.

### Friday — Integration gate

1. Deploy both preview applications.
2. Run authentication end to end in a browser.
3. Run all CI commands from clean checkouts.
4. Review security-sensitive diffs together.
5. Record failures, decisions, and Week 2 risks.

## Best coding practices

- Make migrations additive, reviewed, reproducible, and safe to apply once.
- Validate environment variables at startup and distinguish server-only from public values.
- Generate contract types; do not hand-maintain equivalent interfaces.
- Keep authentication and authorization checks server-side and deny by default.
- Return stable error codes, correlation IDs, and UTC timestamps.
- Use small PRs with one architectural concern each.
- Test failure paths, expired sessions, missing permissions, and invalid origins.
- Prefer accessible primitives and preserve keyboard and reduced-motion behavior.

## Don’ts

- Don’t put Prisma, database URLs, Auth.js secrets, payment secrets, or staff RBAC in the frontend.
- Don’t edit generated Prisma or OpenAPI files manually.
- Don’t create a production migration before reviewing its SQL.
- Don’t use `any` to bypass contract incompatibilities.
- Don’t expose internal API docs or operational endpoints publicly.
- Don’t import large registry component sets without an immediate use case.
- Don’t merge with failing CI or unresolved auth/security review comments.

## Required evidence

- CI run links for both repositories.
- Migration SQL and successful clean-database application.
- Seed idempotency output.
- OpenAPI lint and client-generation output.
- Browser evidence for login, session state, logout, and production docs hiding.
- Component audit list with keep, update, replace, and remove decisions.

## Exit gate

Week 1 is complete only when both builds are green, auth works across origins, the migration and seed pass cleanly, the frontend pins the generated client, and production cannot expose `/docs/api` by default.

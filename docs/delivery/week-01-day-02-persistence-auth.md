# Week 1 Day 2: Persistence and Authentication Draft PR Evidence

**Date:** August 18, 2026

**Technical implementer:** Travis

**Required reviewer:** Mr. Miracle

**Current gate:** Clean Neon migration and seed idempotency pass; cross-origin browser integration and joint review remain open.

## Draft PRs

| Repository | Branch | Scope | State |
| --- | --- | --- | --- |
| Backend/admin | `feat/week1-persistence-auth` | Initial migration, idempotent seed, auth/session hardening, Origin policy, password reset, OpenAPI | Local draft ready |
| Learner frontend | `feat/week1-auth-ui-states` | Registration, login, verification, forgot/reset password, loading, success, and error states | Local draft ready |

Neither branch may merge until both collaborators review it and the database/browser gates below are complete.

## Initial migration review

- Source: `prisma/migrations/20260818090000_initial/migration.sql`
- SHA-256: `4F0BEA4A00F17628A29A042835EB0F198E3385FC8B2600CA40BCABBA5BC0C67D`
- Generated from the reviewed Prisma 7 schema using `prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`.
- Contains 58 tables, 27 PostgreSQL enum types, and 154 regular or unique indexes.
- Contains no `DROP`, `TRUNCATE`, or `DELETE FROM` statements.
- Adds explicit role-assignment scope checks and partial unique indexes for active global, track, and cohort role assignments.
- Prisma schema validation passes.

## Seed idempotency design

- A PostgreSQL transaction advisory lock prevents concurrent deploys from racing the bootstrap.
- Explicit transaction wait/runtime limits tolerate Neon compute wake-up without weakening atomicity.
- `dotenv` is a direct runtime dependency because the standalone seed imports `dotenv/config`.
- Permissions are upserted by their immutable key.
- The protected Owner role is created once and only updated when protected fields drift.
- Owner-role permissions use the `RolePermission` composite key with `skipDuplicates`.
- The owner account is created once and only updated when verification/status repair is required.
- The active global owner assignment is queried before creation and also protected by the migration's partial unique index.

Two consecutive execution runs passed against the same clean Neon validation branch with no duplicate permission keys, roles, or role-permission links.

## Authentication and security changes

- Password-session tokens are random in the cookie and SHA-256 hashed in PostgreSQL; existing Auth.js opaque tokens remain readable during transition.
- Expired, revoked, suspended, and archived sessions are rejected; invalid cookies are cleared.
- The session response resolves effective global staff permissions instead of returning an empty list.
- Login, registration, verification, and password-reset attempts use PostgreSQL-backed security events for durable per-IP throttling.
- Password reset requests do not disclose whether an account exists.
- Reset and verification tokens are hashed, expiring, and atomically single use.
- A successful password reset revokes every existing user session.
- Unsafe browser writes require the exact learner or backend Origin. Requests with a missing or foreign Origin are rejected.
- The signed Paystack webhook is the only current Origin-policy exemption.
- OpenAPI now documents registration, verification, password login, forgot/reset password, logout, and their error outcomes.

## Learner authentication UI states

- Registration: field validation, pending state, API error, success toast, and verification-inbox state.
- Email verification: waiting, verifying, verified, invalid/expired, and navigation states.
- Login: field/API errors, loading, verified notice, reset-success notice, Google OAuth, and a validated local return path.
- Password reset request: invalid email, submitting, generic accepted, rate/API error, and completed states.
- Password update: incomplete link, weak password, mismatch, submitting, invalid/expired token, success, and sign-in redirect states.
- Session presentation: loading, authenticated, unauthenticated, protected-route redirect, and logout invalidation.

## Local evidence

| Check | Result |
| --- | --- |
| Backend Prisma validation | Pass |
| Backend focused ESLint | Pass, including the hardened seed |
| Backend TypeScript `--noEmit` | Blocked by existing Next.js typed-route mismatches in auth/navigation components; no seed-file error reported |
| Origin-policy tests | Pass: 3 tests |
| OpenAPI validation | Pass with the 14 pre-existing documentation warnings |
| OpenAPI TypeScript generation | Pass |
| Frontend focused ESLint | Pass |
| Frontend TypeScript `--noEmit --incremental false` | Pass |
| Clean Neon migration application | Pass: `20260818090000_initial` recorded as completed |
| Seed run 1 and run 2 | Pass: both completed against the same validation branch |
| Cross-origin browser authentication | Blocked until the migrated backend is running |

## Clean Neon evidence

- Organization: `Travis`
- Project: `LMS` (`silent-leaf-32680926`)
- Validation branch: `week1-migration-validation` (`br-snowy-base-axnh6gjh`)
- Parent branch: empty `main` (`br-gentle-violet-axzcs1ec`)
- Database: `neondb`
- PostgreSQL: 18.4
- Application tables: 58, plus Prisma migration metadata (59 public tables total)
- Completed initial migrations: 1
- Permission catalogue rows: 23
- Protected Owner roles: 1
- Owner role-permission links: 23
- Synthetic validation owner users: 1
- Active global Owner assignments: 1
- Duplicate permission keys: 0
- Duplicate role names: 0
- Duplicate role-permission links: 0
- Active-scope partial unique indexes: 3
- Role-assignment scope constraints: 1

The first disposable validation branch was deleted and recreated after the initial combined command was interrupted at the two-minute command timeout. No user data existed on that branch. The successful migration used Prisma's migration-compatible direct Neon URL form without the connector-added `channel_binding` query parameter. Seed validation used the pooled runtime endpoint and included two additional passes with `owner-validation@lms.invalid` to exercise the optional owner bootstrap path. No connection string or credential is stored in this repository.

## Clean Neon execution checklist

Run only against a disposable, empty Neon branch:

1. Set `DIRECT_URL`, `DATABASE_URL`, and `OWNER_EMAIL` without printing their values.
2. Run `pnpm db:migrate:deploy`.
3. Run `pnpm db:seed` twice.
4. Confirm 58 application tables plus Prisma migration metadata exist.
5. Confirm permission count equals the fixed catalogue, exactly one protected Owner role exists, every catalogue permission is assigned once, and one active global owner assignment exists.
6. Capture sanitized command output and the Neon branch identifier in this document.
7. Exercise register → verify → login → session → logout and forgot → reset → old-session rejection across the learner/backend origins.

## Review gate

- [ ] Mr. Miracle reviews learner states, responsive behavior, keyboard flow, and wording.
- [ ] Travis reviews migration SQL, seed results, session storage, Origin policy, rate limits, and OpenAPI.
- [x] Clean Neon migration succeeds.
- [x] First and second seed runs produce the same protected records without duplicates or drift.
- [ ] Cross-origin browser authentication passes with secure shared-domain cookies.
- [ ] Negative cases pass: foreign/missing Origin, invalid/expired/reused tokens, throttling, suspended user, and revoked session.
- [ ] Both draft PRs receive cross-review before merge.

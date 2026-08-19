# Week 1 Day 3 — API contract, client, and internal reference

## Objective and ownership

- **Primary implementer:** Travis (Lead)
- **Required reviewer:** Mr. Miracle
- **Backend branch:** `feat/week1-openapi-client`
- **Frontend branch:** `feat/week1-api-docs-integration`
- **Dependency:** merge the backend contract/client PR before the frontend
  integration PR. Neither branch depends on Miracle's draft auth-flow branch.

## Deliverables

- OpenAPI v1 linted with zero warnings and bundled as JSON.
- Version `1.0.0` of `@traviswayneenterprise/lms-api-client`, including generated
  types, typed request helper, package metadata, and GitHub Packages workflow.
- Development API reference at `/docs/api` and auth guide at
  `/docs/api/authentication` in the learner frontend.
- The complete docs route group returns 404 when `NODE_ENV=production`.
- CI detects stale generated artifacts and incompatible frontend snapshots.

## Required evidence

Record the final command output in the PRs:

1. Backend: `pnpm api:lint`, `pnpm api:client`, and `pnpm api:pack`.
2. Frontend: `pnpm api:verify`, lint, typecheck, and production build.
3. HTTP checks: `/` returns 200 while `/docs`, `/docs/api`, and
   `/docs/api/authentication` each return 404 from the production server.

## Local verification — August 19, 2026

| Gate | Result |
| --- | --- |
| OpenAPI lint | Passed with zero warnings |
| Client generation/build | Passed; generated types and bundled JSON at v1.0.0 |
| Package dry run | Passed; `traviswayneenterprise-lms-api-client-1.0.0.tgz` was 13,623 bytes |
| Frontend contract check | Passed; version and required auth paths agree |
| Frontend typecheck | Passed |
| Changed-file lint | Passed |
| Production build | Passed on Next.js 16.2.11; 41 static pages generated |
| Development reference | `/docs/api` and `/docs/api/authentication` returned 200 with rendered content |
| Production control | `/` returned 200 |
| Production exclusion | `/docs`, `/docs/api`, `/docs/api/authentication`, and `/guides` returned 404 |

The first production build also exposed an unrelated starter bug: missing
related blog slugs were asserted as present and crashed prerendering. The
frontend integration branch now filters unresolved related posts, and the
subsequent production build passed. Full repository lint remains a separate
baseline-remediation gate because legacy starter/generated files still contain
existing violations; all files changed for this delivery pass targeted lint.

Publication is performed only after review and merge by tagging
`api-client-v1.0.0`. The GitHub Packages publish itself is not part of a local
working-tree verification and must not be claimed before the workflow succeeds.

## Pull request handoff

1. Backend PR into `feat/week1-persistence-auth`: contract, generated package,
   CI, and authoritative documentation.
2. Frontend PR into `feat/week1-auth-ui-states`: exact `1.0.0` contract snapshot,
   rendered reference, auth guide, and production exclusion.
3. Mr. Miracle reviews UI/document clarity; Travis approves contract and release.
4. After both land and the package is published, replace the checked-in snapshot
   transport with the exact GitHub Packages dependency in a small integration PR.

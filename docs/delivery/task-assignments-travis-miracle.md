# Phase 1 Task Assignments: Travis and Mr. Miracle

**Delivery period:** August 17–September 27, 2026  
**Contingency:** September 28–October 4, 2026  
**Timezone:** Africa/Lagos  
**Product and technical lead:** Travis  
**Engineering collaborator:** Mr. Miracle

## Purpose

This document assigns primary responsibility, review responsibility, and expected evidence for each delivery day. It should be used with the [six-week delivery plan](phase-1-six-week-plan.md) and the [weekly focus guides](README.md).

Assignments may be swapped during Monday planning when availability or expertise requires it. Any swap must be recorded in the related issue before implementation begins. Every feature still requires one primary implementer and the other person as reviewer.

## Standing responsibilities

### Travis — Lead

Travis is accountable for:

- Product scope, architecture consistency, and final technical decisions.
- Learner-frontend implementation and frontend component quality.
- Cross-repository integration and acceptance-test coordination.
- Final approval of architecture, schema, authentication, OpenAPI, payment, RBAC, and certificate changes.
- Reviewing Mr. Miracle’s backend, data, provider, and operational changes.
- Keeping delivery issues, weekly gates, and beta evidence complete.
- Escalating scope, provider, security, or schedule risks early.

### Mr. Miracle — Backend and platform primary

Mr. Miracle is accountable for:

- Backend API, domain services, Prisma schema changes, and migrations.
- Authentication, authorization, audit, and security enforcement.
- Provider integrations, durable jobs, webhooks, and operational screens.
- Backend/admin component implementation and staff workflows.
- Reviewing Travis’s frontend, API-client integration, and learner experience changes.
- Supplying backend test evidence and operational runbook updates.
- Raising contract and data-model risks before frontend integration begins.

### Shared responsibilities

- Attend Monday scope assignment, Thursday integration review, and Friday acceptance review.
- Review each other’s pull requests; authors do not approve their own work.
- Keep `main` protected and work through short-lived branches.
- Update OpenAPI before dependent frontend implementation.
- Record decisions and blockers in GitHub issues, not only in chat.
- Stop and escalate when security, data integrity, payment correctness, or release gates are at risk.

## Daily definition of done

A daily assignment is complete when:

- The issue is updated with progress, decisions, blockers, and the next action.
- Code is committed to a named branch and pushed for visibility.
- Relevant tests pass locally.
- A draft or ready-for-review pull request exists when code changed materially.
- Documentation and OpenAPI changes are included with the implementation.
- The reviewer has enough evidence to reproduce the result.

## Week 1 assignments — Foundation, contract, and design system

**Dates:** August 17–23

| Day | Travis — Lead | Mr. Miracle | Expected end-of-day deliverable |
| --- | --- | --- | --- |
| Monday | Create the Week 1 board, confirm acceptance criteria, assign issues, audit frontend build and component state, and approve environment-variable boundaries. | Audit backend build, Prisma, OpenAPI, authentication, and provider configuration; prepare the migration and CI issue breakdown. | Prioritized board with owner/reviewer on every issue, baseline failure report, environment checklist, and agreed Week 1 gate. |
| Tuesday | Implement and test frontend shared-session behavior, protected routes, login/logout states, and exact API-origin configuration. Review migration SQL and auth security design. | Create the initial Neon migration, verify clean application, make seed idempotent, and test registration, verification, login, logout, expiry, and revocation. | Reviewed migration PR, seed evidence, auth PR, and browser session test notes. |
| Wednesday | Integrate the generated API client, remove remaining handwritten duplicates, and implement non-production `/docs/api`. | Finalize OpenAPI, run lint, generate and version the client package, and add compatibility checks. | Released or locally consumable exact client version, frontend integration PR, API docs preview, and production `404` test. |
| Thursday | Define learner design tokens; update core frontend buttons, forms, navigation, tables, loading, empty, and error states. Add frontend CI. | Update equivalent admin primitives, complete backend CI, and smoke-test Neon, R2, Paystack, Resend, Meta, Trigger.dev, and Vercel access. | Green CI definitions, component audit, updated core primitives, and provider readiness matrix. |
| Friday | Coordinate deployed end-to-end testing, review Mr. Miracle’s security-sensitive changes, resolve integration issues, and lead acceptance review. | Review Travis’s frontend/client changes, deploy backend preview, fix backend integration defects, and provide final test evidence. | Two green preview deployments, authentication evidence, clean-checkout build evidence, reviewed PRs, and Week 1 acceptance record. |

**End-of-week deliverable:** Both applications build and deploy independently, authentication works across origins, the migration and seed pass cleanly, the frontend pins the generated client, and `/docs/api` is unavailable publicly by default.

## Week 2 assignments — Catalogue, commerce, and learner access

**Dates:** August 24–30

| Day | Travis — Lead | Mr. Miracle | Expected end-of-day deliverable |
| --- | --- | --- | --- |
| Monday | Approve the purchase journey, learner states, acceptance tests, and OpenAPI changes. Prepare catalogue and checkout UI tasks. | Define financial invariants, payment state transitions, idempotency, capacity reservation, and test fixtures. | Approved commerce contract, state-transition diagram, test references, and assigned issues. |
| Tuesday | Build catalogue, offering comparison, NGN pricing, and checkout-start screens against the generated client. | Implement published catalogue queries, offerings, immutable prices, checkout validation, pending payment creation, and Paystack initialization. | Catalogue and checkout PRs with contract tests and loading/error states. |
| Wednesday | Implement redirect return, pending reconciliation, success, failure, and cancellation experiences. Review webhook security and entitlement transaction logic. | Persist and verify Paystack webhooks, verify transactions directly, and grant entitlements transactionally and idempotently. | Working purchase flow in preview plus duplicate and out-of-order webhook automated tests. |
| Thursday | Build entitlement dashboard, payment history, manual-grant display, and access-revoked states. | Implement refunds, confirmed chargebacks, independent manual grants, audit records, and reconciliation jobs. | Dashboard integration PR and reversal/manual-grant test evidence. |
| Friday | Lead full purchase-to-access testing and UI review; approve protected payment changes. | Review frontend commerce behavior, execute webhook replay and provider failure tests, and resolve backend defects. | Passing NGN checkout, duplicate webhook, refund, chargeback, capacity, and manual-grant acceptance report. |

**End-of-week deliverable:** Both offering types can be purchased safely in NGN, exactly one correct entitlement is granted, reversals behave correctly, and the dashboard reflects authoritative access.

## Week 3 assignments — Content, import, and lesson delivery

**Dates:** August 31–September 6

| Day | Travis — Lead | Mr. Miracle | Expected end-of-day deliverable |
| --- | --- | --- | --- |
| Monday | Approve block catalogue, editor experience, lesson navigation, lab behavior, and manual-review process. | Finalize block schemas, migration functions, publication rules, source mappings, and importer report structure. | Approved content contract, mapping table, import checklist, and assigned component work. |
| Tuesday | Build staff editor, preview, validation feedback, asset UI, and initial learner block renderers. | Implement document validation, reusable-block snapshots, immutable publication, and authorized R2 asset flows. | Editor/rendering PR and backend content/asset tests. |
| Wednesday | Complete remaining block renderers and create the manual content-review interface/checklist. | Implement deterministic, resumable import and run it against all 48 curriculum folders. | Import report for 48 folders, draft records, warnings, and review queue. |
| Thursday | Build lesson/module navigation, locked states, progress feedback, and sandboxed lab experience. Review iframe/CSP behavior. | Implement prerequisites, cohort release enforcement, progress services, scheduled publication, and lab-origin security rules. | Complete lesson-delivery preview with progression and sandbox security tests. |
| Friday | Coordinate manual review sampling, publish and learn through the track, and approve content/security changes. | Review frontend renderers, fix importer/publication defects, and prove published-version immutability. | All lessons imported as drafts, manual-review status recorded, full-track candidate published, and sequential-learning evidence. |

**End-of-week deliverable:** All 48 folders import as reviewable drafts, supported blocks render safely, published versions are immutable, and one complete track is learnable sequentially.

## Week 4 assignments — Assessments, submissions, and reviews

**Dates:** September 7–13

| Day | Travis — Lead | Mr. Miracle | Expected end-of-day deliverable |
| --- | --- | --- | --- |
| Monday | Approve learner quiz, submission, feedback, and staff review experiences. Define boundary acceptance examples. | Finalize quiz, attempt, cooldown, assignment, rubric, submission, review, and eligibility contracts and fixtures. | Approved assessment contract, scoring examples, review states, and assigned issues. |
| Tuesday | Build quiz taking, results, explanations, retry, and cooldown screens. | Implement versioned quiz engine, randomized presentation, server grading, attempts, and cooldown enforcement. | Quiz vertical-slice PR with boundary-value tests. |
| Wednesday | Build submission/resubmission forms, upload states, history, and feedback timeline. | Implement assignments, authorized R2 files, immutable submission versions, URL validation, and status history. | Submission vertical-slice PR and history/security test evidence. |
| Thursday | Build staff pending-review queue, reviewer assignment, rubric scoring, feedback, and decisions. | Implement concurrency-safe assignments, versioned rubrics, review transitions, audit, notifications, and eligibility reevaluation. | Review-workflow PR with authorization and concurrency tests. |
| Friday | Lead learner-to-reviewer acceptance testing and approve protected assessment changes. | Review frontend assessment UX, execute negative authorization tests, and fix domain defects. | Passing quiz, cooldown, resubmission, reviewer, rubric, and eligibility acceptance record. |

**End-of-week deliverable:** Learners complete versioned mastery checks and project submissions; reviewers act through scoped, audited workflows; all attempts and versions remain preserved.

## Week 5 assignments — Cohorts and notifications

**Dates:** September 14–20

| Day | Travis — Lead | Mr. Miracle | Expected end-of-day deliverable |
| --- | --- | --- | --- |
| Monday | Approve cohort learner/staff journeys, timezone display rules, consent UI, and notification preferences. | Finalize cohort, schedule, attendance, notification, job, and provider contracts; confirm WhatsApp templates. | Approved cohort contract, timezone fixtures, consent wording, and provider readiness status. |
| Tuesday | Build learner cohort overview, schedule, releases, deadlines, announcements, and staff cohort forms. | Implement cohort lifecycle, capacity, memberships, releases, deadlines, overrides, extensions, and live sessions. | Cohort scheduling vertical slice with scoped authorization tests. |
| Wednesday | Build learner check-in, attendance history, and staff attendance/correction/import/export UI. | Implement short-lived check-in tokens, attendance states, audited corrections, and transactional CSV processing. | Attendance PR with expiry, replay, correction, and CSV validation evidence. |
| Thursday | Build notification center, channel preferences, failure states, and relevant admin views. | Implement in-app events, Trigger.dev jobs, Resend, consented Meta delivery, idempotency, retries, and delivery records. | Three-channel notification preview and duplicate-job test evidence. |
| Friday | Lead full managed-cohort journey and accessibility review. Verify self-paced ownership independence. | Review frontend cohort UX, run provider/timezone/failure tests, and resolve integration defects. | Passing cohort, scheduling, attendance, notification, and ownership-independence acceptance report. |

**End-of-week deliverable:** Managed cohorts, scheduling, attendance, and all three notification channels work end to end without coupling cohort membership to permanent track ownership.

## Week 6 assignments — Certificates, hardening, and beta

**Dates:** September 21–27

| Day | Travis — Lead | Mr. Miracle | Expected end-of-day deliverable |
| --- | --- | --- | --- |
| Monday | Approve certificate requirements, learner pending/display states, public privacy fields, and approval workflow. | Implement eligibility evaluation, idempotent pending approvals, approval authorization, and audit records. | Eligibility/approval PR with requirement and authorization tests. |
| Tuesday | Build certificate display, download, QR destination, public verification, revoked, and reissued states. | Implement secure token generation, PDF/QR creation, R2 storage, verification API, and privacy filtering. | Generated test certificate and passing public-verification privacy review. |
| Wednesday | Build staff lifecycle and operational failure views; review certificate wording and accessibility. | Implement revocation/reissue history and complete webhook, job, delivery, audit, and security operations. | Full certificate lifecycle and operator-retry evidence. |
| Thursday | Lead frontend accessibility, responsive, reduced-motion, and browser testing; coordinate complete authorization matrix. | Execute backend security matrix, database restore, R2 lifecycle, secret rotation, Docker/VPS, replay, and retry runbooks. | Accessibility report, security results, and executed recovery/portability records. |
| Friday | Run the full beta checklist, verify 48-lesson manual review, lead final cross-repository review, and record the release decision. | Support full regression, resolve backend blockers, review frontend release changes, and assemble operational evidence. | Signed beta checklist, clean deployments, review approvals, and explicit beta sign-off or documented blockers. |

**End-of-week deliverable:** Certificate lifecycle works securely, recovery and security procedures pass, every beta requirement has evidence, and Travis records the final release decision.

## Week 7 assignments — Contingency only

**Dates:** September 28–October 4

| Day | Travis — Lead | Mr. Miracle | Expected end-of-day deliverable |
| --- | --- | --- | --- |
| Monday | Triage remaining gate failures, reject new scope, set severity and priority, and assign remediation. | Reproduce backend/provider failures and prepare failing regression tests. | Frozen remediation list containing only release blockers and high-severity defects. |
| Tuesday | Fix prioritized frontend/integration blockers and review backend security/payment fixes. | Fix prioritized backend, provider, data, and operational blockers. | Focused PRs with reproduction and regression tests. |
| Wednesday | Continue only accepted remediation and verify learner journeys. | Continue only accepted remediation and verify data/provider behavior. | All accepted fixes in review with evidence; no unapproved scope. |
| Thursday | Coordinate full regression, accessibility, clean deployment, and rollback verification. | Repeat recovery, security, payment, provider, job, and webhook tests. | Complete repeated test record and clean deployment/rollback evidence. |
| Friday | Lead final checklist and make the explicit ship-or-delay decision. | Review residual risk and confirm operational readiness or remaining blockers. | Approved beta release or documented delay with unresolved mandatory gates. |

**End-of-week deliverable:** Every mandatory gate passes with evidence and Travis approves beta, or the release is delayed without bypassing requirements.

## Pull-request assignment rules

| Change type | Primary implementer | Required reviewer | Final approval |
| --- | --- | --- | --- |
| Learner UI and frontend integration | Travis | Mr. Miracle | Travis for protected domains |
| Backend API and domain service | Mr. Miracle | Travis | Travis for protected domains |
| Prisma schema and migration | Mr. Miracle | Travis | Travis |
| OpenAPI and generated client release | Mr. Miracle | Travis | Travis |
| Admin/staff UI | Mr. Miracle | Travis | Travis when authorization is affected |
| Shared design tokens and learner components | Travis | Mr. Miracle | Travis |
| Payments, RBAC, auth, certificates | Mr. Miracle | Travis | Travis |
| End-to-end acceptance and release checklist | Travis | Mr. Miracle | Travis |

## Status reporting format

At the end of each workday, both collaborators post:

```text
Completed:
- Issue/PR and verifiable result

Reviewed:
- PR or decision reviewed

Blocked:
- Specific blocker, owner, and required next action

Tomorrow:
- First task and intended deliverable
```

Friday’s report additionally records:

- Weekly exit gate: pass or fail.
- Acceptance evidence links.
- Incomplete work and which following-week task it displaces.
- New risks and their owners.
- Product-owner decision where required.

## Assignment don’ts

- Don’t work on the same branch.
- Don’t approve your own pull request.
- Don’t begin frontend integration against an unapproved breaking contract.
- Don’t let Travis’s lead role replace Mr. Miracle’s required review.
- Don’t let review responsibility become passive observation; reproduce the result.
- Don’t hide blockers until Friday.
- Don’t carry work forward without changing the next week’s committed scope.
- Don’t merge protected-domain changes without Travis’s explicit approval.

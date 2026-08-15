# Phase 1 Technical Task Assignments

- **Delivery period:** August 17–September 27, 2026
- **Contingency:** September 28–October 4, 2026
- **Timezone:** Africa/Lagos
- **Technical and product lead:** Travis
- **Learner and administration experience lead:** Mr. Miracle

## Assignment strategy

Travis owns the technically sensitive and authoritative parts of the LMS: architecture, API documentation, domain modeling, persistence, backend behavior, security, provider integrations, infrastructure, and release engineering.

Mr. Miracle owns the learner and staff experiences built on top of those contracts: frontend integration, administration interfaces, component modernization, responsive behavior, accessibility, and consumer-side testing.

This allocation does not remove cross-review. Mr. Miracle reviews APIs for usability and contract completeness. Travis reviews frontend integrations for authorization, data ownership, privacy, and architectural correctness.

Use this document with the [six-week plan](phase-1-six-week-plan.md) and [weekly focus guides](README.md).

## Travis — technical ownership

### Architecture and contracts

- Phase 1 architecture and ADRs.
- Domain glossary and data-ownership boundaries.
- OpenAPI source, endpoint design, schemas, examples, error codes, pagination, idempotency, and versioning.
- API documentation content and generation pipeline.
- Generated TypeScript client packaging, versioning, and release.
- Approval of breaking and protected-domain changes.

### Backend and data

- Prisma schema, indexes, constraints, migrations, and seed data.
- Domain services, repositories, transactions, invariants, and state machines.
- `/api/v1` routes, request validation, response envelopes, and correlation IDs.
- Authentication, sessions, credentials, OAuth, CSRF/origin validation, rate limits, and revocation.
- Staff RBAC, scoped permissions, learner entitlements, and audit events.
- Content publication, progression, quizzes, submissions, reviews, cohorts, notifications, and certificates.

### Providers and operations

- Neon, Cloudflare R2, Paystack, Trigger.dev, Resend, and Meta Cloud API integrations.
- Signed webhooks, replay handling, reconciliation, retries, and idempotency.
- Environment validation, secrets, Docker, health checks, CI, deployment, and VPS portability.
- Operational records, failure screens, runbooks, backup restoration, and secret rotation.
- Backend unit, integration, contract, security, and recovery tests.

### Leadership and approval

- Weekly technical scope and dependency order.
- Review of Mr. Miracle’s client integration and staff/learner UI PRs.
- Final approval of architecture, schema, auth, OpenAPI, payments, RBAC, and certificates.
- Cross-repository acceptance coordination and final beta decision.

## Mr. Miracle — experience ownership

### Learner frontend

- Marketing-to-enrollment flow, catalogue, pricing, checkout states, and dashboard.
- Authentication forms and shared-session presentation.
- Lesson navigation, content rendering, labs, progression feedback, and locked states.
- Quiz, assignment, submission, cohort, notification, and certificate experiences.
- Loading, empty, validation, unauthorized, offline, delayed-provider, and failure states.

### Staff administration

- Content editor, preview, publishing, asset, and curriculum-review interfaces.
- Payment, entitlement, review, cohort, attendance, notification, certificate, and operational administration screens.
- Permission-aware navigation and action visibility without treating UI checks as authorization.
- Tables, filtering, pagination, forms, bulk actions, and confirmation flows.

### Components and frontend quality

- Component audit and modernization in both applications.
- Design-token implementation and consistent component variants.
- Generated API-client consumption and query/form integration.
- Responsive behavior, semantic HTML, keyboard navigation, focus management, reduced motion, and accessibility testing.
- Frontend component, integration, and browser tests.
- API review from the client-consumer perspective.

## API documentation responsibility

| Work | Owner | Reviewer |
| --- | --- | --- |
| OpenAPI paths, methods, parameters, schemas, responses, and security | Travis | Mr. Miracle |
| Examples, error codes, idempotency behavior, and compatibility | Travis | Mr. Miracle |
| Contract linting, generated types, client packaging, and version release | Travis | Mr. Miracle |
| Frontend `/docs/api` route, renderer, navigation, and responsive presentation | Mr. Miracle | Travis |
| Production exclusion and internal-docs feature flag | Travis | Mr. Miracle |
| Verification that rendered docs match the current contract | Both | Both |

The backend OpenAPI file remains authoritative. Mr. Miracle must not create a second handwritten API specification in the frontend.

## Daily working protocol

1. Travis publishes or approves the contract and fixtures before dependent UI work begins.
2. Mr. Miracle integrates through the generated client, never direct database or provider access.
3. Travis implements domain rules and negative authorization tests.
4. Mr. Miracle implements every relevant UI state and consumer integration test.
5. Mr. Miracle reviews API usability and reports missing data or ambiguous errors through the contract issue.
6. Travis reviews privacy, authorization, state transitions, and data ownership in the completed flow.
7. Both reproduce the end-to-end result in preview before merge.

## Daily definition of done

- The issue lists one implementer and one reviewer.
- Code is committed and pushed to a short-lived branch.
- Relevant automated tests pass.
- OpenAPI and generated-client changes are current when the contract changed.
- The PR contains reproduction steps and screenshots or API evidence.
- Blockers name an owner and required action.
- The end-of-day status report is posted.

## Week 1 — Foundation, contract, and design system

**Dates:** August 17–23

| Day | Travis — technical deliverable | Mr. Miracle — experience deliverable | Expected end-of-day result |
| --- | --- | --- | --- |
| Monday | Audit architecture, backend build, Prisma, OpenAPI, auth, CI, and providers. Define issue dependencies and environment boundaries. | Audit both UIs, direct data/auth remnants, components, accessibility baseline, and frontend build. | Assigned board, dependency map, baseline report, component inventory, and agreed gate. |
| Tuesday | Create/review initial migration SQL, apply it to a clean Neon branch, make seed idempotent, and harden auth/session/origin behavior. | Complete learner login, registration, verification, logout, session-loading, and protected-route presentation against approved fixtures. | Migration/auth draft PRs, clean-database evidence, and complete authentication UI states. |
| Wednesday | Finalize and lint OpenAPI, generate and version the client, document auth/API routes, and define production docs exclusion. | Replace temporary API types with the generated client and implement the non-production `/docs/api` renderer. | Client release/integration PRs, rendered API reference, and production `404` evidence. |
| Thursday | Implement CI, environment validation, Docker/health checks, and provider connectivity tests. Review frontend token architecture. | Establish design tokens and modernize core buttons, inputs, forms, dialogs, navigation, tables, loading, empty, and error components. | Green CI definitions, provider matrix, and reviewed core component baseline. |
| Friday | Deploy backend preview, run security/contract checks, review UI integration, and lead cross-repository acceptance. | Deploy frontend preview, review API usability, test browser session behavior, and resolve experience defects. | Two green deployments, reviewed PRs, auth evidence, and signed Week 1 gate. |

**Weekly deliverable:** Clean builds and deployments, initial migration and seed, secure shared authentication, validated OpenAPI, pinned generated client, non-production API docs, and a stable component baseline.

## Week 2 — Catalogue, commerce, and access

**Dates:** August 24–30

| Day | Travis — technical deliverable | Mr. Miracle — experience deliverable | Expected end-of-day result |
| --- | --- | --- | --- |
| Monday | Define catalogue/commerce OpenAPI, financial invariants, payment states, idempotency, entitlement rules, and test references. | Convert the approved purchase journey into screens, states, component tasks, and consumer questions. | Approved contract, state model, fixtures, and UI flow map. |
| Tuesday | Implement catalogue, offerings, immutable NGN prices, capacity validation, pending payments, and Paystack initialization. | Build catalogue, offering comparison, NGN pricing, and checkout-start interfaces. | Checkout initialization vertical slice in review. |
| Wednesday | Implement signed webhook persistence, direct verification, transactional entitlement grants, replay protection, and reconciliation. | Build redirect return, pending, success, failure, cancelled, and delayed-verification states. | Preview purchase flow and automated duplicate/out-of-order webhook evidence. |
| Thursday | Implement refund, confirmed chargeback, independent manual grant, payment history, audit, and admin APIs. | Build entitlement dashboard, payment history, access-revoked, manual-grant, and commerce admin views. | Reversal/access vertical slice with complete UI states. |
| Friday | Run payment/security tests, review frontend handling, and approve commerce changes. | Review API usability and run learner/admin browser acceptance. | Passing NGN checkout, reversal, idempotency, capacity, and entitlement report. |

**Weekly deliverable:** An authoritative Paystack purchase-to-entitlement flow with complete learner and staff interfaces.

## Week 3 — Content, import, and lessons

**Dates:** August 31–September 6

| Day | Travis — technical deliverable | Mr. Miracle — experience deliverable | Expected end-of-day result |
| --- | --- | --- | --- |
| Monday | Finalize block schemas, schema migrations, publication rules, importer mappings, R2 rules, progression contract, and CSP model. | Finalize editor, lesson renderer, navigation, lab, and manual-review interaction designs. | Approved content contract, source mapping, and UI flow map. |
| Tuesday | Implement validated documents, reusable snapshots, immutable publication, authorized assets, and R2 adapters. | Build page editor, validation feedback, preview, asset UI, and initial block renderers. | Content authoring vertical slice with validation/security tests. |
| Wednesday | Implement deterministic importer, execute all 48 folders, and publish structured diagnostics. | Complete block renderers and build curriculum manual-review workflow. | Forty-eight draft imports, diagnostics, and lessons 1–12 reviewed. |
| Thursday | Implement prerequisites, progress, cohort release enforcement, scheduled publication, iframe messaging validation, and sandbox controls. | Build lesson/module navigation, locked states, progress UI, and sandboxed lab experience. | Secure lesson-delivery vertical slice in preview. |
| Friday | Prove publication immutability, review frontend security, and lead publish/learn acceptance. | Review API usability, fix renderer defects, and complete learner/staff browser tests. | Publishable full-track candidate, sequential progression evidence, and Week 3 gate. |

**Weekly deliverable:** All 48 lessons imported as drafts, lessons 1–12 manually reviewed, safe publication and rendering, and authoritative sequential progress.

## Week 4 — Assessments, submissions, and reviews

**Dates:** September 7–13

| Day | Travis — technical deliverable | Mr. Miracle — experience deliverable | Expected end-of-day result |
| --- | --- | --- | --- |
| Monday | Finalize assessment/review OpenAPI, scoring, cooldown, versioning, reviewer scope, state transitions, and eligibility inputs. | Map quiz, submission, history, feedback, rubric, and reviewer states. | Approved assessment contract, fixtures, and UI map. |
| Tuesday | Implement versioned quizzes/questions, randomized delivery, server grading, attempts, explanations, and cooldown enforcement. | Build quiz-taking, results, explanations, retry, cooldown, and accessibility states. | Quiz vertical slice with scoring boundary tests. |
| Wednesday | Implement assignments, URL/file validation, authorized R2 uploads, immutable submission versions, and status history. | Build submission, upload, resubmission, history, and feedback interfaces. | Submission vertical slice with history/security tests. |
| Thursday | Implement concurrency-safe reviewer assignments, rubric versions, decisions, audit, notifications, and eligibility reevaluation. | Build review queue, assignment, rubric scoring, feedback, decisions, and status timelines. | Review vertical slice with authorization/concurrency evidence. |
| Friday | Run negative authorization and domain tests, review UI integration, and approve assessment changes. | Review API usability and run learner/reviewer browser acceptance. | Passing quiz, cooldown, submission, review, and eligibility report; lessons 13–24 reviewed. |

**Weekly deliverable:** Versioned quizzes, preserved submission history, scoped human review, certificate inputs, and lessons 13–24 manually reviewed.

## Week 5 — Cohorts and notifications

**Dates:** September 14–20

| Day | Travis — technical deliverable | Mr. Miracle — experience deliverable | Expected end-of-day result |
| --- | --- | --- | --- |
| Monday | Finalize cohort/notification OpenAPI, timezone rules, scopes, token model, consent, event catalogue, job semantics, and provider templates. | Map learner/staff cohort, attendance, scheduling, consent, notification, and failure experiences. | Approved contracts, timezone fixtures, provider readiness, and UI map. |
| Tuesday | Implement cohort lifecycle, capacity, memberships, releases, deadlines, overrides, extensions, and live-session APIs. | Build cohort overview, schedule, releases, deadlines, announcements, and staff management interfaces. | Cohort scheduling vertical slice with scoped tests. |
| Wednesday | Implement short-lived check-in tokens, attendance state machine, audited corrections, and transactional CSV import/export. | Build check-in, attendance history, correction, and CSV validation interfaces. | Attendance vertical slice with expiry/replay/CSV evidence. |
| Thursday | Implement domain events, Trigger.dev jobs, in-app records, Resend, consented Meta delivery, idempotency, retries, and failure APIs. | Build notification center, preferences, delivery states, and admin failure/retry views. | Three-channel notification vertical slice with duplicate-job tests. |
| Friday | Run timezone/provider/security tests, review UI integration, and approve cohort changes. | Review API usability and run cohort/attendance/notification browser acceptance. | Passing managed-cohort report, ownership-independence evidence, and lessons 25–36 reviewed. |

**Weekly deliverable:** Secure managed cohorts, scheduling, attendance, durable three-channel notifications, and lessons 25–36 manually reviewed.

## Week 6 — Certificates, hardening, and beta

**Dates:** September 21–27

| Day | Travis — technical deliverable | Mr. Miracle — experience deliverable | Expected end-of-day result |
| --- | --- | --- | --- |
| Monday | Implement versioned eligibility evaluation, idempotent approval records, scoped approval, audit, and certificate OpenAPI. | Build pending eligibility and staff approval queue interfaces. | Eligibility/approval vertical slice with authorization tests. |
| Tuesday | Implement opaque tokens, PDF/QR generation, R2 storage, privacy-filtered verification, revocation, and reissue. | Build certificate display/download, public verification, revoked, reissued, and privacy states. | Complete certificate lifecycle in preview. |
| Wednesday | Complete webhook/job/delivery/audit/security APIs and operational runbooks. Review certificate wording and privacy. | Complete operational failure, replay/retry, certificate administration, and learner lifecycle views. | Operator workflows and certificate privacy evidence. |
| Thursday | Execute RBAC matrix, restore, R2 lifecycle, secret rotation, Docker/VPS, webhook replay, job retry, and clean deployment tests. | Execute accessibility, keyboard, reduced-motion, responsive, and browser tests across both apps. | Security/recovery evidence and accessibility report. |
| Friday | Run full beta checklist, review frontend release, verify all 48 lessons, and make final ship/delay decision. | Review API behavior, run complete learner/staff browser regression, and resolve experience blockers. | Signed beta decision, clean deployments, and lessons 37–48 reviewed. |

**Weekly deliverable:** Secure certificate lifecycle, executed operational recovery, complete accessibility/security evidence, all 48 lessons reviewed, and explicit beta approval or delay.

## Week 7 — Contingency only

**Dates:** September 28–October 4

| Day | Travis — technical deliverable | Mr. Miracle — experience deliverable | Expected end-of-day result |
| --- | --- | --- | --- |
| Monday | Freeze remediation scope and reproduce backend, security, provider, data, and deployment blockers. | Reproduce frontend, integration, browser, and accessibility blockers. | Prioritized release-blocker list with owners and failing evidence. |
| Tuesday | Fix highest-risk technical blockers and add regression tests. | Fix highest-risk experience blockers and add integration/browser tests. | Focused reviewed remediation PRs. |
| Wednesday | Continue approved fixes only and review all integration changes. | Continue approved fixes only and review API behavior from the client. | Accepted fixes ready with no new scope. |
| Thursday | Repeat recovery, security, provider, payment, job, webhook, and deployment tests. | Repeat accessibility, browser, learner, and staff regression tests. | Complete repeated gate evidence and rollback proof. |
| Friday | Lead final gate and record explicit ship-or-delay decision. | Confirm experience readiness and document any remaining blocker. | Approved beta or documented delay; no bypassed gate. |

**Weekly deliverable:** Mandatory gates pass with reproducible evidence or the release is delayed.

## Pull-request responsibility matrix

| Change | Implementer | Reviewer | Approver |
| --- | --- | --- | --- |
| Architecture and ADR | Travis | Mr. Miracle | Travis |
| OpenAPI, API docs content, and generated client | Travis | Mr. Miracle | Travis |
| Prisma schema, migration, and seed | Travis | Mr. Miracle | Travis |
| Backend domain/API/security/provider work | Travis | Mr. Miracle | Travis |
| Learner frontend and client integration | Mr. Miracle | Travis | Travis when protected behavior is affected |
| Staff administration UI | Mr. Miracle | Travis | Travis when permissions or operations are affected |
| Design tokens and component modernization | Mr. Miracle | Travis | Travis |
| Infrastructure, CI, Docker, deployment, and runbooks | Travis | Mr. Miracle | Travis |
| End-to-end acceptance | Both | Both | Travis |

## End-of-day report

Each person posts:

```text
Completed:
- Issue/PR and verifiable result

Tests:
- Commands or preview scenario completed

Reviewed:
- Other person’s PR or decision reviewed

Blocked:
- Blocker, owner, and required action

Tomorrow:
- First task and expected end-of-day result
```

Friday additionally records the gate result, evidence links, displaced work, new risks, and Travis’s decision where required.

## Assignment don’ts

- Don’t let frontend code access Prisma, provider secrets, or authoritative business state directly.
- Don’t let UI permission checks replace backend authorization.
- Don’t let Mr. Miracle handwrite types that duplicate or contradict OpenAPI.
- Don’t let Travis merge technically correct APIs without consumer review.
- Don’t begin dependent UI work without an approved contract or fixture.
- Don’t work on the same branch or approve your own PR.
- Don’t hide blockers until Friday.
- Don’t merge protected-domain changes without Travis’s explicit approval.
- Don’t expand Week 7 into a feature sprint.

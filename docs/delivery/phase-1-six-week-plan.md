# Phase 1 Six-Week Delivery Plan

**Schedule:** August 17–September 27, 2026  
**Contingency window:** September 28–October 4, 2026  
**Timezone:** Africa/Lagos  
**Target:** External beta readiness

## Purpose

Deliver the complete Phase 1 LMS within six working weeks, with a seventh week reserved exclusively for contingency, remediation, and final beta approval.

Daily named ownership is maintained in the [Travis and Mr. Miracle task-assignment matrix](task-assignments-travis-miracle.md).

The learner frontend and backend/admin applications are developed in parallel by two collaborators. Every feature has one primary implementer and one required cross-reviewer. The product owner provides final approval for architecture, schema, authentication, OpenAPI, payments, RBAC, and certificate changes.

## Delivery principles

- Keep no more than two major features in progress per person.
- Use short-lived branches and pull requests; never share a working branch.
- Start each feature with acceptance criteria and any required ADR or OpenAPI change.
- Merge in this order: backend domain and OpenAPI, generated client, frontend integration, joint end-to-end review, then feature activation.
- Treat registered component libraries as reference sources. Imported components become locally owned code and require accessibility and design-system review.
- Do not defer incomplete planned features into Week 7. Week 7 is for contingency only.
- Keep cross-system documentation and the OpenAPI source authoritative in this repository.

## API documentation in the learner application

The existing learner-frontend documentation area may render the API reference for development and preview environments.

- `docs/openapi/lms-v1.yaml` remains the only authoritative API source.
- The frontend documentation must consume a generated artifact or validated contract output; it must not maintain a duplicate handwritten API specification.
- The API documentation route should be `/docs/api`.
- `/docs/api` must return `404` in production unless an explicit internal-documentation flag is enabled.
- CI must detect stale generated API documentation or client types.
- Secrets, provider credentials, internal operational notes, and private staff-only endpoints must never be exposed in the learner documentation bundle.

## Weekly delivery schedule

Detailed execution guides:

- [Week 1: Foundation, contract, and design system](week-01-foundation-contract-design-system.md)
- [Week 2: Catalogue, commerce, and learner access](week-02-catalogue-commerce-access.md)
- [Week 3: Content, curriculum import, and lessons](week-03-content-import-lessons.md)
- [Week 4: Assessments, submissions, and reviews](week-04-assessments-submissions-reviews.md)
- [Week 5: Cohorts and notifications](week-05-cohorts-notifications.md)
- [Week 6: Certificates, hardening, and beta](week-06-certificates-hardening-beta.md)
- [Week 7: Contingency and remediation](week-07-contingency.md)

### Week 1 — Foundation, contract, and design system

**Dates:** August 17–23

**Backend/API lead**

- Create and validate the initial Neon migration.
- Seed the fixed permission catalogue and protected Owner role.
- Stabilize Auth.js, password authentication, sessions, origin validation, and RBAC.
- Generate, version, and package the OpenAPI TypeScript client.
- Establish CI checks for TypeScript, Prisma, OpenAPI, tests, and production builds.
- Smoke-test access to Neon, R2, Paystack, Resend, Meta, Trigger.dev, and Vercel.

**Frontend lead**

- Replace temporary handwritten API types with the generated client package.
- Verify shared-domain session behavior in server and client components.
- Add the non-production `/docs/api` route generated from the backend OpenAPI contract.
- Inventory existing components and remove obsolete starter-specific UI.
- Establish shared design tokens and upgrade core buttons, inputs, forms, dialogs, navigation, tables, loading states, and error states.

**Joint acceptance goal**

- Both applications build, test, and deploy independently.
- Authentication works between the learner and backend origins.
- The first database migration and permission seed pass in a clean environment.
- The frontend consumes an exact generated-client version.
- API documentation is available outside production and absent from the public production build.

### Week 2 — Catalogue, commerce, and learner access

**Dates:** August 24–30

**Backend/API lead**

- Complete published track catalogue endpoints.
- Implement self-paced and managed-cohort offerings.
- Enforce immutable NGN price records and keep USD disabled.
- Complete Paystack initialization, verification, webhook persistence, reconciliation, refunds, and confirmed chargeback handling.
- Enforce idempotency, cohort capacity checks, and payment-derived entitlement rules.
- Expose the learner dashboard entitlement data.

**Frontend lead**

- Build the track catalogue and offering comparison views.
- Replace starter pricing with NGN offering data.
- Implement checkout initiation, redirect, return, pending, success, and failure states.
- Build the entitlement-driven learner dashboard and payment history states.
- Upgrade pricing cards, dashboard cards, transaction tables, and commerce feedback components.

**Joint acceptance goal**

- A learner can purchase either offering in NGN and receive the correct permanent track entitlement.
- Duplicate and out-of-order webhooks do not duplicate access.
- Full refunds and confirmed chargebacks revoke payment-derived access without deleting progress.
- Manual grants remain independent and require a reason.

### Week 3 — Content, curriculum import, and lesson delivery

**Dates:** August 31–September 6

**Backend/API lead**

- Complete page-builder document validation and schema-version migration support.
- Implement draft, preview, scheduled, published, and archived workflows.
- Enforce immutable published lesson versions and reusable-block snapshots.
- Implement R2 asset upload and retrieval flows.
- Build the curriculum importer for all 48 source folders.
- Implement sequential lesson availability and authoritative progress records.

**Frontend lead**

- Build staff page-builder and publication screens.
- Build the learner lesson renderer for all Phase 1 block types.
- Add module and lesson navigation, progress feedback, and locked states.
- Integrate sandboxed browser labs using restrictive iframe and CSP rules.
- Upgrade editor blocks, uploads, tabs, accordions, code views, and lesson navigation components.

**Joint acceptance goal**

- All 48 curriculum folders import as validated draft lessons.
- Imported lessons are manually reviewable before publication.
- One complete track can be published and consumed sequentially.
- Lab `localStorage` does not create authoritative LMS progress.

### Week 4 — Assessments, submissions, and reviews

**Dates:** September 7–13

**Backend/API lead**

- Implement versioned quizzes, questions, answer recording, randomization, scoring, and explanations.
- Implement unlimited retakes with configurable failure thresholds and cooldowns.
- Preserve every attempt against its quiz version.
- Implement assignments, versioned rubrics, submission versions, assets, reviewer assignment, feedback, and status history.
- Add the certificate-eligibility evaluation foundation.

**Frontend lead**

- Build the quiz-taking and result experience.
- Display cooldown, mastery, retry, and explanation states.
- Build submission forms for GitHub URLs, deployment URLs, notes, and optional files.
- Build resubmission history and learner feedback screens.
- Build staff pending-review queues, assignment controls, rubric scoring, and decisions.
- Upgrade assessment, rubric, submission-history, and review-queue components.

**Joint acceptance goal**

- Sequential mastery, quiz versioning, retries, and cooldowns work end to end.
- Learners can submit and resubmit projects without losing history.
- Reviewers can be assigned and can approve, request changes, or reject using a versioned rubric.

### Week 5 — Managed cohorts and notifications

**Dates:** September 14–20

**Backend/API lead**

- Implement cohorts, membership, capacity, dates, timezones, and lifecycle states.
- Implement lesson releases, deadlines, pacing overrides, and extensions.
- Implement live-session records and short-lived learner check-in tokens.
- Implement facilitator attendance, corrections, and CSV import/export.
- Implement in-app notifications and durable Trigger.dev jobs.
- Integrate Resend email and consent-aware Meta WhatsApp templates.

**Frontend lead**

- Build learner cohort overview, schedule, deadlines, announcements, and live-session views.
- Build learner check-in and attendance-history experiences.
- Build staff cohort management, release scheduling, attendance, correction, extension, and import/export screens.
- Build the in-app notification center and channel-preference controls.
- Upgrade calendars, scheduling forms, attendance tables, announcements, and notification components.

**Joint acceptance goal**

- Self-paced ownership and managed-cohort membership operate independently.
- Release schedules, deadlines, overrides, check-in, attendance, and corrections are audited.
- In-app, email, and consented WhatsApp reminders are delivered idempotently with visible failure states.

### Week 6 — Certificates, hardening, and beta acceptance

**Dates:** September 21–27

**Backend/API lead**

- Complete data-driven certificate eligibility evaluation.
- Implement approval, PDF and QR generation, R2 storage, public verification, revocation, and reissue.
- Complete audit, webhook, notification, job, and security-event administration screens.
- Test webhook replay, job retry, secret rotation, database restore, R2 lifecycle, and Docker/VPS startup.
- Complete security and authorization test coverage.

**Frontend lead**

- Build pending, approved, revoked, and reissued certificate states.
- Build certificate display, download, and public verification pages.
- Ensure public verification exposes only approved fields and consented portfolio links.
- Complete responsive behavior, keyboard navigation, accessibility, and browser compatibility.
- Upgrade certificate, verification, operational-status, and remaining shared components.

**Joint acceptance goal**

- Every Phase 1 beta-acceptance item passes.
- Both applications deploy independently from clean environments.
- All 48 lessons have completed manual content review.
- The product owner and reviewer complete final cross-repository review.
- The product owner provides explicit external-beta sign-off.

### Week 7 — Contingency only

**Dates:** September 28–October 4

- Fix defects found during the Week 6 acceptance run.
- Complete security, accessibility, browser, recovery, and operational remediation.
- Repeat failed provider and recovery tests.
- Do not introduce new product scope or optional features.
- If the beta gate still fails, delay beta rather than bypassing an acceptance requirement.

## Component modernization plan

Component modernization runs alongside product delivery instead of becoming a separate redesign project.

| Week | Component focus |
| --- | --- |
| 1 | Tokens, typography, buttons, inputs, forms, dialogs, navigation, tables, loading, and errors |
| 2 | Pricing cards, checkout states, dashboard cards, and transaction tables |
| 3 | Editor blocks, lesson renderer, uploads, tabs, accordions, code views, and labs |
| 4 | Quizzes, rubrics, submission history, review queues, and status timelines |
| 5 | Calendars, attendance, scheduling forms, announcements, and notifications |
| 6 | Certificates, verification, accessibility, responsive behavior, and final consistency |

### Registry usage rules

- `@animate-ui` is the preferred source for purposeful feedback, state transitions, and interaction motion.
- Animation must explain state change or improve feedback; avoid decorative motion that harms performance or accessibility.
- Review every imported registry component for licensing, dependencies, server/client boundaries, accessibility, responsiveness, and design-token compatibility.
- Copying a registry component makes it project-owned code; remove unused variants and dependencies.
- Do not allow registry components to introduce database calls, authentication logic, remote executable code, or unreviewed third-party scripts.

## Weekly collaboration rhythm

### Monday — Contract and ownership

- Confirm the week's acceptance criteria.
- Assign one primary implementer and one reviewer to each issue.
- Approve required ADR, schema, and OpenAPI work before dependent implementation.
- Confirm provider credentials, test data, and feature flags.

### Tuesday and Wednesday — Parallel implementation

- Backend work establishes domain rules and contract changes.
- Frontend work proceeds against approved mocks or the released client contract.
- Keep pull requests small and request early cross-review for risky changes.

### Thursday — Integration and cross-review

- Release or validate the generated API client.
- Integrate frontend and backend behavior.
- Run authorization, idempotency, accessibility, and failure-path reviews.

### Friday — Acceptance and merge

- Demonstrate the complete weekly workflow.
- Run end-to-end acceptance checks.
- Merge in dependency order.
- Record decisions, blockers, carryover, and the following week's risks.

## Definition of done

A feature is complete only when:

- Acceptance criteria and required ADRs are approved.
- Backend rules, authorization, validation, and audit behavior are implemented.
- OpenAPI is updated and compatible.
- Generated client types are current and pinned by the frontend.
- Frontend success, loading, empty, validation, authorization, and provider-failure states are implemented.
- Automated tests and both production builds pass.
- The non-implementing collaborator completes cross-review.
- End-to-end behavior passes in a deployed preview environment.
- Documentation and operational notes are updated.
- The feature flag is activated only after joint approval.

## Schedule control

- Review scope and critical-path risk every Friday.
- Carryover work displaces lower-priority work in the following week; it does not silently accumulate.
- Provider approval delays, especially WhatsApp templates and payment capabilities, must be raised during Week 1.
- Beta remains blocked if any security, payment, entitlement, progression, certificate, recovery, or cross-repository acceptance requirement fails.

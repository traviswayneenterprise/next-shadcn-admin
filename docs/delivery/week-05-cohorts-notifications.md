# Week 5 Focus: Cohorts and Notifications

**Dates:** September 14–20, 2026  
**Primary outcome:** Managed cohorts operate independently from permanent track ownership.

## Objective

Deliver cohort membership, schedules, releases, deadlines, extensions, live sessions, secure check-in, attendance, announcements, durable jobs, and in-app, email, and consented WhatsApp notifications.

## Goal

By Friday, facilitators can manage a cohort and its attendance while learners receive the correct schedule and reminders without losing self-paced access when cohort membership changes.

## Assigned weekly deliverables

### Travis — technical deliverables

- Cohort, membership, capacity, release, deadline, override, extension, session, attendance, and announcement APIs.
- UTC/IANA-timezone scheduling rules and scoped facilitator authorization.
- Short-lived check-in tokens, attendance state machine, audited corrections, and transactional CSV processing.
- Domain events, Trigger.dev jobs, in-app records, Resend delivery, and consented Meta template delivery.
- Idempotency, retry policy, provider failure records, and operational APIs.

### Mr. Miracle — experience deliverables

- Learner cohort overview, schedule, releases, deadlines, announcements, and live-session views.
- Staff cohort, membership, scheduling, pacing, deadline, and extension screens.
- Learner check-in, attendance history, staff corrections, and CSV validation experiences.
- Notification center, preferences, channel states, and staff failure/retry screens.
- Manual review and correction records for lessons 25–36.

### Shared end-of-week deliverable

Managed cohorts, attendance, and all notification channels pass acceptance without coupling cohort membership to permanent ownership, and lessons 25–36 are reviewed.

## Procedures

### Monday — Cohort rules and provider readiness

1. Approve cohort, membership, release, deadline, attendance, announcement, and notification contracts.
2. Define timezone conversion rules and canonical UTC storage.
3. Define capacity, membership, facilitator scope, and lifecycle transitions.
4. Confirm WhatsApp consent language and approved-template status.
5. Prepare fixtures covering multiple timezones and daylight changes.

### Tuesday — Cohort structure and scheduling

1. Implement cohort lifecycle, capacity, facilitator, and learner membership.
2. Implement lesson releases, assignment deadlines, pacing overrides, and extensions.
3. Implement external live-session links.
4. Build learner cohort overview, schedule, releases, deadlines, and announcements.
5. Build staff cohort and scheduling forms.

### Wednesday — Check-in and attendance

1. Generate short-lived, scoped, single-purpose check-in tokens.
2. Validate token expiry, cohort, session, and learner identity server-side.
3. Implement present, late, absent, and excused states.
4. Preserve facilitator corrections with actor, reason, before, and after values.
5. Implement validated CSV import and safe export.

### Thursday — Notifications and jobs

1. Create in-app notifications from authoritative domain events.
2. Schedule reminders through durable Trigger.dev jobs.
3. Implement Resend delivery and Meta approved-template delivery.
4. Enforce WhatsApp consent and optional channel preferences.
5. Store idempotency key, attempts, provider ID, status, and failure reason.
6. Build learner notification center and admin failure/retry views.

### Friday — Managed-cohort acceptance

1. Test a learner with self-paced access but no cohort.
2. Add and remove cohort membership without changing permanent ownership.
3. Test releases, overrides, extensions, check-in, corrections, and CSV errors.
4. Send all three notification channels and replay the same job.
5. Review failure visibility, audit records, and timezone display together.

## Best coding practices

- Store instants in UTC and retain the cohort’s IANA timezone for display and scheduling.
- Authorize every cohort action against role and cohort scope.
- Use short-lived opaque tokens and one-time or replay-safe semantics.
- Parse CSV into a validation report before applying changes transactionally.
- Drive notifications from domain events, not UI side effects.
- Make every job and delivery idempotent and retry-safe.
- Separate required transactional messages from optional preference-controlled messages.
- Display times with explicit timezone context.

## Don’ts

- Don’t make track ownership depend on active cohort membership.
- Don’t store local display times without timezone information.
- Don’t trust learner IDs, attendance states, or cohort IDs from QR/check-in input.
- Don’t overwrite attendance corrections without history and reason.
- Don’t send WhatsApp messages without recorded consent and an approved template.
- Don’t retry permanent provider failures indefinitely.
- Don’t send notifications directly inside database transactions.
- Don’t import partially valid CSV rows without an explicit reviewed mode.

## Required evidence

- Cross-timezone release and deadline tests.
- Capacity and scoped-facilitator authorization tests.
- Expired, replayed, and cross-cohort check-in tests.
- Attendance correction and CSV validation records.
- In-app, email, and WhatsApp delivery records with retry evidence.
- Proof that cohort removal does not revoke permanent track access.

## Exit gate

Week 5 is complete only when cohort scheduling, attendance, and all three notification channels pass acceptance tests and remain independent from permanent entitlements.

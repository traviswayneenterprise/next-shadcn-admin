# Week 2 Focus: Catalogue, Commerce, and Learner Access

**Dates:** August 24–30, 2026  
**Primary outcome:** A verified NGN purchase grants the correct permanent track access.

## Objective

Deliver the first complete business vertical: published catalogue, self-paced and managed-cohort offerings, immutable prices, Paystack checkout and verification, entitlement grants and revocation, and the learner dashboard.

## Goal

By Friday, a learner can discover an offering, pay in NGN, survive duplicate or out-of-order webhooks, receive exactly one entitlement, and see the access in the dashboard.

## Actual delivery status (solo, recorded 2026-09-12)

The two-person day-by-day split below no longer applies; work proceeded
solo. Monday through Wednesday's scope is complete and verified against a
real Neon database and a real Paystack test key, not just built:

- **Monday (contract):** `docs/openapi/lms-v1.yaml` defines `CheckoutInput`,
  `CheckoutSession`, and `PaymentStatusDetail`; `PaymentStatus` covers
  PENDING/SUCCEEDED/FAILED/CANCELLED/REFUNDED/DISPUTED/CHARGEBACK; idempotency
  is a database constraint (`Payment.idempotencyKey`, `providerReference`
  both unique), not just a convention.
- **Tuesday (catalogue/checkout):** published-track/offering endpoints,
  immutable NGN prices, cohort capacity checks, pending-payment persistence,
  and Paystack transaction initialization are implemented and covered by the
  learner-frontend pricing/checkout UI.
- **Wednesday (webhook/entitlement):** signed webhook persistence, direct
  Paystack re-verification (never trusting the webhook payload alone),
  transactional entitlement grants, and replay protection (dedup by
  `PaymentEvent.providerEventId`) are implemented; `GET
  /checkout-sessions/{paymentId}` additionally reconciles directly with
  Paystack when a payment is still PENDING, covering delayed/lost webhooks.
  The learner-frontend redirect-return page polls this endpoint through
  pending/success/failed/cancelled/reversed states.

- **Thursday (reversal/dashboard):** `POST /payments/{paymentId}/refund`
  (calls Paystack's real refund API), webhook handling for
  `charge.dispute.create` (-> DISPUTED) distinct from a confirmed chargeback
  (`charge.dispute.resolve` -> CHARGEBACK, entitlement revoked), an
  independent manual-grant endpoint (`POST /entitlements/manual-grant`,
  staff-only, requires a reason, resolves the recipient by email), a payment
  history endpoint (`GET /payments`, own history or any user's with
  `payments.read`), an audit-event endpoint, and a staff `/commerce`
  dashboard page (payment table with inline refund, manual-grant form, audit
  log) in the admin app. The learner-frontend billing page now shows real
  payment history and an access-active/access-revoked banner.
- **Friday (financial acceptance):** verified with
  `pnpm test:financial-acceptance`
  (`scripts/friday-financial-acceptance.mjs`) against the real dev database
  and a real Paystack test-mode checkout-session initialization:
  - Capacity failure: checkout against an already-full cohort is rejected
    (409).
  - Duplicate webhook delivery (same Paystack event id) is deduped at the
    `PaymentEvent` layer; the second delivery is a no-op.
  - Out-of-order delivery, both directions:
    - A chargeback event arriving before a payment has ever reached
      SUCCEEDED is dropped rather than corrupting state (payment stays
      PENDING).
    - A stale/replayed `charge.success` arriving **after** a confirmed
      chargeback does not re-grant access. This was a real bug caught by
      this exact check and fixed the same day: the webhook handler now only
      acts on `charge.success` while the payment is still PENDING, and only
      acts on dispute/refund events while the payment is SUCCEEDED (or
      already DISPUTED, for the resolve step) - see
      `src/app/api/v1/payments/paystack/webhook/route.ts`.
  - Refund and manual-grant permission/state guards: forbidden without the
    right permission, rejected for a payment that isn't SUCCEEDED.
  - Manual grants are independent of payments: revoking a payment-derived
    entitlement via chargeback never touches a manual grant for the same
    user/track.
  - Every dispute, chargeback, and manual-grant action produced a matching
    `AuditEvent` with a correlation id.
  - A second real bug found and fixed the same day: the interactive
    transaction timeout (Prisma's 5s default) was too tight against Neon's
    real round-trip latency in this environment and intermittently failed
    real requests (`P2028`); all commerce `$transaction` calls now share a
    15s/20s `TRANSACTION_OPTIONS` (`src/lib/db.ts`), matching the fix
    already applied to `prisma/seed.ts`.
  - Not automated - requires a human in a browser: a full
    `charge.success` completed against Paystack's hosted checkout with a
    test card, and a refund issued against that real transaction. The
    script's header documents this limitation and how to extend the run to
    a real payment via `FRIDAY_REAL_PAYMENT_ID` once one exists.

Week 2's backend and admin-UI scope (Monday through Friday) is complete and
verified against real infrastructure with the one noted exception (full
browser-driven Paystack checkout), which needs a human, not an agent.

## Assigned weekly deliverables

### Travis — technical deliverables

- Catalogue, offering, price, checkout, payment, entitlement, reversal, and history API contracts.
- Explicit payment state machine, immutable financial records, and database-backed idempotency constraints.
- Paystack initialization, signed webhook persistence, direct verification, reconciliation, refund, and confirmed-chargeback handling.
- Transactional payment-derived entitlements and independent audited manual grants.
- Automated security, duplicate, out-of-order, capacity, amount, and currency tests.

### Mr. Miracle — experience deliverables

- Catalogue, offering comparison, and NGN pricing experiences.
- Checkout start, redirect return, pending, success, failure, cancelled, delayed, and retry states.
- Entitlement-driven dashboard, payment history, access-revoked, and manual-grant views.
- Staff commerce and entitlement screens using permission-aware actions.
- Browser and generated-client integration tests for the purchase journey.

### Shared end-of-week deliverable

A verified NGN purchase grants exactly one correct entitlement, reversals preserve history, and learner/staff interfaces reflect authoritative backend state.

## Procedures

### Monday — Contract and financial invariants

1. Approve catalogue, offering, price, checkout, payment, and entitlement acceptance criteria.
2. Review OpenAPI changes before UI implementation.
3. Define payment state transitions and allowed transitions.
4. Define idempotency scope and cohort-capacity reservation behavior.
5. Prepare Paystack test customers and deterministic test references.

### Tuesday — Catalogue and checkout

1. Implement published-track queries with archival filtering.
2. Implement enabled offerings and immutable integer-subunit NGN prices.
3. Validate learner, offering, price, cohort capacity, and idempotency before Paystack initialization.
4. Persist the pending payment before redirecting.
5. Build catalogue, offering comparison, and checkout-start UI.

### Wednesday — Webhooks and entitlements

1. Persist raw signed webhook deliveries before processing.
2. Verify webhook signatures and then verify transactions directly with Paystack.
3. Confirm reference, amount, currency, and final status.
4. Grant payment-derived entitlements transactionally and idempotently.
5. Implement duplicate, delayed, and out-of-order event tests.

### Thursday — Reversal and dashboard states

1. Implement full-refund and confirmed-chargeback revocation without deleting progress.
2. Keep manual grants independent and require a reason and actor.
3. Build checkout pending, success, failed, cancelled, and reconciliation states.
4. Build entitlement-driven dashboard and payment history views.
5. Upgrade commerce cards, status feedback, tables, and empty states.

### Friday — Financial acceptance

1. Run live-like Paystack test transactions in preview.
2. Replay the same webhook and confirm no duplicate entitlement.
3. Deliver an event out of order and confirm correct final state.
4. Test refund, chargeback, manual grant, and capacity failure.
5. Review audit records and correlation IDs together.

## Best coding practices

- Store money as integers in currency subunits; never use floating point.
- Treat prices and financial events as immutable history.
- Use unique provider references and database-backed idempotency constraints.
- Perform entitlement creation and payment finalization in one transaction.
- Model state transitions explicitly and reject illegal transitions.
- Verify provider data independently; never trust redirect query parameters.
- Make payment UI resilient to delayed webhooks and refreshes.
- Mask sensitive provider payload fields in logs and admin views.

## Don’ts

- Don’t grant access from the browser redirect alone.
- Don’t trust an unsigned webhook or unverified amount/currency.
- Don’t reuse Paystack references.
- Don’t overwrite historical prices or payment events.
- Don’t revoke manual grants because a payment was refunded.
- Don’t enable USD before Paystack international collection is operational.
- Don’t display success before authoritative verification completes.
- Don’t log secrets, authorization tokens, or complete sensitive payloads.

## Required evidence

- OpenAPI compatibility check and released client version.
- Successful NGN checkout recording.
- Duplicate and out-of-order webhook test output.
- Refund, chargeback, and manual-grant audit records.
- Screenshots of all learner checkout and entitlement states.

## Exit gate

Week 2 is complete only when both offering types can be purchased safely, entitlement rules pass automated and preview tests, and the learner dashboard reflects authoritative backend access.

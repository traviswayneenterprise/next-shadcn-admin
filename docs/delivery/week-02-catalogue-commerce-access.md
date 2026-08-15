# Week 2 Focus: Catalogue, Commerce, and Learner Access

**Dates:** August 24–30, 2026  
**Primary outcome:** A verified NGN purchase grants the correct permanent track access.

## Objective

Deliver the first complete business vertical: published catalogue, self-paced and managed-cohort offerings, immutable prices, Paystack checkout and verification, entitlement grants and revocation, and the learner dashboard.

## Goal

By Friday, a learner can discover an offering, pay in NGN, survive duplicate or out-of-order webhooks, receive exactly one entitlement, and see the access in the dashboard.

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

// Week 2 Friday financial-acceptance checks.
//
// Exercises real code paths against a running dev server and the real Neon
// dev database: capacity enforcement, webhook idempotency/out-of-order
// handling, refund/manual-grant permission and state guards, manual-grant
// independence from payment reversal, and the resulting audit trail.
//
// What this script deliberately does NOT cover: a real completed Paystack
// checkout (charge.success verified against Paystack's live API) and a real
// refund issued through Paystack's refund API - both require an actual
// browser-completed test-mode card payment, which only a human can perform.
// Run that manually first (see docs/delivery/week-02-catalogue-commerce-access.md
// Friday evidence), then this script's duplicate/out-of-order/refund checks
// can optionally be pointed at that real payment via FRIDAY_REAL_PAYMENT_ID.
//
// Usage: node --experimental-strip-types scripts/friday-financial-acceptance.mjs
// Requires: the admin dev server running (ADMIN_BASE_URL, default
// http://localhost:3001) and .env populated with real DIRECT_URL/DATABASE_URL
// and PAYSTACK_SECRET_KEY.

import "dotenv/config";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client.ts";
import { generateCsrfToken } from "../src/lib/auth/csrf.ts";

// Inlined from src/lib/auth/password-session.ts: that file imports via the
// "@/" path alias, which only Next.js's bundler resolves - not plain Node ESM.
function createOpaqueToken() {
  return randomBytes(32).toString("base64url");
}
function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

const BASE = process.env.ADMIN_BASE_URL ?? "http://localhost:3001";
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL }),
});

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"} - ${name}${detail !== undefined ? ": " + JSON.stringify(detail) : ""}`);
}

function sign(rawBody) {
  return createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
}

async function sendWebhook(payload) {
  const rawBody = JSON.stringify(payload);
  return fetch(`${BASE}/api/v1/payments/paystack/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-paystack-signature": sign(rawBody) },
    body: rawBody,
  });
}

const created = { userIds: [], trackIds: [], offeringIds: [], priceIds: [], cohortIds: [], paymentIds: [], auditResourceIds: [], sessionTokenHashes: [] };

async function sessionCookies(userId) {
  const sessionToken = createOpaqueToken();
  const tokenHash = hashToken(sessionToken);
  await prisma.session.create({
    data: { userId, sessionToken: tokenHash, expires: new Date(Date.now() + 3600_000) },
  });
  created.sessionTokenHashes.push(tokenHash);
  const csrfToken = generateCsrfToken();
  return {
    headers: {
      "Content-Type": "application/json",
      Origin: BASE,
      Cookie: `twe.session-token=${sessionToken}; twe.csrf-token=${csrfToken}`,
      "x-csrf-token": csrfToken,
    },
  };
}

const stamp = Date.now();

async function runRealRefund(realPaymentId) {
  // Once a human has completed a real browser checkout against Paystack's
  // test-mode hosted page (charge.success verified for real), point this at
  // that payment id to exercise a genuine refund call against Paystack's
  // live refund API - the one thing the synthetic run below cannot cover.
  const payment = await prisma.payment.findUniqueOrThrow({ where: { id: realPaymentId } });
  if (payment.status !== "SUCCEEDED") {
    record("real payment is SUCCEEDED before refunding", false, { status: payment.status });
    return;
  }
  const owner = await prisma.user.findFirstOrThrow({ where: { email: process.env.OWNER_EMAIL } });
  const staffAuth = await sessionCookies(owner.id);
  const res = await fetch(`${BASE}/api/v1/payments/${payment.id}/refund`, {
    method: "POST", headers: staffAuth.headers, body: JSON.stringify({ reason: "Friday acceptance - real refund" }),
  });
  const body = await res.json();
  record("real Paystack refund initiated for a genuinely completed payment", res.status === 202 && Boolean(body.data?.refundId), { status: res.status, body });
  await prisma.session.deleteMany({ where: { sessionToken: { in: created.sessionTokenHashes } } });
}

async function main() {
  if (process.env.FRIDAY_REAL_PAYMENT_ID) {
    await runRealRefund(process.env.FRIDAY_REAL_PAYMENT_ID);
    return;
  }

  // Paystack's transaction/initialize validates the email format strictly
  // enough to reject "@example.test"; this account's email goes to Paystack
  // (checkout-sessions sends session.user.email), so it needs a real,
  // deliverable-looking domain. Plus-addressing off a real inbox.
  const learner = await prisma.user.create({
    data: { email: `dev.euphilacademy+friday-learner-${stamp}@gmail.com`, name: "Friday Acceptance Learner", emailVerified: new Date(), status: "ACTIVE" },
  });
  created.userIds.push(learner.id);
  const filler = await prisma.user.create({
    data: { email: `friday-filler-${stamp}@example.test`, name: "Friday Filler", emailVerified: new Date(), status: "ACTIVE" },
  });
  created.userIds.push(filler.id);
  const grantRecipient = await prisma.user.create({
    data: { email: `friday-grantee-${stamp}@example.test`, name: "Friday Grantee", emailVerified: new Date(), status: "ACTIVE" },
  });
  created.userIds.push(grantRecipient.id);

  const track = await prisma.track.create({
    data: { slug: `friday-test-${stamp}`, title: "Friday Acceptance Track", description: "temp", status: "PUBLISHED", publishedAt: new Date() },
  });
  created.trackIds.push(track.id);

  const offering = await prisma.offering.create({
    data: { targetType: "TRACK", trackId: track.id, kind: "MANAGED_COHORT", title: "Friday Acceptance Offering", enabled: true },
  });
  created.offeringIds.push(offering.id);

  const price = await prisma.price.create({
    data: { offeringId: offering.id, currency: "NGN", amount: 500000, enabled: true },
  });
  created.priceIds.push(price.id);

  const fullCohort = await prisma.cohort.create({
    data: {
      trackId: track.id, offeringId: offering.id, slug: `friday-full-${stamp}`, name: "Friday Full Cohort",
      timezone: "Africa/Lagos", capacity: 1, status: "OPEN",
      startsAt: new Date(), endsAt: new Date(Date.now() + 30 * 86400_000),
    },
  });
  created.cohortIds.push(fullCohort.id);
  await prisma.cohortMembership.create({
    data: { cohortId: fullCohort.id, userId: filler.id, role: "LEARNER", status: "ACTIVE", joinedAt: new Date() },
  });

  const openCohort = await prisma.cohort.create({
    data: {
      trackId: track.id, offeringId: offering.id, slug: `friday-open-${stamp}`, name: "Friday Open Cohort",
      timezone: "Africa/Lagos", capacity: 5, status: "OPEN",
      startsAt: new Date(), endsAt: new Date(Date.now() + 30 * 86400_000),
    },
  });
  created.cohortIds.push(openCohort.id);

  const learnerAuth = await sessionCookies(learner.id);
  const owner = await prisma.user.findFirstOrThrow({ where: { email: process.env.OWNER_EMAIL } });
  const staffAuth = await sessionCookies(owner.id);

  // 1. Capacity failure - checkout against an already-full cohort is rejected.
  {
    const res = await fetch(`${BASE}/api/v1/checkout-sessions`, {
      method: "POST",
      headers: { ...learnerAuth.headers, "Idempotency-Key": randomBytes(16).toString("hex") },
      body: JSON.stringify({ offeringId: offering.id, priceId: price.id, cohortId: fullCohort.id }),
    });
    const body = await res.json();
    record("capacity failure rejects checkout on a full cohort", res.status === 409 && body.error?.code === "CONFLICT", { status: res.status, body });
  }

  // 2. Create a real pending payment (real Paystack transaction initialize call).
  let paymentId;
  let providerReference;
  {
    const res = await fetch(`${BASE}/api/v1/checkout-sessions`, {
      method: "POST",
      headers: { ...learnerAuth.headers, "Idempotency-Key": randomBytes(16).toString("hex") },
      body: JSON.stringify({ offeringId: offering.id, priceId: price.id, cohortId: openCohort.id }),
    });
    const body = await res.json();
    record("checkout session created against Paystack (real init call)", res.status === 201 && Boolean(body.data?.authorizationUrl), { status: res.status });
    paymentId = body.data?.paymentId;
    if (paymentId) created.paymentIds.push(paymentId);
    const paymentRow = await prisma.payment.findUnique({ where: { id: paymentId } });
    providerReference = paymentRow?.providerReference;
  }

  // 3. Out-of-order: a chargeback event arriving before the payment is ever
  //    SUCCEEDED must not corrupt state (payment stays PENDING, no revoke).
  {
    const res = await sendWebhook({ event: "charge.dispute.resolve", data: { id: `${stamp}-early`, reference: providerReference } });
    const body = await res.json();
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    record(
      "out-of-order chargeback on a still-PENDING payment is ignored, not applied",
      res.ok && body.data?.ignored && payment.status === "PENDING",
      { responseBody: body, paymentStatus: payment.status },
    );
  }

  // From here we simulate the payment having genuinely succeeded (the real
  // charge.success path requires a browser-completed Paystack test payment;
  // see the file header). This still exercises the real dispute/refund
  // handlers, dedup, guards, and audit trail on real data.
  await prisma.payment.update({ where: { id: paymentId }, data: { status: "SUCCEEDED", paidAt: new Date() } });
  // Mirrors domain/commerce/entitlements.ts#grantPaymentEntitlement's shape
  // directly (that module imports via the "@/" alias, unresolvable outside
  // Next's bundler) - this is fixture setup, not what's under test here.
  await prisma.entitlement.create({
    data: { userId: learner.id, trackId: track.id, source: "PAYMENT", paymentId },
  });

  // 4. Duplicate webhook delivery of the same event id is deduped.
  {
    const eventId = `${stamp}-dispute-create`;
    const first = await sendWebhook({ event: "charge.dispute.create", data: { id: eventId, reference: providerReference } });
    const firstBody = await first.json();
    const second = await sendWebhook({ event: "charge.dispute.create", data: { id: eventId, reference: providerReference } });
    const secondBody = await second.json();
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    record(
      "duplicate webhook delivery (same event id) is deduped",
      !firstBody.data?.duplicate && secondBody.data?.duplicate === true && payment.status === "DISPUTED",
      { firstBody, secondBody, paymentStatus: payment.status },
    );
  }

  // 5. Confirmed chargeback revokes the payment-derived entitlement.
  {
    const res = await sendWebhook({ event: "charge.dispute.resolve", data: { id: `${stamp}-resolve`, reference: providerReference } });
    await res.json();
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    const entitlement = await prisma.entitlement.findFirst({ where: { paymentId } });
    record(
      "confirmed chargeback revokes the payment-derived entitlement",
      payment.status === "CHARGEBACK" && entitlement.status === "REVOKED",
      { paymentStatus: payment.status, entitlementStatus: entitlement.status },
    );
  }

  // 6. The critical regression this session's guard fixes: a stale/replayed
  //    charge.success arriving AFTER a confirmed chargeback must not re-grant
  //    access.
  {
    const res = await sendWebhook({ event: "charge.success", data: { id: `${stamp}-stale-success`, reference: providerReference } });
    const body = await res.json();
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    const entitlement = await prisma.entitlement.findFirst({ where: { paymentId } });
    record(
      "a stale charge.success replay after a chargeback does not re-grant access",
      body.data?.ignored && payment.status === "CHARGEBACK" && entitlement.status === "REVOKED",
      { responseBody: body, paymentStatus: payment.status, entitlementStatus: entitlement.status },
    );
  }

  // 7. Refund endpoint guards: wrong permission, and wrong payment state.
  {
    const noPerm = await fetch(`${BASE}/api/v1/payments/${paymentId}/refund`, {
      method: "POST", headers: learnerAuth.headers, body: JSON.stringify({ reason: "test" }),
    });
    record("refund is forbidden without payments.manage", noPerm.status === 403, { status: noPerm.status });

    const wrongState = await fetch(`${BASE}/api/v1/payments/${paymentId}/refund`, {
      method: "POST", headers: staffAuth.headers, body: JSON.stringify({ reason: "already reversed" }),
    });
    const wrongStateBody = await wrongState.json();
    record(
      "refund is rejected for a payment that is not SUCCEEDED (already CHARGEBACK)",
      wrongState.status === 409 && wrongStateBody.error?.code === "CONFLICT",
      { status: wrongState.status, body: wrongStateBody },
    );
  }

  // 8. Manual grant: independent of payments, requires a reason, and its
  //    entitlement is untouched by an unrelated payment's chargeback.
  {
    const res = await fetch(`${BASE}/api/v1/entitlements/manual-grant`, {
      method: "POST", headers: staffAuth.headers,
      body: JSON.stringify({ recipientEmail: grantRecipient.email, trackId: track.id, reason: "Friday acceptance verification" }),
    });
    const body = await res.json();
    record("manual grant succeeds for staff with entitlements.manage", res.status === 201 && Boolean(body.data?.entitlementId), { status: res.status, body });

    const noPerm = await fetch(`${BASE}/api/v1/entitlements/manual-grant`, {
      method: "POST", headers: learnerAuth.headers,
      body: JSON.stringify({ recipientEmail: grantRecipient.email, trackId: track.id, reason: "should be forbidden" }),
    });
    record("manual grant is forbidden without entitlements.manage", noPerm.status === 403, { status: noPerm.status });

    // The already-processed chargeback above (step 5) only ever touched the
    // PAYMENT-sourced entitlement; this manual grant must remain ACTIVE.
    const grantEntitlement = await prisma.entitlement.findFirst({ where: { grantId: { not: null }, userId: grantRecipient.id } });
    if (grantEntitlement) created.auditResourceIds.push(grantEntitlement.id);
    record("manual grant is unaffected by an unrelated payment's chargeback", grantEntitlement?.status === "ACTIVE", { status: grantEntitlement?.status });
  }

  // 9. Audit trail review.
  {
    const events = await prisma.auditEvent.findMany({
      where: { OR: [{ resourceId: paymentId }, { action: "entitlement.manual_grant.created" }] },
      orderBy: { createdAt: "asc" },
    });
    console.log("\nAudit trail for this run:");
    for (const e of events) {
      console.log(`  [${e.correlationId}] ${e.action} on ${e.resourceType}${e.resourceId ? `/${e.resourceId}` : ""} at ${e.createdAt.toISOString()}`);
    }
    record("audit events recorded for dispute/chargeback/manual-grant actions", events.length >= 3, { count: events.length });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    console.log(`\n${results.filter((r) => r.pass).length}/${results.length} checks passed.`);
    await prisma.entitlement.deleteMany({ where: { userId: { in: created.userIds } } });
    await prisma.entitlementGrant.deleteMany({ where: { userId: { in: created.userIds } } });
    await prisma.paymentEvent.deleteMany({ where: { paymentId: { in: created.paymentIds } } });
    await prisma.refund.deleteMany({ where: { paymentId: { in: created.paymentIds } } });
    await prisma.payment.deleteMany({ where: { id: { in: created.paymentIds } } });
    await prisma.cohortMembership.deleteMany({ where: { cohortId: { in: created.cohortIds } } });
    await prisma.auditEvent.deleteMany({ where: { resourceId: { in: [...created.paymentIds, ...created.auditResourceIds] } } });
    await prisma.cohort.deleteMany({ where: { id: { in: created.cohortIds } } });
    await prisma.price.deleteMany({ where: { id: { in: created.priceIds } } });
    await prisma.offering.deleteMany({ where: { id: { in: created.offeringIds } } });
    await prisma.track.deleteMany({ where: { id: { in: created.trackIds } } });
    await prisma.session.deleteMany({ where: { sessionToken: { in: created.sessionTokenHashes } } });
    await prisma.user.deleteMany({ where: { id: { in: created.userIds } } });
    await prisma.$disconnect();
    if (results.some((r) => !r.pass)) process.exitCode = 1;
  });

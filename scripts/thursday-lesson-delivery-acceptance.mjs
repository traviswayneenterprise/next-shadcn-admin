// Week 3 Thursday: lesson-delivery vertical slice verification.
//
// Two parts, both against the real dev server + real Neon dev database:
//
// Part A (throwaway test data, fully cleaned up): verifies the scheduled-
// publication mechanism itself - a version scheduled for the future stays
// SCHEDULED, and becomes PUBLISHED once its scheduledFor time passes.
// Uses disposable test content, not real curriculum, because publication
// is irreversible (immutable published versions) and a "did it publish
// after N seconds" test needs to actually let time pass.
//
// Part B (real, permanent action + throwaway test learner): publishes the
// real lesson-1 and lesson-2 (already reviewed APPROVED on Wednesday) for
// real, then verifies the sequential-unlock and progress flow against them
// with a disposable test learner (the learner and their progress are
// cleaned up; the two lesson publications are not - they're real curriculum
// state, matching Week 3's own goal of having a learnable sequence).
//
// Usage: node --experimental-strip-types scripts/thursday-lesson-delivery-acceptance.mjs

import "dotenv/config";
import { createHash, randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const BASE = process.env.ADMIN_BASE_URL ?? "http://localhost:3001";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL }) });

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"} - ${name}${detail !== undefined ? ": " + JSON.stringify(detail) : ""}`);
}
function hashToken(t) {
  return createHash("sha256").update(t).digest("hex");
}
function generateCsrfToken() {
  return crypto.randomUUID();
}

const created = { userIds: [], trackIds: [], sessionTokenHashes: [] };

async function sessionCookies(userId) {
  const sessionToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(sessionToken);
  await prisma.session.create({ data: { userId, sessionToken: tokenHash, expires: new Date(Date.now() + 3600_000) } });
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

async function partA_scheduledPublication(staffAuth) {
  const track = await prisma.track.create({ data: { slug: `thu-sched-${stamp}`, title: "Thursday Schedule Test", description: "temp", status: "DRAFT" } });
  created.trackIds.push(track.id);
  const course = await prisma.course.create({ data: { trackId: track.id, slug: "c", title: "C", order: 1 } });
  const mod = await prisma.module.create({ data: { courseId: course.id, slug: "m", title: "M", order: 1 } });
  const lesson = await prisma.lesson.create({ data: { moduleId: mod.id, slug: "l", title: "Scheduled Lesson", order: 1 } });
  const document = await prisma.contentDocument.create({ data: { schemaVersion: 1, blocks: [{ id: "b1", version: 1, type: "paragraph", data: { richText: [{ text: "hi" }] } }] } });
  const owner = await prisma.user.findFirstOrThrow({ where: { email: process.env.OWNER_EMAIL } });
  const version = await prisma.lessonVersion.create({ data: { lessonId: lesson.id, version: 1, documentId: document.id, createdById: owner.id } });

  const farFuture = new Date(Date.now() + 3600_000).toISOString();
  const scheduleRes = await fetch(`${BASE}/api/v1/content/lesson-versions/${version.id}/schedule`, {
    method: "POST", headers: staffAuth.headers, body: JSON.stringify({ scheduledFor: farFuture }),
  });
  record("scheduling a far-future publication succeeds", scheduleRes.status === 200, { status: scheduleRes.status });

  const notYetDue = await prisma.lessonVersion.findUnique({ where: { id: version.id } });
  record("a far-future scheduled version is not yet published", notYetDue.status === "SCHEDULED", { status: notYetDue.status });

  // Reschedule for 2s from now, then wait past it and confirm a read triggers publication.
  const soon = new Date(Date.now() + 2000).toISOString();
  await prisma.lessonVersion.update({ where: { id: version.id }, data: { scheduledFor: new Date(soon) } });
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const learnRes = await fetch(`${BASE}/api/v1/learn/lessons/${lesson.id}`, { headers: staffAuth.headers });
  await learnRes.json().catch(() => null);
  const nowDue = await prisma.lessonVersion.findUnique({ where: { id: version.id } });
  const refreshedLesson = await prisma.lesson.findUnique({ where: { id: lesson.id } });
  record(
    "a due scheduled version is published on next access",
    nowDue.status === "PUBLISHED" && refreshedLesson.currentPublishedVersion === 1,
    { versionStatus: nowDue.status, currentPublishedVersion: refreshedLesson.currentPublishedVersion },
  );
}

async function partB_realSequenceAndProgress() {
  const lesson1 = await prisma.lesson.findFirstOrThrow({ where: { slug: "lesson-1" }, include: { versions: { orderBy: { version: "desc" }, take: 1 } } });
  const lesson2 = await prisma.lesson.findFirstOrThrow({ where: { slug: "lesson-2" }, include: { versions: { orderBy: { version: "desc" }, take: 1 } } });

  const owner = await prisma.user.findFirstOrThrow({ where: { email: process.env.OWNER_EMAIL } });
  const staffAuth = await sessionCookies(owner.id);

  if (lesson1.versions[0].status === "DRAFT") {
    const res = await fetch(`${BASE}/api/v1/content/lesson-versions/${lesson1.versions[0].id}/publish`, { method: "POST", headers: staffAuth.headers });
    record("lesson-1 published for real", res.status === 200, { status: res.status });
  } else {
    record("lesson-1 already published", true, { status: lesson1.versions[0].status });
  }
  if (lesson2.versions[0].status === "DRAFT") {
    const res = await fetch(`${BASE}/api/v1/content/lesson-versions/${lesson2.versions[0].id}/publish`, { method: "POST", headers: staffAuth.headers });
    record("lesson-2 published for real", res.status === 200, { status: res.status });
  } else {
    record("lesson-2 already published", true, { status: lesson2.versions[0].status });
  }

  const learner = await prisma.user.create({
    data: { email: `thursday-learner-${stamp}@example.test`, name: "Thursday Learner", emailVerified: new Date(), status: "ACTIVE" },
  });
  created.userIds.push(learner.id);
  const learnerAuth = await sessionCookies(learner.id);

  // No entitlement yet: locked.
  const noAccessRes = await fetch(`${BASE}/api/v1/learn/lessons/${lesson1.id}`, { headers: learnerAuth.headers });
  const noAccessBody = await noAccessRes.json();
  record("lesson access is forbidden without an entitlement", noAccessRes.status === 403 && noAccessBody.error?.details?.reason === "NO_ENTITLEMENT", { status: noAccessRes.status });

  // Grant entitlement via the real manual-grant endpoint (Week 2).
  const track = await prisma.track.findUniqueOrThrow({ where: { slug: "software-dev-2026" } });
  const grantRes = await fetch(`${BASE}/api/v1/entitlements/manual-grant`, {
    method: "POST", headers: staffAuth.headers,
    body: JSON.stringify({ recipientEmail: learner.email, trackId: track.id, reason: "Thursday acceptance verification" }),
  });
  record("manual grant succeeds", grantRes.status === 201, { status: grantRes.status });

  const lesson1Res = await fetch(`${BASE}/api/v1/learn/lessons/${lesson1.id}`, { headers: learnerAuth.headers });
  const lesson1Body = await lesson1Res.json();
  record("lesson-1 is available once entitled (first lesson, no prerequisite)", lesson1Res.status === 200 && lesson1Body.data?.progressStatus === "AVAILABLE" && lesson1Body.data?.blocks?.length > 0, { status: lesson1Res.status });

  const lesson2LockedRes = await fetch(`${BASE}/api/v1/learn/lessons/${lesson2.id}`, { headers: learnerAuth.headers });
  const lesson2LockedBody = await lesson2LockedRes.json();
  record("lesson-2 is locked until lesson-1 is completed", lesson2LockedRes.status === 423 && lesson2LockedBody.error?.details?.reason === "LOCKED_SEQUENCE", { status: lesson2LockedRes.status });

  const trackNavRes = await fetch(`${BASE}/api/v1/learn/tracks/software-dev-2026`, { headers: learnerAuth.headers });
  const trackNavBody = await trackNavRes.json();
  const navLessons = trackNavBody.data?.courses?.[0]?.modules?.[0]?.lessons ?? [];
  record(
    "nav tree shows lesson-1 available and lesson-2 locked",
    navLessons.find((l) => l.slug === "lesson-1")?.status === "AVAILABLE" && navLessons.find((l) => l.slug === "lesson-2")?.status === "LOCKED",
    { statuses: navLessons.slice(0, 2).map((l) => [l.slug, l.status]) },
  );

  const startRes = await fetch(`${BASE}/api/v1/learn/lessons/${lesson1.id}/progress`, { method: "POST", headers: learnerAuth.headers, body: JSON.stringify({ action: "start" }) });
  const startBody = await startRes.json();
  record("starting lesson-1 transitions to IN_PROGRESS", startRes.status === 200 && startBody.data?.status === "IN_PROGRESS", { status: startRes.status });

  const completeRes = await fetch(`${BASE}/api/v1/learn/lessons/${lesson1.id}/progress`, { method: "POST", headers: learnerAuth.headers, body: JSON.stringify({ action: "complete" }) });
  const completeBody = await completeRes.json();
  record("completing lesson-1 transitions to COMPLETED", completeRes.status === 200 && completeBody.data?.status === "COMPLETED", { status: completeRes.status });

  const lesson2UnlockedRes = await fetch(`${BASE}/api/v1/learn/lessons/${lesson2.id}`, { headers: learnerAuth.headers });
  const lesson2UnlockedBody = await lesson2UnlockedRes.json();
  record("lesson-2 unlocks once lesson-1 is completed", lesson2UnlockedRes.status === 200 && lesson2UnlockedBody.data?.progressStatus === "AVAILABLE", { status: lesson2UnlockedRes.status });

  // Direct-URL bypass attempt on a much later, still-locked lesson (e.g. lesson-5, published or not).
  const lesson5 = await prisma.lesson.findFirstOrThrow({ where: { slug: "lesson-5" } });
  const bypassRes = await fetch(`${BASE}/api/v1/learn/lessons/${lesson5.id}`, { headers: learnerAuth.headers });
  record("direct URL access to a far-ahead lesson is still rejected server-side", bypassRes.status === 423 || bypassRes.status === 404, { status: bypassRes.status });
}

async function main() {
  const owner = await prisma.user.findFirstOrThrow({ where: { email: process.env.OWNER_EMAIL } });
  const staffAuth = await sessionCookies(owner.id);
  await partA_scheduledPublication(staffAuth);
  await partB_realSequenceAndProgress();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    console.log(`\n${results.filter((r) => r.pass).length}/${results.length} checks passed.`);

    // Clean up Part A's throwaway track (cascades lesson/module/course).
    for (const trackId of created.trackIds) {
      const lessons = await prisma.lesson.findMany({ where: { module: { course: { trackId } } }, include: { versions: true } });
      const versionIds = lessons.flatMap((l) => l.versions.map((v) => v.id));
      const documentIds = lessons.flatMap((l) => l.versions.map((v) => v.documentId));
      await prisma.lessonProgress.deleteMany({ where: { lessonVersionId: { in: versionIds } } });
      await prisma.lessonVersion.deleteMany({ where: { id: { in: versionIds } } });
      await prisma.lesson.deleteMany({ where: { id: { in: lessons.map((l) => l.id) } } });
      const modules = await prisma.module.findMany({ where: { course: { trackId } } });
      await prisma.module.deleteMany({ where: { id: { in: modules.map((m) => m.id) } } });
      const courses = await prisma.course.findMany({ where: { trackId } });
      await prisma.course.deleteMany({ where: { id: { in: courses.map((c) => c.id) } } });
      await prisma.contentDocument.deleteMany({ where: { id: { in: documentIds } } });
      await prisma.track.delete({ where: { id: trackId } });
    }

    // Clean up Part B's throwaway learner and everything tied to them (real
    // lesson-1/lesson-2 publications are kept - they're real curriculum state).
    if (created.userIds.length > 0) {
      const enrollments = await prisma.enrollment.findMany({ where: { userId: { in: created.userIds } } });
      await prisma.lessonProgress.deleteMany({ where: { enrollmentId: { in: enrollments.map((e) => e.id) } } });
      await prisma.enrollment.deleteMany({ where: { id: { in: enrollments.map((e) => e.id) } } });
      const grants = await prisma.entitlementGrant.findMany({ where: { userId: { in: created.userIds } } });
      await prisma.entitlement.deleteMany({ where: { userId: { in: created.userIds } } });
      await prisma.entitlementGrant.deleteMany({ where: { id: { in: grants.map((g) => g.id) } } });
      await prisma.user.deleteMany({ where: { id: { in: created.userIds } } });
    }
    await prisma.session.deleteMany({ where: { sessionToken: { in: created.sessionTokenHashes } } });
    await prisma.$disconnect();
    if (results.some((r) => !r.pass)) process.exitCode = 1;
  });

// Week 3 Tuesday content-authoring verification.
//
// Exercises the real dev server + real Neon dev DB: draft creation, block
// validation on write, immutable publication, reusable-block snapshots, the
// manual-review flag, and permission gating. Cleans up everything it
// creates on exit.
//
// Not covered here: an actual R2 asset upload (no R2 credentials are
// configured in this environment yet - see docs/delivery/week-03-*.md).
// The asset endpoint's own request-shape/type/size validation (which runs
// before any R2 call) is still exercised.
//
// Usage: node --experimental-strip-types scripts/tuesday-content-authoring-acceptance.mjs

import "dotenv/config";
import { createHash, randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client.ts";
import { generateCsrfToken } from "../src/lib/auth/csrf.ts";

const BASE = process.env.ADMIN_BASE_URL ?? "http://localhost:3001";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL }) });

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"} - ${name}${detail !== undefined ? ": " + JSON.stringify(detail) : ""}`);
}

function createOpaqueToken() {
  return randomBytes(32).toString("base64url");
}
function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

const created = { userIds: [], trackIds: [], courseIds: [], moduleIds: [], lessonIds: [], reusableBlockIds: [], sessionTokenHashes: [] };

async function sessionCookies(userId) {
  const sessionToken = createOpaqueToken();
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

const validParagraph = { id: "b1", version: 1, type: "paragraph", data: { richText: [{ text: "Hello world" }] } };
const invalidBlock = { id: "b1", version: 1, type: "paragraph", data: { richText: [{ text: 123 }] } };

async function main() {
  const staff = await prisma.user.create({
    data: { email: `tuesday-staff-${stamp}@example.test`, name: "Tuesday Staff", emailVerified: new Date(), status: "ACTIVE" },
  });
  created.userIds.push(staff.id);
  const learner = await prisma.user.create({
    data: { email: `tuesday-learner-${stamp}@example.test`, name: "Tuesday Learner", emailVerified: new Date(), status: "ACTIVE" },
  });
  created.userIds.push(learner.id);

  const owner = await prisma.user.findFirstOrThrow({ where: { email: process.env.OWNER_EMAIL } });
  const staffAuth = await sessionCookies(owner.id); // Owner role has every permission - stands in for a content.edit/content.publish staff account.
  const noPermAuth = await sessionCookies(learner.id);

  const track = await prisma.track.create({
    data: { slug: `tuesday-test-${stamp}`, title: "Tuesday Acceptance Track", description: "temp", status: "DRAFT" },
  });
  created.trackIds.push(track.id);
  const course = await prisma.course.create({ data: { trackId: track.id, slug: "course", title: "Course", order: 1 } });
  created.courseIds.push(course.id);
  const mod = await prisma.module.create({ data: { courseId: course.id, slug: "module", title: "Module", order: 1 } });
  created.moduleIds.push(mod.id);
  const lesson = await prisma.lesson.create({ data: { moduleId: mod.id, slug: "lesson", title: "Lesson", order: 1 } });
  created.lessonIds.push(lesson.id);

  // 1. Create a draft version.
  let versionId;
  {
    const res = await fetch(`${BASE}/api/v1/content/lessons/${lesson.id}/versions`, { method: "POST", headers: staffAuth.headers, body: "{}" });
    const body = await res.json();
    record("draft lesson version created", res.status === 201 && body.data?.status === "DRAFT", { status: res.status });
    versionId = body.data?.id;
  }

  // 2. Invalid blocks are rejected on write.
  {
    const res = await fetch(`${BASE}/api/v1/content/lesson-versions/${versionId}`, {
      method: "PATCH", headers: staffAuth.headers, body: JSON.stringify({ blocks: [invalidBlock] }),
    });
    record("invalid block content is rejected on write", res.status === 400, { status: res.status });
  }

  // 3. Valid blocks are accepted.
  {
    const res = await fetch(`${BASE}/api/v1/content/lesson-versions/${versionId}`, {
      method: "PATCH", headers: staffAuth.headers, body: JSON.stringify({ blocks: [validParagraph] }),
    });
    const body = await res.json();
    record("valid block content is accepted on write", res.status === 200 && body.data?.document?.blocks?.length === 1, { status: res.status });
  }

  // 4. Publish requires content.publish permission.
  {
    const res = await fetch(`${BASE}/api/v1/content/lesson-versions/${versionId}/publish`, { method: "POST", headers: noPermAuth.headers });
    record("publish is forbidden without content.publish", res.status === 403, { status: res.status });
  }

  // 5. Publish succeeds for staff.
  {
    const res = await fetch(`${BASE}/api/v1/content/lesson-versions/${versionId}/publish`, { method: "POST", headers: staffAuth.headers });
    const body = await res.json();
    record("publish succeeds for staff with content.publish", res.status === 200 && body.data?.status === "PUBLISHED", { status: res.status });
  }

  // 6. A published version is immutable - editing it is rejected.
  {
    const res = await fetch(`${BASE}/api/v1/content/lesson-versions/${versionId}`, {
      method: "PATCH", headers: staffAuth.headers, body: JSON.stringify({ blocks: [validParagraph, validParagraph] }),
    });
    record("editing a published version is rejected (immutability)", res.status === 409, { status: res.status });
  }

  // 7. Reusable block: create, resolve as a snapshot, insert into a new draft, publish.
  let reusableBlockId;
  {
    const res = await fetch(`${BASE}/api/v1/content/reusable-blocks`, {
      method: "POST", headers: staffAuth.headers, body: JSON.stringify({ name: "Shared callout", blocks: [{ id: "rb1", version: 1, type: "callout", data: { tone: "info", body: "Shared tip" } }] }),
    });
    const body = await res.json();
    record("reusable block created", res.status === 201 && body.data?.version === 1, { status: res.status });
    reusableBlockId = body.data?.id;
    if (reusableBlockId) created.reusableBlockIds.push(reusableBlockId);
  }
  let snapshotBlock;
  {
    const res = await fetch(`${BASE}/api/v1/content/reusable-blocks/${reusableBlockId}/snapshot`, { headers: staffAuth.headers });
    const body = await res.json();
    snapshotBlock = body.data;
    record("reusable block resolves to an insertable snapshot", res.status === 200 && snapshotBlock?.type === "reusableSnapshot" && snapshotBlock.data.sourceVersion === 1, { status: res.status });
  }
  {
    const draftRes = await fetch(`${BASE}/api/v1/content/lessons/${lesson.id}/versions`, { method: "POST", headers: staffAuth.headers, body: "{}" });
    const draft = (await draftRes.json()).data;
    const patchRes = await fetch(`${BASE}/api/v1/content/lesson-versions/${draft.id}`, {
      method: "PATCH", headers: staffAuth.headers, body: JSON.stringify({ blocks: [snapshotBlock] }),
    });
    record("a resolved snapshot block validates inside a lesson document", patchRes.status === 200, { status: patchRes.status });

    // Editing the reusable block afterward must not retroactively change the already-embedded snapshot.
    await fetch(`${BASE}/api/v1/content/reusable-blocks/${reusableBlockId}`, {
      method: "PATCH", headers: staffAuth.headers, body: JSON.stringify({ blocks: [{ id: "rb1", version: 1, type: "callout", data: { tone: "warning", body: "Changed after snapshot" } }] }),
    });
    const reloaded = await prisma.lessonVersion.findUnique({ where: { id: draft.id }, include: { document: true } });
    const embeddedBody = reloaded.document.blocks[0]?.data?.blocks?.[0]?.data?.body;
    record("editing a reusable block does not retroactively change an embedded snapshot", embeddedBody === "Shared tip", { embeddedBody });
  }

  // 8. Manual review: forbidden without content.publish, succeeds for staff.
  {
    const forbidden = await fetch(`${BASE}/api/v1/content/lesson-versions/${versionId}/review`, {
      method: "POST", headers: noPermAuth.headers, body: JSON.stringify({ status: "APPROVED" }),
    });
    record("review is forbidden without content.publish", forbidden.status === 403, { status: forbidden.status });

    const approved = await fetch(`${BASE}/api/v1/content/lesson-versions/${versionId}/review`, {
      method: "POST", headers: staffAuth.headers, body: JSON.stringify({ status: "APPROVED" }),
    });
    const approvedBody = await approved.json();
    record("review approval recorded for staff", approved.status === 200 && approvedBody.data?.reviewStatus === "APPROVED", { status: approved.status });
  }

  // 9. Asset upload: request-shape validation runs before any R2 call (no R2 credentials in this environment).
  {
    const form = new FormData();
    form.append("file", new Blob(["not an image"], { type: "application/zip" }), "malware.zip");
    // Deliberately omit Content-Type so fetch sets the multipart boundary itself.
    const { "Content-Type": _unused, ...multipartHeaders } = staffAuth.headers;
    const res = await fetch(`${BASE}/api/v1/content/assets`, { method: "POST", headers: multipartHeaders, body: form });
    const body = await res.json().catch(() => null);
    record("asset upload rejects a disallowed content type before touching storage", res.status === 400, { status: res.status, body });
  }

  // 10. Audit trail for publish/review actions.
  {
    const events = await prisma.auditEvent.findMany({ where: { resourceId: versionId }, orderBy: { createdAt: "asc" } });
    console.log("\nAudit trail for this run:");
    for (const e of events) console.log(`  [${e.correlationId}] ${e.action} on ${e.resourceType}/${e.resourceId}`);
    record("audit events recorded for publish and review actions", events.some((e) => e.action === "lesson.version.published") && events.some((e) => e.action === "lesson.version.review_approved"), { count: events.length });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    console.log(`\n${results.filter((r) => r.pass).length}/${results.length} checks passed.`);
    const lessons = await prisma.lesson.findMany({ where: { id: { in: created.lessonIds } }, include: { versions: true } });
    const versionIds = lessons.flatMap((l) => l.versions.map((v) => v.id));
    const documentIds = lessons.flatMap((l) => l.versions.map((v) => v.documentId));
    await prisma.auditEvent.deleteMany({ where: { resourceId: { in: versionIds } } });
    await prisma.lessonVersion.deleteMany({ where: { id: { in: versionIds } } });
    await prisma.lesson.deleteMany({ where: { id: { in: created.lessonIds } } });
    await prisma.module.deleteMany({ where: { id: { in: created.moduleIds } } });
    await prisma.course.deleteMany({ where: { id: { in: created.courseIds } } });
    await prisma.track.deleteMany({ where: { id: { in: created.trackIds } } });
    await prisma.contentDocument.deleteMany({ where: { id: { in: documentIds } } });
    const reusableBlocks = await prisma.reusableBlock.findMany({ where: { id: { in: created.reusableBlockIds } } });
    await prisma.reusableBlock.deleteMany({ where: { id: { in: created.reusableBlockIds } } });
    await prisma.contentDocument.deleteMany({ where: { id: { in: reusableBlocks.map((r) => r.documentId) } } });
    await prisma.session.deleteMany({ where: { sessionToken: { in: created.sessionTokenHashes } } });
    await prisma.user.deleteMany({ where: { id: { in: created.userIds } } });
    await prisma.$disconnect();
    if (results.some((r) => !r.pass)) process.exitCode = 1;
  });

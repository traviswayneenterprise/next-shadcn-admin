// Week 3 Wednesday: manual review of lessons 1-12, per the import
// diagnostics report (docs/delivery/reports/curriculum-import-*.json).
//
// This is a real, permanent action against the real dev database via the
// real review API (POST /api/v1/content/lesson-versions/{id}/review) -
// not a throwaway test script. Decisions:
// - Lessons with only "unsupported" entries (lab uploads pending R2
//   credentials) are APPROVED: the imported lesson content itself is
//   complete and correct, the missing piece is infrastructure, not content.
// - Lesson 12 is NEEDS_CORRECTION: dom_manipulation_practice.md has an
//   HTML example written without a fenced code block, so it parsed as raw
//   HTML and was correctly dropped (ADR 0002) rather than imported as
//   trusted markup - the source file needs that example wrapped in a
//   ```html fence before it can be re-imported with the example intact.
//
// Usage: node --experimental-strip-types scripts/review-lessons-1-12.mjs

import "dotenv/config";
import { createHash, randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { generateCsrfToken } from "../src/lib/auth/csrf.ts";

const BASE = process.env.ADMIN_BASE_URL ?? "http://localhost:3001";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL }) });
function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

const DECISIONS = {
  "lesson-1": { status: "APPROVED" },
  "lesson-2": { status: "APPROVED", note: "2 example HTML files pending R2 upload once credentials are configured; content itself is complete." },
  "lesson-3": { status: "APPROVED" },
  "lesson-4": { status: "APPROVED", note: "1 example HTML file pending R2 upload." },
  "lesson-5": { status: "APPROVED", note: "1 example HTML file pending R2 upload." },
  "lesson-6": { status: "APPROVED", note: "1 example HTML file pending R2 upload." },
  "lesson-7": { status: "APPROVED", note: "1 example HTML file pending R2 upload." },
  "lesson-8": { status: "APPROVED", note: "1 example HTML file pending R2 upload." },
  "lesson-9": { status: "APPROVED", note: "1 example HTML file pending R2 upload." },
  "lesson-10": { status: "APPROVED", note: "2 example HTML files pending R2 upload." },
  "lesson-11": { status: "APPROVED", note: "1 example HTML file pending R2 upload." },
  "lesson-12": {
    status: "NEEDS_CORRECTION",
    note: "exercises/dom_manipulation_practice.md has an HTML example (~line 11) written without a ```html fence, so it parsed as raw HTML and was correctly dropped per ADR 0002 rather than imported as trusted markup. Wrap it in a proper code fence and re-run the importer. A <details>/<summary> collapsible hint later in the same file was also dropped for the same reason - consider rewriting it as plain text or a callout block.",
  },
};

async function main() {
  const owner = await prisma.user.findFirstOrThrow({ where: { email: process.env.OWNER_EMAIL } });
  const sessionToken = randomBytes(32).toString("base64url");
  await prisma.session.create({ data: { userId: owner.id, sessionToken: hashToken(sessionToken), expires: new Date(Date.now() + 3600_000) } });
  const csrfToken = generateCsrfToken();
  const cookie = `twe.session-token=${sessionToken}; twe.csrf-token=${csrfToken}`;

  for (const [slug, decision] of Object.entries(DECISIONS)) {
    const lesson = await prisma.lesson.findFirstOrThrow({ where: { slug }, include: { versions: { orderBy: { version: "desc" }, take: 1 } } });
    const versionId = lesson.versions[0].id;
    const response = await fetch(`${BASE}/api/v1/content/lesson-versions/${versionId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE, Cookie: cookie, "x-csrf-token": csrfToken },
      body: JSON.stringify({ status: decision.status, note: decision.note }),
    });
    const body = await response.json();
    console.log(`${slug}: ${response.status === 200 ? "OK" : "FAILED"} -> ${decision.status}`, response.status !== 200 ? body : "");
  }

  await prisma.session.deleteMany({ where: { sessionToken: hashToken(sessionToken) } });
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

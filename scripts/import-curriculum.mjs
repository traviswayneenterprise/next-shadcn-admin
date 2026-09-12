// Week 3 Wednesday: deterministic curriculum importer.
//
// Reads all "Lesson N/" folders from the Software-Dev-2026 source repo and
// imports each as a DRAFT lesson (never auto-published), producing a
// structured diagnostics report. Resumable: rerunning updates the same
// draft in place (matched by lesson-{N} slug) rather than duplicating it.
//
// Usage: npx tsx scripts/import-curriculum.mjs
// (tsx, not plain node - the domain modules this script pulls in use "@/"
// tsconfig path aliases, which only tsx/Next resolve, not plain node.)
// Env: CURRICULUM_SOURCE_DIR (default: ../../Software-Dev-2026 relative to
// this repo), OWNER_EMAIL (the actor recorded as the importer).

import "dotenv/config";

import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/db";
import { importLessonFolder, getOrCreateCurriculumStructure } from "@/domain/content/importer";

const SOURCE_DIR = path.resolve(process.cwd(), process.env.CURRICULUM_SOURCE_DIR ?? "../../Software-Dev-2026");

const CONTENT_TYPE_BY_EXT = { ".html": "text/html", ".css": "text/css", ".js": "application/javascript" };

function extractTitle(h1, lessonNumber) {
  let title = h1.replace(/^#+\s*/, "").trim();
  title = title.replace(/^student notes\s*[-–—:]\s*/i, "");
  title = title.replace(new RegExp(`^lesson\\s*${lessonNumber}\\s*[:\\-–—]?\\s*`, "i"), "");
  title = title.replace(/\s*[-–—]\s*student notes\s*$/i, "");
  return title.trim() || `Lesson ${lessonNumber}`;
}

async function readIfExists(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return undefined;
  }
}

async function readMarkdownFiles(dir) {
  try {
    const names = (await readdir(dir)).filter((name) => name.endsWith(".md")).sort();
    return Promise.all(names.map(async (name) => ({ name, content: await readFile(path.join(dir, name), "utf8") })));
  } catch {
    return [];
  }
}

async function readLabFiles(dir) {
  try {
    const names = (await readdir(dir)).filter((name) => name.endsWith(".html")).sort();
    return Promise.all(
      names.map(async (name) => ({
        name,
        buffer: await readFile(path.join(dir, name)),
        contentType: CONTENT_TYPE_BY_EXT[path.extname(name)] ?? "application/octet-stream",
      })),
    );
  } catch {
    return [];
  }
}

async function main() {
  const owner = await prisma.user.findFirstOrThrow({ where: { email: process.env.OWNER_EMAIL } });
  const { module: courseModule } = await getOrCreateCurriculumStructure();

  let entries = (await readdir(SOURCE_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^Lesson \d+$/.test(entry.name))
    .map((entry) => ({ name: entry.name, number: Number(entry.name.match(/\d+/)[0]) }))
    .sort((a, b) => a.number - b.number);

  console.log(`Found ${entries.length} lesson folders in ${SOURCE_DIR}`);
  if (process.env.LESSON_LIMIT) {
    entries = entries.slice(0, Number(process.env.LESSON_LIMIT));
    console.log(`LESSON_LIMIT set: processing only the first ${entries.length}`);
  }

  const folders = [];
  for (const entry of entries) {
    const dir = path.join(SOURCE_DIR, entry.name);
    const readme = await readIfExists(path.join(dir, "README.md"));
    const studentNotes = await readIfExists(path.join(dir, "notes", "student_notes.md"));
    const exercises = await readMarkdownFiles(path.join(dir, "exercises"));
    const assignments = await readMarkdownFiles(path.join(dir, "assignments"));
    const labs = await readLabFiles(path.join(dir, "examples"));

    const titleSource = readme?.split("\n")[0] ?? studentNotes?.split("\n")[0];
    const title = titleSource ? extractTitle(titleSource, entry.number) : `Lesson ${entry.number}`;

    process.stdout.write(`Importing ${entry.name} (${title})... `);
    const report = await importLessonFolder({
      lessonNumber: entry.number,
      title,
      readme,
      studentNotes,
      exercises,
      assignments,
      labs,
      actorId: owner.id,
      moduleId: courseModule.id,
    });
    console.log(report.outcome, `(${report.warnings.length} warnings, ${report.unsupported.length} unsupported, ${labs.length} lab file(s))`);
    folders.push(report);
  }

  const summary = {
    runId: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    total: folders.length,
    imported: folders.filter((f) => f.outcome === "imported").length,
    failed: folders.filter((f) => f.outcome === "failed").length,
    folders,
  };

  const outDir = path.resolve(process.cwd(), "docs/delivery/reports");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `curriculum-import-${new Date().toISOString().slice(0, 10)}.json`);
  await writeFile(outPath, JSON.stringify(summary, null, 2));

  console.log(`\n${summary.imported}/${summary.total} imported, ${summary.failed} failed.`);
  console.log(`Report written to ${outPath}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

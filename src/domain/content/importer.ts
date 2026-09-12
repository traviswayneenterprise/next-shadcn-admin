import type { Prisma } from "@/generated/prisma/client";
import { parseMarkdown, type ParseWarning } from "@/domain/content/markdown";
import { uploadAsset, AssetUploadError } from "@/domain/content/assets";
import { validateContentDocument } from "@/domain/content/blocks";
import { prisma, TRANSACTION_OPTIONS } from "@/lib/db";

export type LabFile = { name: string; buffer: Buffer; contentType: string };
export type ImportInput = {
  lessonNumber: number;
  title: string;
  readme?: string;
  studentNotes?: string;
  exercises: { name: string; content: string }[];
  assignments: { name: string; content: string }[];
  labs: LabFile[];
};

export type AssetDiagnostic = { sourceFile: string; assetId?: string; status: "uploaded" | "failed"; error?: string };
export type FolderReport = {
  sourcePath: string;
  lessonSlug: string;
  outcome: "imported" | "failed";
  warnings: ParseWarning[];
  unsupported: { sourceFile: string; reason: string }[];
  assets: AssetDiagnostic[];
};

function headingBlock(text: string) {
  return { id: crypto.randomUUID(), version: 1, type: "heading", data: { level: 2, text } };
}

/** Composes one lesson's markdown sources into a single block list, plus objectives and diagnostics. Pure - no I/O. */
export function composeLessonContent(input: ImportInput) {
  const warnings: ParseWarning[] = [];
  const blocks: unknown[] = [];
  let objectives: string[] | null = null;

  if (input.readme) {
    const parsed = parseMarkdown(input.readme);
    if (parsed.objectives) objectives = parsed.objectives;
    // The rest of README.md (contents table, quick-start links) is
    // navigational, not lesson content - intentionally not imported.
  }

  if (input.studentNotes) {
    const parsed = parseMarkdown(input.studentNotes);
    blocks.push(...parsed.blocks);
    warnings.push(...parsed.warnings);
  } else {
    warnings.push({ code: "notes.missing", message: "No notes/student_notes.md found." });
  }

  for (const exercise of input.exercises) {
    blocks.push(headingBlock(`Exercises: ${exercise.name}`));
    const parsed = parseMarkdown(exercise.content);
    blocks.push(...parsed.blocks);
    warnings.push(...parsed.warnings.map((w) => ({ ...w, message: `[${exercise.name}] ${w.message}` })));
  }

  for (const assignment of input.assignments) {
    // Assignment records require a Rubric (Week 4 scope, not yet
    // implemented) - imported as lesson-body content for now, not a true
    // Assignment entity. Revisit once Week 4 rubrics exist.
    blocks.push(headingBlock(`Assignment: ${assignment.name}`));
    const parsed = parseMarkdown(assignment.content);
    blocks.push(...parsed.blocks);
    warnings.push(...parsed.warnings.map((w) => ({ ...w, message: `[${assignment.name}] ${w.message}` })));
  }

  return { blocks, objectives, warnings };
}

/** Called once by the import runner before processing any lesson folders. */
export async function getOrCreateCurriculumStructure() {
  const track = await prisma.track.upsert({
    where: { slug: "software-dev-2026" },
    update: {},
    create: { slug: "software-dev-2026", title: "Software Development 2026", description: "Full-stack software engineering curriculum.", status: "DRAFT" },
  });
  const course = await prisma.course.upsert({
    where: { trackId_slug: { trackId: track.id, slug: "core" } },
    update: {},
    create: { trackId: track.id, slug: "core", title: "Core Curriculum", order: 1 },
  });
  const module_ = await prisma.module.upsert({
    where: { courseId_slug: { courseId: course.id, slug: "foundations" } },
    update: {},
    create: { courseId: course.id, slug: "foundations", title: "Foundations", order: 1 },
  });
  return { track, course, module: module_ };
}

/** Uploads lab files, tolerating R2 not being configured yet - failures are diagnostics, not fatal. */
async function uploadLabAssets(labs: LabFile[], actorId: string) {
  const blocks: unknown[] = [];
  const diagnostics: AssetDiagnostic[] = [];
  for (const lab of labs) {
    try {
      const asset = await uploadAsset({ uploadedById: actorId, originalName: lab.name, contentType: lab.contentType, bytes: lab.buffer });
      diagnostics.push({ sourceFile: lab.name, assetId: asset.id, status: "uploaded" });
      blocks.push({ id: crypto.randomUUID(), version: 1, type: "lab", data: { assetId: asset.id, title: lab.name } });
    } catch (error) {
      const message = error instanceof AssetUploadError ? error.message : error instanceof Error ? error.message : "Upload failed.";
      diagnostics.push({ sourceFile: lab.name, status: "failed", error: message });
    }
  }
  return { blocks, diagnostics };
}

/** Imports one lesson folder: idempotent by slug, resumable, never publishes automatically. */
export async function importLessonFolder(input: ImportInput & { actorId: string; moduleId: string }): Promise<FolderReport> {
  const slug = `lesson-${input.lessonNumber}`;
  const sourcePath = `Lesson ${input.lessonNumber}/`;

  try {
    const { blocks: contentBlocks, objectives, warnings } = composeLessonContent(input);
    const { blocks: labBlocks, diagnostics: assets } = await uploadLabAssets(input.labs, input.actorId);
    if (labBlocks.length > 0) contentBlocks.push(headingBlock("Interactive examples"), ...labBlocks);

    const unsupported: { sourceFile: string; reason: string }[] = [];
    for (const asset of assets) {
      if (asset.status === "failed") unsupported.push({ sourceFile: asset.sourceFile, reason: asset.error ?? "Upload failed." });
    }

    const validated = validateContentDocument({ schemaVersion: 1, blocks: contentBlocks });

    await prisma.$transaction(async (transaction) => {
      const lesson = await transaction.lesson.upsert({
        where: { moduleId_slug: { moduleId: input.moduleId, slug } },
        update: { title: input.title, order: input.lessonNumber },
        create: { moduleId: input.moduleId, slug, title: input.title, order: input.lessonNumber },
        include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      });

      const latest = lesson.versions[0];
      if (latest && latest.status === "DRAFT") {
        await transaction.contentDocument.update({
          where: { id: latest.documentId },
          data: { blocks: validated.blocks as Prisma.InputJsonValue },
        });
        await transaction.lessonVersion.update({
          where: { id: latest.id },
          data: { reviewStatus: "PENDING", objectives: objectives as Prisma.InputJsonValue | undefined },
        });
      } else {
        const document = await transaction.contentDocument.create({ data: { schemaVersion: 1, blocks: validated.blocks as Prisma.InputJsonValue } });
        await transaction.lessonVersion.create({
          data: {
            lessonId: lesson.id,
            version: (latest?.version ?? 0) + 1,
            documentId: document.id,
            createdById: input.actorId,
            objectives: objectives as Prisma.InputJsonValue | undefined,
          },
        });
      }
    }, TRANSACTION_OPTIONS);

    return { sourcePath, lessonSlug: slug, outcome: "imported", warnings, unsupported, assets };
  } catch (error) {
    return {
      sourcePath,
      lessonSlug: slug,
      outcome: "failed",
      warnings: [{ code: "import.failed", message: error instanceof Error ? error.message : "Unknown import failure." }],
      unsupported: [],
      assets: [],
    };
  }
}

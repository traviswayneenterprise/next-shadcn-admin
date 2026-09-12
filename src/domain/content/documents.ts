import type { Prisma } from "@/generated/prisma/client";
import { validateContentDocument, type ContentDocument } from "@/domain/content/blocks";
import { prisma, TRANSACTION_OPTIONS } from "@/lib/db";

export class DocumentEditError extends Error {}

export async function createDraftLessonVersion(input: { lessonId: string; actorId: string; forkFromVersionId?: string }) {
  return prisma.$transaction(async (transaction) => {
    const lesson = await transaction.lesson.findUnique({
      where: { id: input.lessonId },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });
    if (!lesson) throw new DocumentEditError("Lesson not found.");

    let blocks: ContentDocument["blocks"] = [];
    if (input.forkFromVersionId) {
      const source = await transaction.lessonVersion.findUnique({
        where: { id: input.forkFromVersionId },
        include: { document: true },
      });
      if (!source || source.lessonId !== input.lessonId) throw new DocumentEditError("Source version not found.");
      blocks = validateContentDocument(source.document.blocks).blocks;
    }

    const document = await transaction.contentDocument.create({
      data: { schemaVersion: 1, blocks: blocks as Prisma.InputJsonValue },
    });
    const nextVersion = (lesson.versions[0]?.version ?? 0) + 1;
    return transaction.lessonVersion.create({
      data: { lessonId: lesson.id, version: nextVersion, documentId: document.id, createdById: input.actorId },
      include: { document: true },
    });
  }, TRANSACTION_OPTIONS);
}

export async function updateDraftDocument(input: { lessonVersionId: string; blocks: unknown }) {
  const validated = validateContentDocument({ schemaVersion: 1, blocks: input.blocks });

  return prisma.$transaction(async (transaction) => {
    const version = await transaction.lessonVersion.findUnique({ where: { id: input.lessonVersionId } });
    if (!version) throw new DocumentEditError("Lesson version not found.");
    if (version.status !== "DRAFT") throw new DocumentEditError("Only draft versions can be edited.");

    await transaction.contentDocument.update({
      where: { id: version.documentId },
      data: { blocks: validated.blocks as Prisma.InputJsonValue },
    });
    // An edit invalidates any prior manual-review decision on this draft.
    return transaction.lessonVersion.update({
      where: { id: version.id },
      data: { reviewStatus: "PENDING" },
      include: { document: true },
    });
  }, TRANSACTION_OPTIONS);
}

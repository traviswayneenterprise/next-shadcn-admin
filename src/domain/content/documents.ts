import type { Prisma } from "@/generated/prisma/client";
import { validateContentDocument, type ContentDocument } from "@/domain/content/blocks";
import { validateLexicalDocument } from "@/domain/content/lexical-document";
import { validateTiptapDocument } from "@/domain/content/tiptap-document";
import { prisma, TRANSACTION_OPTIONS } from "@/lib/db";

export class DocumentEditError extends Error {}

const SLOT_FIELD = { 1: "documentIdV1", 2: "documentIdV2", 3: "documentIdV3" } as const;

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
        include: { documentV1: true },
      });
      if (!source || source.lessonId !== input.lessonId) throw new DocumentEditError("Source version not found.");
      blocks = validateContentDocument(source.documentV1.blocks).blocks;
    }

    const document = await transaction.contentDocument.create({
      data: { schemaVersion: 1, blocks: blocks as Prisma.InputJsonValue },
    });
    const nextVersion = (lesson.versions[0]?.version ?? 0) + 1;
    return transaction.lessonVersion.create({
      data: { lessonId: lesson.id, version: nextVersion, documentIdV1: document.id, createdById: input.actorId },
      include: { documentV1: true },
    });
  }, TRANSACTION_OPTIONS);
}

export async function updateDraftDocument(input: {
  lessonVersionId: string;
  schemaVersion: 1 | 2 | 3;
  blocks: unknown;
  actorId: string;
}) {
  const validatedBlocks =
    input.schemaVersion === 1
      ? validateContentDocument({ schemaVersion: 1, blocks: input.blocks }).blocks
      : input.schemaVersion === 2
        ? validateLexicalDocument({ schemaVersion: 2, blocks: input.blocks }).blocks
        : validateTiptapDocument({ schemaVersion: 3, blocks: input.blocks }).blocks;

  return prisma.$transaction(async (transaction) => {
    const version = await transaction.lessonVersion.findUnique({ where: { id: input.lessonVersionId } });
    if (!version) throw new DocumentEditError("Lesson version not found.");
    if (version.status !== "DRAFT") throw new DocumentEditError("Only draft versions can be edited.");

    // Each editor owns its own independent slot (documentIdV1/V2/V3) - saving
    // in one never touches the others' content. The slot is created lazily,
    // the first time that editor is saved in for this draft.
    const slotField = SLOT_FIELD[input.schemaVersion];
    const existingDocumentId = version[slotField];

    if (existingDocumentId) {
      await transaction.contentDocument.update({
        where: { id: existingDocumentId },
        data: { blocks: validatedBlocks as Prisma.InputJsonValue },
      });
    } else {
      const document = await transaction.contentDocument.create({
        data: { schemaVersion: input.schemaVersion, blocks: validatedBlocks as Prisma.InputJsonValue },
      });
      await transaction.lessonVersion.update({
        where: { id: version.id },
        data: { [slotField]: document.id },
      });
    }

    await transaction.auditEvent.create({
      data: {
        actorId: input.actorId,
        action: "lesson.version.draft_saved",
        resourceType: "LessonVersion",
        resourceId: version.id,
        correlationId: crypto.randomUUID(),
        metadata: { schemaVersion: input.schemaVersion },
      },
    });

    // An edit invalidates any prior manual-review decision on this draft,
    // and marks this slot as the one Classic-view/Publish should read from.
    return transaction.lessonVersion.update({
      where: { id: version.id },
      data: { reviewStatus: "PENDING", activeSchemaVersion: input.schemaVersion },
      include: { documentV1: true, documentV2: true, documentV3: true },
    });
  }, TRANSACTION_OPTIONS);
}

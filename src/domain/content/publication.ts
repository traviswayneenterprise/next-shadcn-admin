import { validateContentDocument } from "@/domain/content/blocks";
import { validateLexicalDocument } from "@/domain/content/lexical-document";
import { prisma, TRANSACTION_OPTIONS } from "@/lib/db";

export async function publishLessonVersion(lessonVersionId: string, actorId: string) {
  return prisma.$transaction(async (transaction) => {
    const version = await transaction.lessonVersion.findUnique({
      where: { id: lessonVersionId },
      include: { document: true, lesson: true },
    });
    if (!version) throw new Error("Lesson version not found.");
    if (version.status === "PUBLISHED") throw new Error("Published lesson versions are immutable.");

    // Bug (fixed): this previously validated version.document.blocks (just
    // the array) against contentDocumentSchema, which expects the full
    // { schemaVersion, blocks } shape - every publish attempt failed
    // validation regardless of content. Caught by a live acceptance run.
    //
    // schemaVersion determines which validator runs - a v2 (Lexical)
    // document must never be checked against v1's block schema or every
    // publish would fail for the wrong reason all over again.
    if (version.document.schemaVersion === 1) {
      validateContentDocument({ schemaVersion: 1, blocks: version.document.blocks });
    } else if (version.document.schemaVersion === 2) {
      validateLexicalDocument({ schemaVersion: 2, blocks: version.document.blocks });
    } else {
      throw new Error(`Unknown content schemaVersion ${version.document.schemaVersion}; refusing to publish.`);
    }
    const publishedAt = new Date();
    await transaction.lessonVersion.update({
      where: { id: version.id },
      data: { status: "PUBLISHED", publishedAt, scheduledFor: null },
    });
    await transaction.lesson.update({
      where: { id: version.lessonId },
      data: { currentPublishedVersion: version.version },
    });
    await transaction.auditEvent.create({
      data: {
        actorId,
        action: "lesson.version.published",
        resourceType: "LessonVersion",
        resourceId: version.id,
        correlationId: crypto.randomUUID(),
        metadata: { lessonId: version.lessonId, version: version.version },
      },
    });
    return { ...version, status: "PUBLISHED" as const, publishedAt };
  }, TRANSACTION_OPTIONS);
}

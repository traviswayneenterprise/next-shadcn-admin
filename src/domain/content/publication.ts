import { validateContentDocument } from "@/domain/content/blocks";
import { prisma, TRANSACTION_OPTIONS } from "@/lib/db";

export async function publishLessonVersion(lessonVersionId: string, actorId: string) {
  return prisma.$transaction(async (transaction) => {
    const version = await transaction.lessonVersion.findUnique({
      where: { id: lessonVersionId },
      include: { document: true, lesson: true },
    });
    if (!version) throw new Error("Lesson version not found.");
    if (version.status === "PUBLISHED") throw new Error("Published lesson versions are immutable.");

    // Bug: this previously validated version.document.blocks (just the
    // array) against contentDocumentSchema, which expects the full
    // { schemaVersion, blocks } shape - every publish attempt failed
    // validation regardless of content. Caught by a live acceptance run.
    validateContentDocument({ schemaVersion: version.document.schemaVersion, blocks: version.document.blocks });
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

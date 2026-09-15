import { validateContentDocument } from "@/domain/content/blocks";
import { prisma, TRANSACTION_OPTIONS } from "@/lib/db";

export async function publishLessonVersion(lessonVersionId: string, actorId: string) {
  return prisma.$transaction(async (transaction) => {
    const version = await transaction.lessonVersion.findUnique({
      where: { id: lessonVersionId },
      include: { documentV1: true, lesson: true },
    });
    if (!version) throw new Error("Lesson version not found.");
    if (version.status === "PUBLISHED") throw new Error("Published lesson versions are immutable.");

    // Bug (fixed): this previously validated version.document.blocks (just
    // the array) against contentDocumentSchema, which expects the full
    // { schemaVersion, blocks } shape - every publish attempt failed
    // validation regardless of content. Caught by a live acceptance run.
    //
    // Publish always targets the classic (v1) slot, regardless of which
    // editor(s) also have content on this draft (documentV2/documentV3 -
    // see documents.ts). The learner-facing renderer
    // (src/domain/content/progression.ts) only knows how to validate and
    // serve v1 content; publishing a v2 (Lexical) or v3 (Tiptap) draft
    // straight through would 500 for real learners the moment they open
    // the lesson. Lexical and Tiptap are staff-only authoring trials until
    // a learner-facing renderer exists for one of them.
    validateContentDocument({ schemaVersion: 1, blocks: version.documentV1.blocks });
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

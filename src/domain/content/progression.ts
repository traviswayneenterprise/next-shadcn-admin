import type { Prisma } from "@/generated/prisma/client";
import { validateContentDocument } from "@/domain/content/blocks";
import { assetPublicUrl } from "@/domain/content/assets";
import { prisma, TRANSACTION_OPTIONS } from "@/lib/db";
import { publishLessonVersion } from "@/domain/content/publication";

export class AccessError extends Error {
  constructor(
    public readonly code: "NO_ENTITLEMENT" | "NOT_PUBLISHED" | "LOCKED_SEQUENCE" | "LOCKED_RELEASE_DATE" | "NOT_FOUND",
    message: string,
  ) {
    super(message);
  }
}

/** Idempotent: applies a due scheduled publication before any read of this lesson's current version. */
export async function applyDueScheduledPublication(lessonId: string) {
  const due = await prisma.lessonVersion.findFirst({
    where: { lessonId, status: "SCHEDULED", scheduledFor: { lte: new Date() } },
    orderBy: { version: "desc" },
  });
  if (due) await publishLessonVersion(due.id, due.createdById);
}

export async function scheduleLessonVersion(lessonVersionId: string, scheduledFor: Date) {
  const version = await prisma.lessonVersion.findUnique({ where: { id: lessonVersionId } });
  if (!version) throw new AccessError("NOT_FOUND", "Lesson version not found.");
  if (version.status === "PUBLISHED") throw new Error("Published lesson versions are immutable.");
  if (scheduledFor.getTime() <= Date.now()) throw new Error("scheduledFor must be in the future.");
  return prisma.lessonVersion.update({ where: { id: lessonVersionId }, data: { status: "SCHEDULED", scheduledFor } });
}

async function getOrCreateEnrollment(transaction: Prisma.TransactionClient, input: { userId: string; trackId: string; cohortId: string | null }) {
  const existing = await transaction.enrollment.findFirst({ where: { userId: input.userId, trackId: input.trackId } });
  if (existing) return existing;
  return transaction.enrollment.create({ data: { userId: input.userId, trackId: input.trackId, cohortId: input.cohortId } });
}

/** The ordered sequence of every lesson in a track, across all its modules/courses. */
async function getTrackLessonSequence(trackId: string) {
  const modules = await prisma.module.findMany({
    where: { course: { trackId } },
    orderBy: [{ course: { order: "asc" } }, { order: "asc" }],
    include: { lessons: { orderBy: { order: "asc" } } },
  });
  return modules.flatMap((module_) => module_.lessons);
}

async function resolveActiveEntitlement(userId: string, trackId: string) {
  return prisma.entitlement.findFirst({
    where: { userId, trackId, status: "ACTIVE", OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] },
  });
}

type LockedResult = { locked: true; reason: AccessError["code"]; message: string };
type UnlockedResult = {
  locked: false;
  lesson: { id: string; title: string; slug: string };
  progressStatus: "AVAILABLE" | "IN_PROGRESS" | "COMPLETED";
  version: number;
  objectives: unknown;
  blocks: unknown[];
};

/** Resolves whether a learner may currently access a lesson's published content, and what they'd see. */
export async function getLessonAccess(input: { userId: string; lessonId: string }): Promise<LockedResult | UnlockedResult> {
  await applyDueScheduledPublication(input.lessonId);

  const lesson = await prisma.lesson.findUnique({
    where: { id: input.lessonId },
    include: { module: { include: { course: { include: { track: true } } } } },
  });
  if (!lesson) throw new AccessError("NOT_FOUND", "Lesson not found.");
  if (!lesson.currentPublishedVersion) {
    return { locked: true, reason: "NOT_PUBLISHED", message: "This lesson has not been published yet." };
  }

  const trackId = lesson.module.course.trackId;
  const entitlement = await resolveActiveEntitlement(input.userId, trackId);
  if (!entitlement) {
    return { locked: true, reason: "NO_ENTITLEMENT", message: "You don't have access to this track." };
  }

  const sequence = await getTrackLessonSequence(trackId);
  const position = sequence.findIndex((l) => l.id === lesson.id);
  const previous = position > 0 ? sequence[position - 1] : null;

  const enrollment = await prisma.$transaction(
    (transaction) => getOrCreateEnrollment(transaction, { userId: input.userId, trackId, cohortId: null }),
    TRANSACTION_OPTIONS,
  );

  if (previous) {
    const previousProgress = await prisma.lessonProgress.findUnique({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: previous.id } },
    });
    if (previousProgress?.status !== "COMPLETED") {
      return { locked: true, reason: "LOCKED_SEQUENCE", message: `Complete "${previous.title}" first.` };
    }
  }

  if (enrollment.cohortId) {
    const release = await prisma.cohortRelease.findUnique({ where: { cohortId_lessonId: { cohortId: enrollment.cohortId, lessonId: lesson.id } } });
    if (release && release.releaseAt > new Date()) {
      return { locked: true, reason: "LOCKED_RELEASE_DATE", message: `Available from ${release.releaseAt.toISOString()}.` };
    }
  }

  const version = await prisma.lessonVersion.findFirst({
    where: { lessonId: lesson.id, version: lesson.currentPublishedVersion },
    include: { document: true },
  });
  if (!version) throw new AccessError("NOT_PUBLISHED", "Published version record is missing.");

  const progress = await prisma.lessonProgress.upsert({
    where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: lesson.id } },
    update: {},
    create: { enrollmentId: enrollment.id, lessonId: lesson.id, lessonVersionId: version.id, status: "AVAILABLE" },
  });

  const validated = validateContentDocument({ schemaVersion: version.document.schemaVersion, blocks: version.document.blocks });
  const blocks = await resolveBlockAssetUrls(validated.blocks);

  return {
    locked: false,
    lesson: { id: lesson.id, title: lesson.title, slug: lesson.slug },
    progressStatus: progress.status as "AVAILABLE" | "IN_PROGRESS" | "COMPLETED",
    version: version.version,
    objectives: version.objectives,
    blocks,
  };
}

/** Adds a resolved public `url` next to any block's assetId, so the frontend never needs R2 details. */
async function resolveBlockAssetUrls(blocks: unknown[]): Promise<unknown[]> {
  const typed = blocks as { type: string; data: Record<string, unknown> }[];
  const assetIds = [...new Set(
    typed
      .filter((b) => b.type === "image" || b.type === "file" || b.type === "lab")
      .map((b) => b.data.assetId)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  )];
  if (assetIds.length === 0) return typed;

  const assets = await prisma.asset.findMany({ where: { id: { in: assetIds } }, select: { id: true, key: true } });
  const keyById = new Map(assets.map((asset) => [asset.id, asset.key]));

  return typed.map((block) => {
    const assetId = block.data.assetId;
    if (typeof assetId !== "string") return block;
    const key = keyById.get(assetId);
    if (!key) return block;
    return { ...block, data: { ...block.data, url: safeAssetUrl(key) } };
  });
}

function safeAssetUrl(key: string) {
  try {
    return assetPublicUrl(key);
  } catch {
    return null;
  }
}

export async function updateLessonProgress(input: { userId: string; lessonId: string; action: "start" | "complete" }) {
  // Re-checking access ensures a lesson that was AVAILABLE a moment ago
  // (e.g. a cohort release date, or the prerequisite) hasn't since become
  // locked again, and lazily creates the AVAILABLE LessonProgress row this
  // update then transitions.
  const access = await getLessonAccess({ userId: input.userId, lessonId: input.lessonId });
  if (access.locked) throw new AccessError(access.reason, access.message);

  const lesson = await prisma.lesson.findUniqueOrThrow({
    where: { id: input.lessonId },
    include: { module: { include: { course: true } } },
  });
  const enrollment = await prisma.enrollment.findFirstOrThrow({
    where: { userId: input.userId, trackId: lesson.module.course.trackId },
  });

  const now = new Date();
  const data: Prisma.LessonProgressUpdateInput =
    input.action === "start"
      ? { status: "IN_PROGRESS", startedAt: now }
      : { status: "COMPLETED", completedAt: now };

  return prisma.lessonProgress.update({
    where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: input.lessonId } },
    data,
  });
}

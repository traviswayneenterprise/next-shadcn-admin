import { prisma } from "@/lib/db";
import { createDraftLessonVersion } from "@/domain/content/documents";

export class CatalogEditError extends Error {}

function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "untitled";
}

export async function createTrack(input: { title: string; description: string; actorId: string }) {
  return prisma.track.create({
    data: { slug: slugify(input.title), title: input.title, description: input.description },
  });
}

export async function updateTrack(input: { trackId: string; title: string; description: string; actorId: string }) {
  return prisma.track.update({
    where: { id: input.trackId },
    data: { title: input.title, description: input.description },
  });
}

// Soft delete only - archivedAt, never a real row deletion. Tracks/courses
// can have real enrollments, progress, and certificates attached once
// published; hard-deleting would orphan that data. Same convention already
// used for assets and the public catalog API (archivedAt: null filters).
export async function archiveTrack(input: { trackId: string; actorId: string }) {
  return prisma.track.update({ where: { id: input.trackId }, data: { archivedAt: new Date() } });
}

export async function createCourse(input: { trackId: string; title: string; description: string; actorId: string }) {
  const track = await prisma.track.findUnique({ where: { id: input.trackId } });
  if (!track) throw new CatalogEditError("Track not found.");

  const last = await prisma.course.findFirst({ where: { trackId: input.trackId }, orderBy: { order: "desc" } });
  return prisma.course.create({
    data: {
      trackId: input.trackId,
      slug: slugify(input.title),
      title: input.title,
      description: input.description || null,
      order: (last?.order ?? 0) + 1,
    },
  });
}

export async function updateCourse(input: { courseId: string; title: string; description: string; actorId: string }) {
  return prisma.course.update({
    where: { id: input.courseId },
    data: { title: input.title, description: input.description || null },
  });
}

export async function archiveCourse(input: { courseId: string; actorId: string }) {
  return prisma.course.update({ where: { id: input.courseId }, data: { archivedAt: new Date() } });
}

export async function createModule(input: { courseId: string; title: string; description: string; actorId: string }) {
  const course = await prisma.course.findUnique({ where: { id: input.courseId } });
  if (!course) throw new CatalogEditError("Course not found.");

  const last = await prisma.module.findFirst({ where: { courseId: input.courseId }, orderBy: { order: "desc" } });
  return prisma.module.create({
    data: {
      courseId: input.courseId,
      slug: slugify(input.title),
      title: input.title,
      description: input.description || null,
      order: (last?.order ?? 0) + 1,
    },
  });
}

export async function updateModule(input: { moduleId: string; title: string; description: string; actorId: string }) {
  return prisma.module.update({
    where: { id: input.moduleId },
    data: { title: input.title, description: input.description || null },
  });
}

export async function archiveModule(input: { moduleId: string; actorId: string }) {
  return prisma.module.update({ where: { id: input.moduleId }, data: { archivedAt: new Date() } });
}

export async function createLesson(input: { moduleId: string; title: string; estimatedMinutes?: number; actorId: string }) {
  const courseModule = await prisma.module.findUnique({ where: { id: input.moduleId } });
  if (!courseModule) throw new CatalogEditError("Module not found.");

  const last = await prisma.lesson.findFirst({ where: { moduleId: input.moduleId }, orderBy: { order: "desc" } });
  const lesson = await prisma.lesson.create({
    data: {
      moduleId: input.moduleId,
      slug: slugify(input.title),
      title: input.title,
      order: (last?.order ?? 0) + 1,
      estimatedMinutes: input.estimatedMinutes,
    },
  });
  // Every lesson needs at least one (classic, v1) draft to be editable -
  // same creation path "New draft" already uses, just with no fork source.
  await createDraftLessonVersion({ lessonId: lesson.id, actorId: input.actorId });
  return lesson;
}

export async function updateLesson(input: { lessonId: string; title: string; estimatedMinutes?: number; actorId: string }) {
  return prisma.lesson.update({
    where: { id: input.lessonId },
    data: { title: input.title, estimatedMinutes: input.estimatedMinutes ?? null },
  });
}

export async function archiveLesson(input: { lessonId: string; actorId: string }) {
  return prisma.lesson.update({ where: { id: input.lessonId }, data: { archivedAt: new Date() } });
}

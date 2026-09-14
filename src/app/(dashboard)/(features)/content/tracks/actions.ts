"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { requirePermission } from "@/lib/auth/authorize"
import {
  createTrack,
  createCourse,
  createModule,
  createLesson,
  updateTrack,
  archiveTrack,
  updateCourse,
  archiveCourse,
  updateModule,
  archiveModule,
  updateLesson,
  archiveLesson,
  getModuleLessons,
} from "@/domain/content/catalog"

export async function createTrackAction(formData: FormData) {
  const actor = await requirePermission("content.edit")
  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  if (!title) throw new Error("A title is required.")
  const track = await createTrack({ title, description, actorId: actor.id })
  revalidatePath("/content")
  redirect(`/content/tracks/${track.id}`)
}

export async function updateTrackAction(formData: FormData) {
  const actor = await requirePermission("content.edit")
  const trackId = String(formData.get("trackId") ?? "")
  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  if (!title) throw new Error("A title is required.")
  await updateTrack({ trackId, title, description, actorId: actor.id })
  revalidatePath(`/content/tracks/${trackId}`)
  revalidatePath("/content")
}

export async function archiveTrackAction(trackId: string) {
  const actor = await requirePermission("content.edit")
  await archiveTrack({ trackId, actorId: actor.id })
  revalidatePath("/content")
}

// Course/Module/Lesson all now live on the one Track workspace page (an
// accordion, not separate routes - see tracks/[trackId]/page.tsx), so
// their create/update actions just revalidate that page in place instead
// of redirecting anywhere.

export async function createCourseAction(formData: FormData) {
  const actor = await requirePermission("content.edit")
  const trackId = String(formData.get("trackId") ?? "")
  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  if (!title) throw new Error("A title is required.")
  await createCourse({ trackId, title, description, actorId: actor.id })
  revalidatePath(`/content/tracks/${trackId}`)
}

export async function updateCourseAction(formData: FormData) {
  const actor = await requirePermission("content.edit")
  const trackId = String(formData.get("trackId") ?? "")
  const courseId = String(formData.get("courseId") ?? "")
  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  if (!title) throw new Error("A title is required.")
  await updateCourse({ courseId, title, description, actorId: actor.id })
  revalidatePath(`/content/tracks/${trackId}`)
}

export async function archiveCourseAction(input: { trackId: string; courseId: string }) {
  const actor = await requirePermission("content.edit")
  await archiveCourse({ courseId: input.courseId, actorId: actor.id })
  revalidatePath(`/content/tracks/${input.trackId}`)
}

export async function createModuleAction(formData: FormData) {
  const actor = await requirePermission("content.edit")
  const trackId = String(formData.get("trackId") ?? "")
  const courseId = String(formData.get("courseId") ?? "")
  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  if (!title) throw new Error("A title is required.")
  await createModule({ courseId, title, description, actorId: actor.id })
  revalidatePath(`/content/tracks/${trackId}`)
}

export async function updateModuleAction(formData: FormData) {
  const actor = await requirePermission("content.edit")
  const trackId = String(formData.get("trackId") ?? "")
  const moduleId = String(formData.get("moduleId") ?? "")
  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  if (!title) throw new Error("A title is required.")
  await updateModule({ moduleId, title, description, actorId: actor.id })
  revalidatePath(`/content/tracks/${trackId}`)
}

export async function archiveModuleAction(input: { trackId: string; moduleId: string }) {
  const actor = await requirePermission("content.edit")
  await archiveModule({ moduleId: input.moduleId, actorId: actor.id })
  revalidatePath(`/content/tracks/${input.trackId}`)
}

export async function createLessonAction(formData: FormData) {
  const actor = await requirePermission("content.edit")
  const moduleId = String(formData.get("moduleId") ?? "")
  const title = String(formData.get("title") ?? "").trim()
  const estimatedMinutesRaw = String(formData.get("estimatedMinutes") ?? "").trim()
  const estimatedMinutes = estimatedMinutesRaw ? Number(estimatedMinutesRaw) : undefined
  if (!title) throw new Error("A title is required.")
  await createLesson({ moduleId, title, estimatedMinutes, actorId: actor.id })
}

export async function updateLessonAction(formData: FormData) {
  const actor = await requirePermission("content.edit")
  const lessonId = String(formData.get("lessonId") ?? "")
  const title = String(formData.get("title") ?? "").trim()
  const estimatedMinutesRaw = String(formData.get("estimatedMinutes") ?? "").trim()
  const estimatedMinutes = estimatedMinutesRaw ? Number(estimatedMinutesRaw) : undefined
  if (!title) throw new Error("A title is required.")
  await updateLesson({ lessonId, title, estimatedMinutes, actorId: actor.id })
}

export async function archiveLessonAction(lessonId: string) {
  const actor = await requirePermission("content.edit")
  await archiveLesson({ lessonId, actorId: actor.id })
}

export async function getModuleLessonsAction(moduleId: string) {
  await requirePermission("content.read")
  return getModuleLessons(moduleId)
}

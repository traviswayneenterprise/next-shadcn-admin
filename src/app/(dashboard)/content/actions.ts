"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { requirePermission } from "@/lib/auth/authorize"
import { createDraftLessonVersion } from "@/domain/content/documents"

export async function createDraftVersionAction(formData: FormData) {
  const actor = await requirePermission("content.edit")
  const lessonId = String(formData.get("lessonId") ?? "")
  const forkFromVersionId = String(formData.get("forkFromVersionId") ?? "") || undefined
  const version = await createDraftLessonVersion({ lessonId, actorId: actor.id, forkFromVersionId })
  revalidatePath("/content")
  redirect(`/content/lesson-versions/${version.id}`)
}

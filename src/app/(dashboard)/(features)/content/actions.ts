"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { requirePermission } from "@/lib/auth/authorize"
import { createDraftLessonVersion } from "@/domain/content/documents"

const EDITOR_PATHS: Record<string, string> = {
  classic: "",
  "editor-x": "/editor-x",
  "editor-tiptap": "/editor-tiptap",
}

export async function createDraftVersionAction(formData: FormData) {
  const actor = await requirePermission("content.edit")
  const lessonId = String(formData.get("lessonId") ?? "")
  const forkFromVersionId = String(formData.get("forkFromVersionId") ?? "") || undefined
  // Which editor staff wants to land on immediately - the draft itself is
  // the same either way (classic content is what gets forked; the other
  // two editors' slots start empty until saved in, same as always - see
  // documents.ts). This just skips the extra "open, then switch editors"
  // click.
  const startEditor = String(formData.get("startEditor") ?? "classic")
  const version = await createDraftLessonVersion({ lessonId, actorId: actor.id, forkFromVersionId })
  revalidatePath("/content")
  redirect(`/content/lesson-versions/${version.id}${EDITOR_PATHS[startEditor] ?? ""}`)
}

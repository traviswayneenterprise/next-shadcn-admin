"use client"

import { useRouter } from "next/navigation"

import { NewLessonDialog } from "./new-lesson-dialog"

/** Thin client wrapper so the (server) module page can render NewLessonDialog without itself needing router.refresh(). */
export function NewLessonDialogWrapper({ moduleId }: { moduleId: string }) {
  const router = useRouter()
  return <NewLessonDialog moduleId={moduleId} onCreated={() => router.refresh()} />
}

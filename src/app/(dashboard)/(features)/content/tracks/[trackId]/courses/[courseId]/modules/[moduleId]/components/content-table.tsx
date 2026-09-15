"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { DataTable } from "@/components/data-table/data-table"
import { ArchiveConfirmDialog } from "@/app/(dashboard)/(features)/content/components/archive-confirm-dialog"
import { archiveLessonAction } from "@/app/(dashboard)/(features)/content/tracks/actions"
import { buildColumns, type LessonRow } from "./columns"
import { NewDraftDialog } from "./new-draft-dialog"
import { EditLessonDialog } from "./edit-lesson-dialog"

export function ContentTable({ lessons, canEdit }: { lessons: LessonRow[]; canEdit: boolean }) {
  const router = useRouter()
  const [newDraftLesson, setNewDraftLesson] = useState<LessonRow | null>(null)
  const [editingLesson, setEditingLesson] = useState<LessonRow | null>(null)
  const [archivingLesson, setArchivingLesson] = useState<LessonRow | null>(null)

  const columns = useMemo(
    () =>
      buildColumns({
        canEdit,
        onNewDraft: setNewDraftLesson,
        onEditLesson: setEditingLesson,
        onArchiveLesson: setArchivingLesson,
      }),
    [canEdit],
  )

  return (
    <>
      <DataTable columns={columns} data={lessons} filterColumn="title" filterPlaceholder="Filter lessons..." />
      <NewDraftDialog
        lesson={newDraftLesson}
        open={newDraftLesson !== null}
        onOpenChange={(open) => {
          if (!open) setNewDraftLesson(null)
        }}
      />
      <EditLessonDialog
        lesson={editingLesson}
        open={editingLesson !== null}
        onOpenChange={(open) => !open && setEditingLesson(null)}
        onSaved={() => router.refresh()}
      />
      <ArchiveConfirmDialog
        open={archivingLesson !== null}
        onOpenChange={(open) => !open && setArchivingLesson(null)}
        itemLabel={archivingLesson?.title ?? ""}
        onConfirm={async () => {
          if (archivingLesson) await archiveLessonAction(archivingLesson.id)
        }}
      />
    </>
  )
}

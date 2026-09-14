"use client"

import { useMemo, useState } from "react"

import { DataTable } from "@/components/data-table/data-table"
import { buildColumns, type LessonRow } from "./columns"
import { NewDraftDialog } from "./new-draft-dialog"

export function ContentTable({ lessons, canEdit }: { lessons: LessonRow[]; canEdit: boolean }) {
  const [newDraftLesson, setNewDraftLesson] = useState<LessonRow | null>(null)

  const columns = useMemo(
    () => buildColumns({ canEdit, onNewDraft: setNewDraftLesson }),
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
    </>
  )
}

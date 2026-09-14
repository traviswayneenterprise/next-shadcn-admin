"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { DataTableRowActions } from "./data-table-row-actions"

export type LessonRow = {
  id: string
  title: string
  trackTitle: string
  courseTitle: string
  moduleTitle: string
  latestVersionId: string | null
  latestStatus: string | null
  latestReviewStatus: string | null
}

export function buildColumns(input: {
  canEdit: boolean
  onNewDraft: (lesson: LessonRow) => void
}): ColumnDef<LessonRow>[] {
  return [
    {
      accessorKey: "title",
      header: "Lesson",
    },
    {
      id: "path",
      header: "Track / Course / Module",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.trackTitle} / {row.original.courseTitle} / {row.original.moduleTitle}
        </span>
      ),
    },
    {
      id: "latestStatus",
      header: "Latest version",
      cell: ({ row }) =>
        row.original.latestStatus ? (
          <Badge variant="outline">{row.original.latestStatus}</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">none</span>
        ),
    },
    {
      id: "latestReviewStatus",
      header: "Review",
      cell: ({ row }) =>
        row.original.latestReviewStatus ? (
          <Badge variant="secondary">{row.original.latestReviewStatus}</Badge>
        ) : null,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DataTableRowActions row={row} canEdit={input.canEdit} onNewDraft={input.onNewDraft} />
      ),
    },
  ]
}

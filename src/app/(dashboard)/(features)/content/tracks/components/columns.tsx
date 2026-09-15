"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { CatalogRowActions } from "@/app/(dashboard)/(features)/content/components/catalog-row-actions"

export type TrackRow = {
  id: string
  title: string
  description: string
  status: string
  courseCount: number
  href: string
}

export function buildColumns(input: {
  onEdit: (track: TrackRow) => void
  onArchive: (track: TrackRow) => void
}): ColumnDef<TrackRow>[] {
  return [
    { accessorKey: "title", header: "Track" },
    {
      id: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.description || "—"}</span>
      ),
    },
    {
      id: "courseCount",
      header: "Courses",
      cell: ({ row }) => row.original.courseCount,
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <CatalogRowActions
          href={row.original.href}
          onEdit={() => input.onEdit(row.original)}
          onArchive={() => input.onArchive(row.original)}
        />
      ),
    },
  ]
}

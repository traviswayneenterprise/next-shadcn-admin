"use client"

import Link from "next/link"
import type { Route } from "next"
import { Layers } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { CatalogRowActions } from "@/app/(dashboard)/(features)/content/components/catalog-row-actions"
import type { TrackRow } from "./columns"

export function TrackCard({
  track,
  onEdit,
  onArchive,
}: {
  track: TrackRow
  onEdit: (track: TrackRow) => void
  onArchive: (track: TrackRow) => void
}) {
  return (
    <li className="rounded-lg border p-4 hover:shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted p-2">
          <Layers className="size-full" />
        </div>
        <CatalogRowActions href={track.href} onEdit={() => onEdit(track)} onArchive={() => onArchive(track)} />
      </div>
      <Link href={track.href as Route} className="block">
        <h2 className="mb-1 font-semibold hover:underline">{track.title}</h2>
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{track.description || "No description yet."}</p>
      </Link>
      <div className="flex items-center gap-2">
        <Badge variant="outline">{track.status}</Badge>
        <span className="text-xs text-muted-foreground">
          {track.courseCount} {track.courseCount === 1 ? "course" : "courses"}
        </span>
      </div>
    </li>
  )
}

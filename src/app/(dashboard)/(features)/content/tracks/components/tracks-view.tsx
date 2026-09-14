"use client"

import { useState } from "react"
import { LayoutGrid, List } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { ButtonGroup } from "@/components/ui/button-group"
import { Button } from "@/components/ui/button"
import { SimpleEditDialog } from "@/app/(dashboard)/(features)/content/components/simple-edit-dialog"
import { ArchiveConfirmDialog } from "@/app/(dashboard)/(features)/content/components/archive-confirm-dialog"
import { updateTrackAction, archiveTrackAction } from "../actions"
import { buildColumns, type TrackRow } from "./columns"
import { TrackCard } from "./track-card"

export function TracksView({ tracks }: { tracks: TrackRow[] }) {
  const [view, setView] = useState<"grid" | "list">("grid")
  const [editingTrack, setEditingTrack] = useState<TrackRow | null>(null)
  const [archivingTrack, setArchivingTrack] = useState<TrackRow | null>(null)

  const columns = buildColumns({ onEdit: setEditingTrack, onArchive: setArchivingTrack })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ButtonGroup>
          <Button size="icon-sm" variant={view === "grid" ? "secondary" : "outline"} onClick={() => setView("grid")} aria-label="Grid view">
            <LayoutGrid />
          </Button>
          <Button size="icon-sm" variant={view === "list" ? "secondary" : "outline"} onClick={() => setView("list")} aria-label="List view">
            <List />
          </Button>
        </ButtonGroup>
      </div>

      {view === "grid" ? (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track) => (
            <TrackCard key={track.id} track={track} onEdit={setEditingTrack} onArchive={setArchivingTrack} />
          ))}
        </ul>
      ) : (
        <DataTable columns={columns} data={tracks} filterColumn="title" filterPlaceholder="Filter tracks..." />
      )}

      <SimpleEditDialog
        open={editingTrack !== null}
        onOpenChange={(open) => !open && setEditingTrack(null)}
        title="Edit track"
        description="Update this track's title and description."
        action={updateTrackAction}
        hiddenFields={{ trackId: editingTrack?.id ?? "" }}
        initialTitle={editingTrack?.title ?? ""}
        initialDescription={editingTrack?.description ?? ""}
      />
      <ArchiveConfirmDialog
        open={archivingTrack !== null}
        onOpenChange={(open) => !open && setArchivingTrack(null)}
        itemLabel={archivingTrack?.title ?? ""}
        onConfirm={async () => {
          if (archivingTrack) await archiveTrackAction(archivingTrack.id)
        }}
      />
    </div>
  )
}

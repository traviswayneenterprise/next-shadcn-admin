"use client"

import { useState } from "react"
import { Folder } from "lucide-react"

import { SimpleCreateDialog } from "@/app/(dashboard)/(features)/content/components/simple-create-dialog"
import { SimpleEditDialog } from "@/app/(dashboard)/(features)/content/components/simple-edit-dialog"
import { ArchiveConfirmDialog } from "@/app/(dashboard)/(features)/content/components/archive-confirm-dialog"
import { CatalogCard } from "@/app/(dashboard)/(features)/content/components/catalog-card"
import { createModuleAction, updateModuleAction, archiveModuleAction } from "@/app/(dashboard)/(features)/content/tracks/actions"

export type ModuleRow = {
  id: string
  title: string
  description: string | null
  status: string
  lessonCount: number
  href: string
}

/** A Course's Modules, shown as a card grid - each card navigates to that module's own page, which shows its Lessons in a proper table. */
export function CourseWorkspace({
  trackId,
  courseId,
  modules,
  canEdit,
}: {
  trackId: string
  courseId: string
  modules: ModuleRow[]
  canEdit: boolean
}) {
  const [editingModule, setEditingModule] = useState<ModuleRow | null>(null)
  const [archivingModule, setArchivingModule] = useState<ModuleRow | null>(null)

  return (
    <div className="space-y-4">
      {canEdit && (
        <SimpleCreateDialog
          triggerLabel="New module"
          title="New module"
          description="Add a module to this course."
          action={createModuleAction}
          hiddenFields={{ trackId, courseId }}
        />
      )}

      {modules.length === 0 ? (
        <p className="text-sm text-muted-foreground">No modules in this course yet.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((courseModule) => (
            <CatalogCard
              key={courseModule.id}
              icon={Folder}
              title={courseModule.title}
              description={courseModule.description}
              status={courseModule.status}
              countLabel={`${courseModule.lessonCount} ${courseModule.lessonCount === 1 ? "lesson" : "lessons"}`}
              href={courseModule.href}
              onEdit={() => setEditingModule(courseModule)}
              onArchive={() => setArchivingModule(courseModule)}
            />
          ))}
        </ul>
      )}

      <SimpleEditDialog
        open={editingModule !== null}
        onOpenChange={(open) => !open && setEditingModule(null)}
        title="Edit module"
        description="Update this module's title and description."
        action={updateModuleAction}
        hiddenFields={{ trackId, courseId, moduleId: editingModule?.id ?? "" }}
        initialTitle={editingModule?.title ?? ""}
        initialDescription={editingModule?.description ?? ""}
      />
      <ArchiveConfirmDialog
        open={archivingModule !== null}
        onOpenChange={(open) => !open && setArchivingModule(null)}
        itemLabel={archivingModule?.title ?? ""}
        onConfirm={async () => {
          if (archivingModule) await archiveModuleAction({ trackId, courseId, moduleId: archivingModule.id })
        }}
      />
    </div>
  )
}

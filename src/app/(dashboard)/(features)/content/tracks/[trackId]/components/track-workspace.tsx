"use client"

import { useState } from "react"
import { BookOpen } from "lucide-react"

import { SimpleCreateDialog } from "@/app/(dashboard)/(features)/content/components/simple-create-dialog"
import { SimpleEditDialog } from "@/app/(dashboard)/(features)/content/components/simple-edit-dialog"
import { ArchiveConfirmDialog } from "@/app/(dashboard)/(features)/content/components/archive-confirm-dialog"
import { CatalogCard } from "@/app/(dashboard)/(features)/content/components/catalog-card"
import { createCourseAction, updateCourseAction, archiveCourseAction } from "@/app/(dashboard)/(features)/content/tracks/actions"

export type CourseRow = {
  id: string
  title: string
  description: string | null
  status: string
  moduleCount: number
  href: string
}

/** A Track's Courses, shown as a card grid (browsing categories) - each card navigates to that course's own page, which shows its Modules the same way. */
export function TrackWorkspace({
  trackId,
  courses,
  canEdit,
}: {
  trackId: string
  courses: CourseRow[]
  canEdit: boolean
}) {
  const [editingCourse, setEditingCourse] = useState<CourseRow | null>(null)
  const [archivingCourse, setArchivingCourse] = useState<CourseRow | null>(null)

  return (
    <div className="space-y-4">
      {canEdit && (
        <SimpleCreateDialog
          triggerLabel="New course"
          title="New course"
          description="Add a course to this track."
          action={createCourseAction}
          hiddenFields={{ trackId }}
        />
      )}

      {courses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No courses in this track yet.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CatalogCard
              key={course.id}
              icon={BookOpen}
              title={course.title}
              description={course.description}
              status={course.status}
              countLabel={`${course.moduleCount} ${course.moduleCount === 1 ? "module" : "modules"}`}
              href={course.href}
              onEdit={() => setEditingCourse(course)}
              onArchive={() => setArchivingCourse(course)}
            />
          ))}
        </ul>
      )}

      <SimpleEditDialog
        open={editingCourse !== null}
        onOpenChange={(open) => !open && setEditingCourse(null)}
        title="Edit course"
        description="Update this course's title and description."
        action={updateCourseAction}
        hiddenFields={{ trackId, courseId: editingCourse?.id ?? "" }}
        initialTitle={editingCourse?.title ?? ""}
        initialDescription={editingCourse?.description ?? ""}
      />
      <ArchiveConfirmDialog
        open={archivingCourse !== null}
        onOpenChange={(open) => !open && setArchivingCourse(null)}
        itemLabel={archivingCourse?.title ?? ""}
        onConfirm={async () => {
          if (archivingCourse) await archiveCourseAction({ trackId, courseId: archivingCourse.id })
        }}
      />
    </div>
  )
}

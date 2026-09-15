"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { SimpleCreateDialog } from "@/app/(dashboard)/(features)/content/components/simple-create-dialog"
import { SimpleEditDialog } from "@/app/(dashboard)/(features)/content/components/simple-edit-dialog"
import { ArchiveConfirmDialog } from "@/app/(dashboard)/(features)/content/components/archive-confirm-dialog"
import { CatalogRowActions } from "@/app/(dashboard)/(features)/content/components/catalog-row-actions"
import {
  createCourseAction,
  updateCourseAction,
  archiveCourseAction,
  createModuleAction,
  updateModuleAction,
  archiveModuleAction,
  archiveLessonAction,
  getModuleLessonsAction,
} from "@/app/(dashboard)/(features)/content/tracks/actions"
import { LessonItem, type LessonRow } from "./lesson-item"
import { NewLessonDialog } from "./new-lesson-dialog"
import { EditLessonDialog } from "./edit-lesson-dialog"
import { NewDraftDialog } from "./new-draft-dialog"

export type ModuleSummary = {
  id: string
  title: string
  description: string | null
  status: string
  lessonCount: number
}

export type CourseSummary = {
  id: string
  title: string
  description: string | null
  status: string
  modules: ModuleSummary[]
}

export function TrackWorkspace({
  trackId,
  courses,
  canEdit,
}: {
  trackId: string
  courses: CourseSummary[]
  canEdit: boolean
}) {
  const [openModules, setOpenModules] = useState<Set<string>>(new Set())
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, LessonRow[]>>({})
  const [loadingModules, setLoadingModules] = useState<Set<string>>(new Set())

  const [editingCourse, setEditingCourse] = useState<CourseSummary | null>(null)
  const [archivingCourse, setArchivingCourse] = useState<CourseSummary | null>(null)
  const [editingModule, setEditingModule] = useState<{ courseId: string; module: ModuleSummary } | null>(null)
  const [archivingModule, setArchivingModule] = useState<ModuleSummary | null>(null)
  const [newDraftLesson, setNewDraftLesson] = useState<LessonRow | null>(null)
  const [editingLesson, setEditingLesson] = useState<{ moduleId: string; lesson: LessonRow } | null>(null)
  const [archivingLesson, setArchivingLesson] = useState<{ moduleId: string; lesson: LessonRow } | null>(null)

  async function loadLessons(moduleId: string) {
    setLoadingModules((prev) => new Set(prev).add(moduleId))
    try {
      const lessons = await getModuleLessonsAction(moduleId)
      setLessonsByModule((prev) => ({ ...prev, [moduleId]: lessons }))
    } finally {
      setLoadingModules((prev) => {
        const next = new Set(prev)
        next.delete(moduleId)
        return next
      })
    }
  }

  function toggleModule(moduleId: string, open: boolean) {
    setOpenModules((prev) => {
      const next = new Set(prev)
      if (open) next.add(moduleId)
      else next.delete(moduleId)
      return next
    })
    if (open && !lessonsByModule[moduleId]) {
      loadLessons(moduleId)
    }
  }

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

      {courses.length === 0 && <p className="text-sm text-muted-foreground">No courses in this track yet.</p>}

      <ul className="space-y-2">
        {courses.map((course) => (
          <li key={course.id} className="rounded-lg border">
            <Collapsible className="group/collapsible">
              <div className="flex items-center justify-between gap-2 p-3">
                <CollapsibleTrigger
                  render={<button type="button" className="flex flex-1 items-center gap-2 text-left" />}
                >
                  <ChevronRight className="size-4 shrink-0 transition-transform group-data-[panel-open]/collapsible:rotate-90" />
                  <span className="font-medium">{course.title}</span>
                  <Badge variant="outline">{course.status}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {course.modules.length} {course.modules.length === 1 ? "module" : "modules"}
                  </span>
                </CollapsibleTrigger>
                {canEdit && (
                  <CatalogRowActions onEdit={() => setEditingCourse(course)} onArchive={() => setArchivingCourse(course)} />
                )}
              </div>
              <CollapsibleContent className="space-y-2 border-t px-3 pb-3 pt-2">
                {course.description && <p className="text-xs text-muted-foreground">{course.description}</p>}
                <ul className="space-y-1.5 pl-4">
                  {course.modules.map((courseModule) => {
                    const isOpen = openModules.has(courseModule.id)
                    const lessons = lessonsByModule[courseModule.id]
                    const isLoading = loadingModules.has(courseModule.id)
                    return (
                      <li key={courseModule.id} className="rounded-md border">
                        <Collapsible
                          open={isOpen}
                          onOpenChange={(open) => toggleModule(courseModule.id, open)}
                          className="group/collapsible"
                        >
                          <div className="flex items-center justify-between gap-2 p-2.5">
                            <CollapsibleTrigger
                              render={<button type="button" className="flex flex-1 items-center gap-2 text-left" />}
                            >
                              <ChevronRight className="size-3.5 shrink-0 transition-transform group-data-[panel-open]/collapsible:rotate-90" />
                              <span className="text-sm font-medium">{courseModule.title}</span>
                              <Badge variant="outline">{courseModule.status}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {courseModule.lessonCount} {courseModule.lessonCount === 1 ? "lesson" : "lessons"}
                              </span>
                            </CollapsibleTrigger>
                            {canEdit && (
                              <CatalogRowActions
                                onEdit={() => setEditingModule({ courseId: course.id, module: courseModule })}
                                onArchive={() => setArchivingModule(courseModule)}
                              />
                            )}
                          </div>
                          <CollapsibleContent className="space-y-2 border-t px-2.5 pb-2.5 pt-2">
                            {isLoading || !lessons ? (
                              <p className="px-2 text-xs text-muted-foreground">Loading lessons...</p>
                            ) : lessons.length === 0 ? (
                              <p className="px-2 text-xs text-muted-foreground">No lessons yet.</p>
                            ) : (
                              <ul className="space-y-1">
                                {lessons.map((lesson) => (
                                  <LessonItem
                                    key={lesson.id}
                                    lesson={lesson}
                                    canEdit={canEdit}
                                    onNewDraft={setNewDraftLesson}
                                    onEdit={(l) => setEditingLesson({ moduleId: courseModule.id, lesson: l })}
                                    onArchive={(l) => setArchivingLesson({ moduleId: courseModule.id, lesson: l })}
                                  />
                                ))}
                              </ul>
                            )}
                            {canEdit && (
                              <NewLessonDialog
                                moduleId={courseModule.id}
                                onCreated={() => loadLessons(courseModule.id)}
                              />
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      </li>
                    )
                  })}
                </ul>
                {canEdit && (
                  <SimpleCreateDialog
                    triggerLabel="+ New module"
                    triggerVariant="outline"
                    title="New module"
                    description={`Add a module to "${course.title}".`}
                    action={createModuleAction}
                    hiddenFields={{ trackId, courseId: course.id }}
                  />
                )}
              </CollapsibleContent>
            </Collapsible>
          </li>
        ))}
      </ul>

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

      <SimpleEditDialog
        open={editingModule !== null}
        onOpenChange={(open) => !open && setEditingModule(null)}
        title="Edit module"
        description="Update this module's title and description."
        action={updateModuleAction}
        hiddenFields={{ trackId, moduleId: editingModule?.module.id ?? "" }}
        initialTitle={editingModule?.module.title ?? ""}
        initialDescription={editingModule?.module.description ?? ""}
      />
      <ArchiveConfirmDialog
        open={archivingModule !== null}
        onOpenChange={(open) => !open && setArchivingModule(null)}
        itemLabel={archivingModule?.title ?? ""}
        onConfirm={async () => {
          if (archivingModule) await archiveModuleAction({ trackId, moduleId: archivingModule.id })
        }}
      />

      <NewDraftDialog
        lesson={newDraftLesson}
        open={newDraftLesson !== null}
        onOpenChange={(open) => !open && setNewDraftLesson(null)}
      />
      <EditLessonDialog
        lesson={editingLesson?.lesson ?? null}
        open={editingLesson !== null}
        onOpenChange={(open) => !open && setEditingLesson(null)}
        onSaved={() => {
          if (editingLesson) loadLessons(editingLesson.moduleId)
        }}
      />
      <ArchiveConfirmDialog
        open={archivingLesson !== null}
        onOpenChange={(open) => !open && setArchivingLesson(null)}
        itemLabel={archivingLesson?.lesson.title ?? ""}
        onConfirm={async () => {
          if (archivingLesson) {
            await archiveLessonAction(archivingLesson.lesson.id)
            await loadLessons(archivingLesson.moduleId)
          }
        }}
      />
    </div>
  )
}

"use client"

import { useTransition } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { updateLessonAction } from "@/app/(dashboard)/(features)/content/tracks/actions"
import type { LessonRow } from "./lesson-item"

export function EditLessonDialog({
  lesson,
  open,
  onOpenChange,
  onSaved,
}: {
  lesson: LessonRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      try {
        await updateLessonAction(formData)
        onOpenChange(false)
        onSaved()
      } catch {
        toast({ title: "Couldn't save", description: "Try again.", variant: "destructive" })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit lesson</DialogTitle>
          <DialogDescription>Update this lesson&apos;s title and estimated length.</DialogDescription>
        </DialogHeader>
        {lesson && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="hidden" name="lessonId" value={lesson.id} />
            <div className="space-y-1.5">
              <Label htmlFor="edit-lesson-title">Title</Label>
              <Input id="edit-lesson-title" name="title" required defaultValue={lesson.title} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-lesson-minutes">Estimated minutes</Label>
              <Input
                id="edit-lesson-minutes"
                name="estimatedMinutes"
                type="number"
                min={1}
                defaultValue={lesson.estimatedMinutes ?? undefined}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

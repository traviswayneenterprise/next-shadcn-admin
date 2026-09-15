"use client"

import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createLessonAction } from "@/app/(dashboard)/(features)/content/tracks/actions"

export function NewLessonDialog({ moduleId, onCreated }: { moduleId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      try {
        await createLessonAction(formData)
        setOpen(false)
        onCreated()
      } catch {
        toast({ title: "Couldn't create lesson", description: "Try again.", variant: "destructive" })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>+ New lesson</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New lesson</DialogTitle>
          <DialogDescription>
            Creates the lesson with an initial empty classic draft, ready to open in any of the three
            editors.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="hidden" name="moduleId" value={moduleId} />
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="estimatedMinutes">Estimated minutes</Label>
            <Input id="estimatedMinutes" name="estimatedMinutes" type="number" min={1} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

/**
 * Edit form for Track/Course/Module: title + description, pre-filled.
 * Sibling of SimpleCreateDialog, controlled open state instead of its own
 * trigger since it's opened from a row/tile action menu. Same
 * invoke-directly-and-close-on-success pattern as SimpleCreateDialog.
 */
export function SimpleEditDialog({
  open,
  onOpenChange,
  title,
  description,
  action,
  hiddenFields,
  initialTitle,
  initialDescription,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  action: (formData: FormData) => Promise<void>
  hiddenFields: Record<string, string>
  initialTitle: string
  initialDescription: string
}) {
  const [titleValue, setTitleValue] = useState(initialTitle)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      try {
        await action(formData)
        onOpenChange(false)
        router.refresh()
      } catch {
        toast({ title: "Couldn't save", description: "Try again.", variant: "destructive" })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              name="title"
              required
              value={titleValue}
              onChange={(event) => setTitleValue(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea id="edit-description" name="description" rows={3} defaultValue={initialDescription} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

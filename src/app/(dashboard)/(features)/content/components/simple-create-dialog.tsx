"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button, type buttonVariants } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import type { VariantProps } from "class-variance-authority"

/**
 * A "New Track/Course/Module" dialog: title + description, plus whatever
 * hidden identifiers (e.g. trackId) the action needs. Reused across the
 * three catalog levels since their creation forms are otherwise identical.
 * The action is invoked directly (not a native <form action>) so this
 * dialog can close itself on success - Track creation still redirects to
 * its new page from inside the action itself (which still works when
 * invoked this way), while Course/Module/Lesson creation just revalidates
 * the current accordion in place with no navigation.
 */
export function SimpleCreateDialog({
  triggerLabel,
  triggerVariant = "default",
  triggerSize = "sm",
  title,
  description,
  action,
  hiddenFields,
}: {
  triggerLabel: string
  triggerVariant?: VariantProps<typeof buttonVariants>["variant"]
  triggerSize?: VariantProps<typeof buttonVariants>["size"]
  title: string
  description: string
  action: (formData: FormData) => Promise<void>
  hiddenFields?: Record<string, string>
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      try {
        await action(formData)
        setOpen(false)
        router.refresh()
      } catch {
        toast({ title: "Couldn't create", description: "Try again.", variant: "destructive" })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={triggerVariant} size={triggerSize} />}>{triggerLabel}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {hiddenFields &&
            Object.entries(hiddenFields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} />
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

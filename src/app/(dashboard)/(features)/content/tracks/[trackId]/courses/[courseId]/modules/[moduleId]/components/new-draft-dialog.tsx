"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createDraftVersionAction } from "@/app/(dashboard)/(features)/content/actions"
import type { LessonRow } from "./columns"

const EDITOR_OPTIONS = [
  { value: "classic", label: "Classic", description: "The original block-based editor." },
  { value: "editor-x", label: "Editor X", description: "Lexical-based rich text editor (trial)." },
  { value: "editor-tiptap", label: "Tiptap", description: "Tiptap/ProseMirror-based editor (trial)." },
] as const

export function NewDraftDialog({
  lesson,
  open,
  onOpenChange,
}: {
  lesson: LessonRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [startEditor, setStartEditor] = useState<string>("classic")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New draft{lesson ? ` — ${lesson.title}` : ""}</DialogTitle>
          <DialogDescription>
            Choose which editor to start in. The classic content carries over either way; Editor X and
            Tiptap each keep their own independent draft and start blank until you save in them.
          </DialogDescription>
        </DialogHeader>
        {lesson && (
          <form action={createDraftVersionAction}>
            <input type="hidden" name="lessonId" value={lesson.id} />
            <input type="hidden" name="forkFromVersionId" value={lesson.latestVersionId ?? ""} />
            <input type="hidden" name="startEditor" value={startEditor} />
            <RadioGroup value={startEditor} onValueChange={setStartEditor} className="py-2">
              {EDITOR_OPTIONS.map((editor) => (
                <Label
                  key={editor.value}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-input p-3 has-data-checked:border-primary"
                >
                  <RadioGroupItem value={editor.value} className="mt-0.5" />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{editor.label}</span>
                    <span className="text-xs font-normal text-muted-foreground">{editor.description}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
            <DialogFooter>
              <Button type="submit">Create draft</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

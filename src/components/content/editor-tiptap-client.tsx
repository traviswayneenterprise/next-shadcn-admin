"use client"

import { useRef, useTransition } from "react"
import type { Editor } from "@tiptap/react"
import type { JSONContent } from "@tiptap/core"

import { TiptapEditor } from "@/components/editor-tiptap/editor"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getCsrfHeaders } from "@/lib/auth/csrf-client"

export function EditorTiptapClient({
  versionId,
  initialContent,
}: {
  versionId: string
  /** A ProseMirror/Tiptap JSONContent document, or null to start from an empty document. */
  initialContent: JSONContent | null
}) {
  const { toast } = useToast()
  const editorRef = useRef<Editor | null>(null)
  const [isPending, startTransition] = useTransition()

  function save() {
    const editor = editorRef.current
    if (!editor) return
    startTransition(async () => {
      const json = editor.getJSON()
      try {
        const response = await fetch(`/api/v1/content/lesson-versions/${versionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
          body: JSON.stringify({ schemaVersion: 3, blocks: json }),
        })
        // A slow/degraded connection (or a request that timed out server-side)
        // can come back with no body at all - .json() would throw and never
        // reach the toast below, leaving the user with a silent failure.
        const body = await response.json().catch(() => null)
        if (response.ok) {
          toast({ title: "Draft saved" })
        } else {
          toast({
            title: "Save failed",
            description: body?.error?.message ?? "The server didn't respond in time. Check your connection and try again.",
            variant: "destructive",
          })
        }
      } catch {
        toast({
          title: "Save failed",
          description: "Couldn't reach the server. Check your connection and try again.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex justify-end">
        <Button onClick={save} disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>
      <div className="flex min-h-0 flex-1">
        <TiptapEditor
          initialContent={initialContent ?? undefined}
          onEditor={(editor) => {
            editorRef.current = editor
          }}
        />
      </div>
    </div>
  )
}

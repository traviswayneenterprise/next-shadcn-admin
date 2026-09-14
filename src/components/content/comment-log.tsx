"use client"

import { useState, useTransition } from "react"
import { formatDistanceToNow } from "date-fns"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { getCsrfHeaders } from "@/lib/auth/csrf-client"

type CommentItem = {
  id: string
  body: string
  createdAt: string | Date
  author: { name: string | null } | null
}

/** A manually-typed note thread on a draft (e.g. "switched to Tiptap because..."), distinct from ActivityLog's automatic save/publish record. */
export function CommentLog({
  lessonVersionId,
  initialComments,
}: {
  lessonVersionId: string
  initialComments: CommentItem[]
}) {
  const { toast } = useToast()
  const [comments, setComments] = useState(initialComments)
  const [draft, setDraft] = useState("")
  const [isPending, startTransition] = useTransition()

  function submit() {
    const body = draft.trim()
    if (!body) return
    startTransition(async () => {
      try {
        const response = await fetch(`/api/v1/content/lesson-versions/${lessonVersionId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
          body: JSON.stringify({ body }),
        })
        const result = await response.json().catch(() => null)
        if (response.ok && result?.data) {
          setComments((prev) => [...prev, result.data])
          setDraft("")
        } else {
          toast({
            title: "Couldn't post comment",
            description: result?.error?.message ?? "The server didn't respond in time. Try again.",
            variant: "destructive",
          })
        }
      } catch {
        toast({ title: "Couldn't post comment", description: "Couldn't reach the server.", variant: "destructive" })
      }
    })
  }

  return (
    <div className="space-y-3">
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="space-y-2">
          {comments.map((comment) => (
            <li key={comment.id} className="text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{comment.author?.name ?? "Someone"}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-muted-foreground">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-2">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Leave a note for other staff (e.g. why you switched editors)..."
          rows={2}
          className="text-sm"
        />
        <Button size="sm" className="self-end" onClick={submit} disabled={isPending || !draft.trim()}>
          {isPending ? "Posting..." : "Post"}
        </Button>
      </div>
    </div>
  )
}

import { listLessonVersionComments } from "@/domain/content/comments"
import { ActivityLog } from "@/components/content/activity-log"
import { CommentLog } from "@/components/content/comment-log"

/** The activity feed (automatic, from AuditEvent) and comment thread (manual staff notes) for one lesson version - shown consistently across Classic, Editor X, and Tiptap so switching editors doesn't lose track of what happened. */
export async function LessonVersionSidePanel({ lessonVersionId }: { lessonVersionId: string }) {
  const comments = await listLessonVersionComments(lessonVersionId)

  return (
    <div className="grid shrink-0 grid-cols-1 gap-4 border-t border-border pt-4 md:grid-cols-2">
      <section className="rounded-lg border p-3">
        <h2 className="mb-2 text-sm font-semibold">Activity</h2>
        <ActivityLog lessonVersionId={lessonVersionId} />
      </section>
      <section className="rounded-lg border p-3">
        <h2 className="mb-2 text-sm font-semibold">Comments</h2>
        <CommentLog
          lessonVersionId={lessonVersionId}
          initialComments={comments.map((comment) => ({ ...comment, author: comment.author ? { name: comment.author.name } : null }))}
        />
      </section>
    </div>
  )
}

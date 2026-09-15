import { formatDistanceToNow } from "date-fns"

import { prisma } from "@/lib/db"

const ACTION_LABELS: Record<string, string> = {
  "lesson.version.draft_saved": "saved a draft",
  "lesson.version.published": "published this version",
}

function schemaVersionLabel(schemaVersion: unknown) {
  switch (schemaVersion) {
    case 1:
      return "Classic"
    case 2:
      return "Editor X"
    case 3:
      return "Tiptap"
    default:
      return null
  }
}

/** A read-only, automatic timeline of what happened to a lesson version - who saved which editor and when, and when it was published. Reuses the AuditEvent table already used for publish events. */
export async function ActivityLog({ lessonVersionId }: { lessonVersionId: string }) {
  const events = await prisma.auditEvent.findMany({
    where: { resourceType: "LessonVersion", resourceId: lessonVersionId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { actor: true },
  })

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>
  }

  return (
    <ul className="space-y-2 text-sm">
      {events.map((event) => {
        const metadata = event.metadata as { schemaVersion?: unknown } | null
        const editorLabel = schemaVersionLabel(metadata?.schemaVersion)
        return (
          <li key={event.id} className="flex items-baseline justify-between gap-2 border-b border-border/50 pb-2 last:border-0">
            <span>
              <span className="font-medium">{event.actor?.name ?? "Someone"}</span>{" "}
              {ACTION_LABELS[event.action] ?? event.action}
              {editorLabel ? ` (${editorLabel})` : ""}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDistanceToNow(event.createdAt, { addSuffix: true })}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { getCurrentSession } from "@/lib/auth/current-session"
import { getGlobalPermissions } from "@/lib/auth/permissions"
import { validateContentDocument } from "@/domain/content/blocks"
import { migrateDocumentToLexical } from "@/domain/content/migrate-to-lexical"
import { prisma } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { HeaderContainer } from "@/components/ui/header-container"
import { EditorXClient } from "@/components/content/editor-x-client"

export default async function LessonVersionEditorXPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession()
  if (!session) redirect("/auth/sign-in")
  const permissions = await getGlobalPermissions(session.userId)
  if (!permissions.includes("content.edit")) redirect("/403")

  const { id } = await params
  const version = await prisma.lessonVersion.findUnique({
    where: { id },
    include: { lesson: true, document: true },
  })
  if (!version) notFound()

  // Published versions are immutable - editor-x only ever edits drafts,
  // exactly like the v1 editor.
  if (version.status !== "DRAFT") {
    redirect(`/content/lesson-versions/${version.id}`)
  }

  const initialState: Record<string, unknown> =
    version.document.schemaVersion === 2
      ? (version.document.blocks as Record<string, unknown>)
      : await migrateDocumentToLexical(
          validateContentDocument({ schemaVersion: 1, blocks: version.document.blocks }),
        )

  return (
    <>
      <HeaderContainer>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{version.lesson.title}</h1>
          <Badge variant="secondary">Editor X preview</Badge>
          {version.document.schemaVersion === 1 && <Badge variant="outline">Migrated from v1 - save to keep</Badge>}
        </div>
        <Link href={`/content/lesson-versions/${version.id}`} className="text-sm text-muted-foreground underline">
          Back to current editor
        </Link>
      </HeaderContainer>
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <EditorXClient versionId={version.id} initialState={initialState} />
      </div>
    </>
  )
}
